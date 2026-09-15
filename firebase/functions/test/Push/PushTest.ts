import { expect } from "chai"
import {
    FakePushWrapper,
    PushWrapper,
    setPushWrapperForTests,
    WebPushWrapper,
} from "../../src/DependencyWrappers/PushWrapper/index.js"
import { pushDigestService, pushService, renderPushTemplate } from "../../src/Services/Push/index.js"
import { analyticsService } from "../../src/Services/Analytics/AnalyticsService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import {
    asUser,
    executeGql,
    executeGqlAt,
    firstGqlError,
    testHarnessPrincipal,
} from "../Utils/Gql/GqlUtils.js"
import { addDefaults } from "../Utils/TestContext.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"

/** A transport with no configured channel, for exercising degraded mode. */
class UnconfiguredPushWrapper implements PushWrapper {
    sendAttempts = 0

    isConfigured(): boolean {
        return false
    }

    async sendWebPush(): Promise<"SENT"> {
        this.sendAttempts += 1
        return "SENT"
    }

    async sendNativePush(): Promise<"SENT"> {
        this.sendAttempts += 1
        return "SENT"
    }
}

const registerPushDeviceMutation = `
    mutation RegisterPushDevice($input: RegisterPushDeviceInput!) {
        registerPushDevice(input: $input) {
            id
            platform
            endpoint
            createdTime
            rotatedTime
        }
    }
`

const unregisterPushDeviceMutation = `
    mutation UnregisterPushDevice($input: UnregisterPushDeviceInput!) {
        unregisterPushDevice(input: $input)
    }
`

interface GqlPushDeviceResult {
    id: string
    platform: string
    endpoint: string
    createdTime: string
    rotatedTime: string
}

function subscriptionJsonFor(endpoint: string): string {
    return JSON.stringify({ endpoint, keys: { p256dh: "p256dh-key", auth: "auth-secret" } })
}

function registerInput(
    endpoint: string,
    overrides: Partial<{ platform: string; subscriptionJson: string }> = {},
): Record<string, unknown> {
    return {
        input: {
            platform: "WEB",
            endpoint,
            subscriptionJson: subscriptionJsonFor(endpoint),
            ...overrides,
        },
    }
}

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so the wrapper sees the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

const BROWSER_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/126.0.0.0 Safari/537.36"

