// TestEnv MUST be first: it sets env defaults (test DB on :5433, AUTH_MODE
// local, fixed LOCAL_AUTH_SECRET) before any src module is evaluated.
import "./Utils/TestEnv.js"

import * as chai from "chai"
import chaiAsPromised from "chai-as-promised"
import { testTransaction } from "pg-transactional-tests"
import * as sinon from "sinon"
// Importing src/index.js loads every CloudFunction module, which registers
// the PubSub handlers that TestPubSubWrapper dispatches to.
import "../src/index.js"
import { pubSubWrapper } from "../src/DependencyWrappers/PubSubWrapper/index.js"
import { buildPendingGraphqlServer } from "../src/Graphql/GraphqlServer.js"
import { assertTestDatabaseReachable } from "./Utils/AssertTestDatabase.js"
import { CfoTestHelper } from "./Cfo/CfoTestHelper.js"
import { CreditTestHelper } from "./Credit/CreditTestHelper.js"
import { DriveTestHelper } from "./Drive/DriveTestHelper.js"
import { EntryTestHelper } from "./Entry/EntryTestHelper.js"
import { SongsTestHelper } from "./Songs/SongsTestHelper.js"
import { FlowTestHelper } from "./Flow/FlowTestHelper.js"
import { IdentityTestHelper } from "./Identity/IdentityTestHelper.js"
import { PitchTestHelper } from "./Pitch/PitchTestHelper.js"
import { ProjectTestHelper } from "./Project/ProjectTestHelper.js"
import { QuickBooksTestHelper } from "./QuickBooks/QuickBooksTestHelper.js"
import { TestContext, TestFakes } from "./Utils/TestContext.js"
import { TestPubSubWrapper } from "./Utils/TestPubSubWrapper.js"

export const mochaHooks = {
    async beforeAll(this: TestContext): Promise<void> {
        // Before anything touches pg: a missing test DB must be a 2-second
        // error, not an open-ended hang on the first query.
        await assertTestDatabaseReachable()

        chai.use(chaiAsPromised)

        // Every test runs inside a transaction that is rolled back afterwards,
        // so tests are isolated and the test DB stays clean.
        testTransaction.patch()

        // Hold one outer start() for the whole run: rollback() un-patches pg
        // when its start/rollback counter reaches zero, which would break the
        // per-test start/rollback cycle after the first test.
        testTransaction.start()
    },

    async afterAll(this: TestContext): Promise<void> {
        await testTransaction.close()
    },

    async beforeEach(this: TestContext): Promise<void> {
        const { apolloServer } = buildPendingGraphqlServer()
        const testPubSubWrapper = new TestPubSubWrapper()

        // Route all publishes through the test wrapper, which dispatches to
        // the registered CloudFunction handlers inline. Event-driven flows
        // (for example membership-on-ProjectCreated) are therefore fully
        // testable, and the spy records every publish.
        const fakes: TestFakes = {
            pubSub: {
                publishBytes: sinon.replace(
                    pubSubWrapper,
                    "publishBytes",
                    sinon.fake(async (topicName: string, bytes: Uint8Array) => {
                        await testPubSubWrapper.publishBytes(topicName, bytes)
                    }),
                ),
            },
        }

        this.apolloServer = apolloServer
        this.identityHelper = new IdentityTestHelper(apolloServer)
        this.projectHelper = new ProjectTestHelper(apolloServer)
        this.quickBooksHelper = new QuickBooksTestHelper(apolloServer)
        this.cfoHelper = new CfoTestHelper(apolloServer)
        this.creditHelper = new CreditTestHelper(apolloServer)
        this.flowHelper = new FlowTestHelper(apolloServer)
        this.entryHelper = new EntryTestHelper(apolloServer)
        this.songsHelper = new SongsTestHelper(apolloServer)
        this.pitchHelper = new PitchTestHelper(apolloServer)
        this.driveHelper = new DriveTestHelper(apolloServer)
        this.defaults = {}
        this.fakes = fakes
        this.pubSubWrapper = testPubSubWrapper

        testTransaction.start()
    },

    async afterEach(this: TestContext): Promise<void> {
        // Undo everything the test wrote so the next test starts clean.
        await testTransaction.rollback()

        // The rollback deleted the default objects; drop the references too.
        this.defaults = {}

        sinon.restore()
    },
}
