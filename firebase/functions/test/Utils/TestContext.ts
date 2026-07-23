import assert from "node:assert/strict"
import { SinonSpy } from "sinon"
import { GqlAccount, GqlProject, GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { BaseApolloServer } from "../../src/Graphql/GraphqlServer.js"
import { IdentityTestHelper } from "../Identity/IdentityTestHelper.js"
import { ProjectTestHelper } from "../Project/ProjectTestHelper.js"
import { buildCreateProjectInput } from "./Factories/ProjectFactory.js"
import { buildCreateUserFields, buildCreateUserInput } from "./Factories/UserFactory.js"
import { TestPubSubWrapper } from "./TestPubSubWrapper.js"

/**
 * Augment the Mocha test Context - this merges with the existing Context
 * declaration, so `this` inside `it(..., function () {})` blocks carries the
 * harness: the Apollo server, domain helpers, per-test defaults, and fakes.
 */
declare module "mocha" {
    export interface Context {
        apolloServer: BaseApolloServer
        identityHelper: IdentityTestHelper
        projectHelper: ProjectTestHelper
        defaults: DefaultObjects
        fakes: TestFakes
        pubSubWrapper: TestPubSubWrapper
    }
}

export type TestContext = Mocha.Context

/**
 * Default objects (an account, a user, ...) that addDefaults attaches so
 * individual tests don't have to build their prerequisites.
 */
export interface DefaultObjects {
    account?: GqlAccount
    user?: GqlUser
    project?: GqlProject
}

export type DefaultObjectType = keyof DefaultObjects

export interface TestFakes {
    pubSub: {
        publishBytes: SinonSpy<[string, Uint8Array], Promise<void>>
    }
}

/**
 * Adds default test objects to a test context. It only adds what is missing;
 * existing defaults are preserved. Prerequisites are checked explicitly so a
 * misordered request fails with a clear message.
 */
export async function addDefaults(
    context: TestContext,
    defaultTypes: readonly DefaultObjectType[],
): Promise<void> {
    const defaults = context.defaults
    function shouldAdd(defaultType: DefaultObjectType): boolean {
        return defaultTypes.includes(defaultType) && defaults[defaultType] === undefined
    }

    if (shouldAdd("account")) {
        defaults.account = await context.identityHelper.createAndGetAccount()
    }

    if (shouldAdd("user")) {
        assert(defaults.account !== undefined, "A default user requires a default account.")
        defaults.user = await context.identityHelper.createAndGetUser(
            buildCreateUserInput({
                fields: buildCreateUserFields({ accountId: defaults.account.id }),
            }),
        )
    }

    if (shouldAdd("project")) {
        assert(defaults.user !== undefined, "A default project requires a default user.")
        defaults.project = await context.projectHelper.createAndGetProject(
            buildCreateProjectInput(),
            defaults.user,
        )
    }
}