describe("Push", function () {
    afterEach(function () {
        setPushWrapperForTests(undefined)
    })

    describe("renderPushTemplate", function () {
        it("substitutes variables into title and body", function () {
            const rendered = renderPushTemplate("activityDigest", { pageviews: "42" })
            expect(rendered.title).to.equal("Your activity digest")
            expect(rendered.body).to.contain("42 pageviews")
        })

        it("throws INTERNAL when a template variable is missing", function () {
            expect(() => renderPushTemplate("activityDigest", {})).to.throw(/needs variable/)
        })
    })

    describe("registration mutations", function () {
        // The gate throws from the Apollo request pipeline (not a resolver),
        // matching the storage/payments precedent for anonymous callers.
        it("requires an authenticated caller", async function () {
            await expect(
                executeGql(
                    this.apolloServer,
                    registerPushDeviceMutation,
                    registerInput("https://push.example/e1"),
                    null,
                ),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })

        it("requires an application user behind the principal", async function () {
            const response = await executeGql(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                testHarnessPrincipal,
            )
            expect(firstGqlError(response).code).to.equal("UNAUTHENTICATED")
        })

        it("registers a web device and returns it", async function () {
            await addDefaults(this, ["account", "user"])
            const device = await executeGqlAt<GqlPushDeviceResult>(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                asUser(this.defaults.user!),
            )
            expect(device.platform).to.equal("WEB")
            expect(device.endpoint).to.equal("https://push.example/e1")
            expect(device.createdTime).to.not.equal(undefined)
            expect(device.rotatedTime).to.not.equal(undefined)
        })

        it("upserts on the endpoint instead of duplicating", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const first = await executeGqlAt<GqlPushDeviceResult>(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                principal,
            )
            const second = await executeGqlAt<GqlPushDeviceResult>(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                principal,
            )
            expect(second.id).to.equal(first.id)

            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            await pushService.sendPush({
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest",
                variables: { pageviews: "1" },
            })
            expect(push.sentNotifications).to.have.length(1)
        })

        it("rotates an endpoint to whoever registered it last", async function () {
            await addDefaults(this, ["account", "user"])
            const firstUser = this.defaults.user!
            const secondUser = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )

            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/shared"),
                "registerPushDevice",
                asUser(firstUser),
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/shared"),
                "registerPushDevice",
                asUser(secondUser),
            )

            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            const digestVariables = { pageviews: "1" } as const
            const sentToFirst = await pushService.sendPush({
                toAppUserId: firstUser.id,
                templateKey: "activityDigest",
                variables: digestVariables,
            })
            const sentToSecond = await pushService.sendPush({
                toAppUserId: secondUser.id,
                templateKey: "activityDigest",
                variables: digestVariables,
            })
            expect(sentToFirst).to.equal(false)
            expect(sentToSecond).to.equal(true)
            expect(push.sentNotifications).to.have.length(1)
        })

        it("refuses subscription JSON that is not the browser's PushSubscription", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)

            const notJson = await executeGql(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1", { subscriptionJson: "not json" }),
                principal,
            )
            expect(firstGqlError(notJson).code).to.equal("INVALID_ARGUMENT")

            const mismatched = await executeGql(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1", {
                    subscriptionJson: subscriptionJsonFor("https://push.example/other"),
                }),
                principal,
            )
            expect(firstGqlError(mismatched).code).to.equal("INVALID_ARGUMENT")

            const missingKeys = await executeGql(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1", {
                    subscriptionJson: JSON.stringify({ endpoint: "https://push.example/e1" }),
                }),
                principal,
            )
            expect(firstGqlError(missingKeys).code).to.equal("INVALID_ARGUMENT")
        })

        it("unregisters idempotently and only for the owner", async function () {
            await addDefaults(this, ["account", "user"])
            const owner = this.defaults.user!
            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                asUser(owner),
            )

            // A stranger's unregister does not touch the owner's registration.
            const strangerResult = await executeGqlAt<boolean>(
                this.apolloServer,
                unregisterPushDeviceMutation,
                { input: { endpoint: "https://push.example/e1" } },
                "unregisterPushDevice",
                asUser(stranger),
            )
            expect(strangerResult).to.equal(false)

            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            const stillDelivers = await pushService.sendPush({
                toAppUserId: owner.id,
                templateKey: "activityDigest",
                variables: { pageviews: "1" },
            })
            expect(stillDelivers).to.equal(true)

            const removed = await executeGqlAt<boolean>(
                this.apolloServer,
                unregisterPushDeviceMutation,
                { input: { endpoint: "https://push.example/e1" } },
                "unregisterPushDevice",
                asUser(owner),
            )
            expect(removed).to.equal(true)

            const afterRemoval = await pushService.sendPush({
                toAppUserId: owner.id,
                templateKey: "activityDigest",
                variables: { pageviews: "1" },
            })
            expect(afterRemoval).to.equal(false)

            const removedAgain = await executeGqlAt<boolean>(
                this.apolloServer,
                unregisterPushDeviceMutation,
                { input: { endpoint: "https://push.example/e1" } },
                "unregisterPushDevice",
                asUser(owner),
            )
            expect(removedAgain).to.equal(false)
        })
    })

    describe("pushService.sendPush", function () {
        it("renders and fans out to every registered device", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e2"),
                "registerPushDevice",
                principal,
            )

            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            const sent = await pushService.sendPush({
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest",
                variables: { pageviews: "7" },
            })

            expect(sent).to.equal(true)
            expect(push.sentNotifications).to.have.length(2)
            const message = push.lastNotificationTo("https://push.example/e2")
            expect(message?.title).to.equal("Your activity digest")
            expect(message?.body).to.contain("7 pageviews")
        })

        it("degrades to a no-op when the user has no devices", async function () {
            await addDefaults(this, ["account", "user"])
            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            const sent = await pushService.sendPush({
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest",
                variables: { pageviews: "1" },
            })
            expect(sent).to.equal(false)
            expect(push.sentNotifications).to.have.length(0)
        })

        it("degrades to a no-op when no channel is configured", async function () {
            await addDefaults(this, ["account", "user"])
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                asUser(this.defaults.user!),
            )

            const unconfigured = new UnconfiguredPushWrapper()
            setPushWrapperForTests(unconfigured)
            const sent = await pushService.sendPush({
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest",
                variables: { pageviews: "1" },
            })
            expect(sent).to.equal(false)
            expect(unconfigured.sendAttempts).to.equal(0)
        })

        it("fans out to native devices through their channel and prunes gone tokens", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            // Native registrations carry the device token as the endpoint and
            // no subscription JSON (that's a Web Push concept).
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("apns-token-alive", { platform: "IOS", subscriptionJson: "" }),
                "registerPushDevice",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("fcm-token-gone", { platform: "ANDROID", subscriptionJson: "" }),
                "registerPushDevice",
                principal,
            )

            const push = new FakePushWrapper()
            push.goneEndpoints.add("fcm-token-gone")
            setPushWrapperForTests(push)

            const digest = {
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest" as const,
                variables: { pageviews: "3" },
            }
            const sent = await pushService.sendPush(digest)
            expect(sent).to.equal(true)
            expect(push.sentNotifications).to.have.length(1)
            const delivered = push.lastNotificationTo("apns-token-alive")
            expect(delivered?.channel).to.equal("IOS")
            expect(delivered?.body).to.contain("3 pageviews")

            // The unregistered token was pruned: the next send fans out to
            // the surviving iOS device only.
            await pushService.sendPush(digest)
            expect(push.sentNotifications).to.have.length(2)
            expect(
                push.sentNotifications.every((notification) => notification.endpoint === "apns-token-alive"),
            ).to.equal(true)
        })

        it("prunes subscriptions the push service reports gone", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/gone"),
                "registerPushDevice",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/alive"),
                "registerPushDevice",
                principal,
            )

            const push = new FakePushWrapper()
            push.goneEndpoints.add("https://push.example/gone")
            setPushWrapperForTests(push)

            const digest = {
                toAppUserId: this.defaults.user!.id,
                templateKey: "activityDigest" as const,
                variables: { pageviews: "1" },
            }
            const sent = await pushService.sendPush(digest)
            expect(sent).to.equal(true)
            expect(push.sentNotifications).to.have.length(1)
            expect(push.lastNotificationTo("https://push.example/gone")).to.equal(undefined)

            // The gone registration was pruned: the next send only fans out
            // to the surviving device.
            await pushService.sendPush(digest)
            expect(push.sentNotifications).to.have.length(2)
            expect(
                push.sentNotifications.every(
                    (notification) => notification.endpoint === "https://push.example/alive",
                ),
            ).to.equal(true)
        })
    })

    describe("the activity-digest exemplar", function () {
        it("pushes the recent pageview count to every user with a device", async function () {
            await addDefaults(this, ["account", "user"])
            const withDevice = this.defaults.user!
            // A second user with no registered device must receive nothing.
            await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            await executeGqlAt(
                this.apolloServer,
                registerPushDeviceMutation,
                registerInput("https://push.example/e1"),
                "registerPushDevice",
                asUser(withDevice),
            )

            // Two recorded pageviews land in the digest's count window. (The
            // beacon endpoint is the analytics kernel's HTTP surface; the
            // service call is its tested seam, see test/Analytics.)
            await analyticsService.recordPageview({ path: "/", ip: "203.0.113.9", userAgent: BROWSER_UA })
            await analyticsService.recordPageview({ path: "/x", ip: "203.0.113.9", userAgent: BROWSER_UA })

            const push = new FakePushWrapper()
            setPushWrapperForTests(push)
            await pushDigestService.sendActivityDigest()

            expect(push.sentNotifications).to.have.length(1)
            expect(push.sentNotifications[0].endpoint).to.equal("https://push.example/e1")
            expect(push.sentNotifications[0].body).to.contain("2 pageviews")
        })
    })

    describe("WebPushWrapper.isConfigured", function () {
        const liveEnv = {
            PUSH_MODE: "live",
            VAPID_PUBLIC_KEY: "public-key",
            VAPID_PRIVATE_KEY: "private-key",
        }

        it("reports WEB configured only with PUSH_MODE=live and a full VAPID keypair", async function () {
            const wrapper = new WebPushWrapper()
            await withEnv(liveEnv, async () => {
                expect(wrapper.isConfigured("WEB")).to.equal(true)
            })
            await withEnv({ ...liveEnv, PUSH_MODE: "local" }, async () => {
                expect(wrapper.isConfigured("WEB")).to.equal(false)
            })
            await withEnv({ ...liveEnv, VAPID_PUBLIC_KEY: "" }, async () => {
                expect(wrapper.isConfigured("WEB")).to.equal(false)
            })
            await withEnv({ ...liveEnv, VAPID_PRIVATE_KEY: undefined }, async () => {
                expect(wrapper.isConfigured("WEB")).to.equal(false)
            })
        })

        it("reports IOS configured only with the full APNS_* credential set", async function () {
            const wrapper = new WebPushWrapper()
            const apnsEnv = {
                ...liveEnv,
                APNS_TEAM_ID: "TEAM123456",
                APNS_KEY_ID: "KEY1234567",
                APNS_PRIVATE_KEY: Buffer.from("-----BEGIN PRIVATE KEY-----").toString("base64"),
                APNS_BUNDLE_ID: "com.example.app",
            }
            await withEnv(liveEnv, async () => {
                expect(wrapper.isConfigured("IOS")).to.equal(false)
            })
            await withEnv(apnsEnv, async () => {
                expect(wrapper.isConfigured("IOS")).to.equal(true)
            })
            await withEnv({ ...apnsEnv, APNS_BUNDLE_ID: "" }, async () => {
                expect(wrapper.isConfigured("IOS")).to.equal(false)
            })
            await withEnv({ ...apnsEnv, PUSH_MODE: "local" }, async () => {
                expect(wrapper.isConfigured("IOS")).to.equal(false)
            })
        })

        it("reports ANDROID configured only with a parseable FCM service account", async function () {
            const wrapper = new WebPushWrapper()
            const serviceAccount = Buffer.from(
                JSON.stringify({
                    project_id: "example-project",
                    client_email: "push@example-project.iam.gserviceaccount.com",
                    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
                }),
                "utf8",
            ).toString("base64")
            await withEnv(liveEnv, async () => {
                expect(wrapper.isConfigured("ANDROID")).to.equal(false)
            })
            await withEnv({ ...liveEnv, FCM_SERVICE_ACCOUNT: serviceAccount }, async () => {
                expect(wrapper.isConfigured("ANDROID")).to.equal(true)
            })
            // A malformed staged value degrades to not-configured, never a
            // mid-send error.
            await withEnv({ ...liveEnv, FCM_SERVICE_ACCOUNT: "not base64 json" }, async () => {
                expect(wrapper.isConfigured("ANDROID")).to.equal(false)
            })
        })
    })
})
