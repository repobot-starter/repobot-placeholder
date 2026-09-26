import { ApolloLink, Observable, type FetchResult, type Operation } from "@apollo/client"

/**
 * Demo mode: a terminating Apollo link that resolves the kernel's GraphQL
 * operations from an in-memory fixture store instead of a server. Static
 * preview builds (VITE_DEMO_MODE=true) use it so full-stack templates can be
 * played on the marketing site with no backend: sign-in is already simulated
 * client-side by LocalAuthClient, and this link supplies the data plane.
 *
 * Resolution is keyed by operation name — the same names the generated hooks
 * use — and returns wire-shaped payloads (aliases and __typename included) so
 * Apollo's normalized cache behaves exactly as it does against the real API.
 * Mutations write to the store; refetch conventions (refetchQueries after
 * create/update) then observe the change, so the demo behaves like a live
 * product, not a slideshow.
 */

// ---------------------------------------------------------------- store

export interface DemoUser {
    id: string
    email: string
    displayName: string
    status: "ACTIVE" | "DEACTIVATED"
    createdTime: string
}

export interface DemoProject {
    id: string
    name: string
    description: string | null
    status: "ACTIVE" | "ARCHIVED"
    createdTime: string
    archivedAt: string | null
    createdById: string
}

export interface DemoMembership {
    id: string
    projectId: string
    userId: string
    role: "OWNER" | "EDITOR" | "VIEWER"
    createdTime: string
}

export interface DemoCheckoutSession {
    id: string
    status: "PENDING" | "PAID"
    checkoutUrl: string
    productKey: string
    productName: string
    amountTotal: number
    currency: string
    createdTime: string
}

export interface DemoStore {
    accountName: string
    currentUserId: string
    users: DemoUser[]
    projects: DemoProject[]
    memberships: DemoMembership[]
    checkoutSessions: DemoCheckoutSession[]
    shopProduct: { key: string; name: string; tagline: string; priceMinorUnits: number; currency: string }
    /** The full catalog (ShopProducts): the shop pack's book plus the checkout feature pack's product. */
    shopProducts: {
        key: string
        name: string
        tagline: string
        priceMinorUnits: number
        currency: string
    }[]
    /** Monotonic id source for rows created during the session. */
    idCounter: number
}

/** Days before "now", so the demo data always reads as recent activity. */
function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * The curated seed: a believable small team with projects in varied states.
 * Deliberately product-neutral names so the same data reads well behind any
 * pack's branding (Waypoint's board, AuthBot's user table, ...).
 */
export function createDemoStore(): DemoStore {
    const users: DemoUser[] = [
        {
            id: "user_demo_avery",
            email: "avery@harborview.team",
            displayName: "Avery Cole",
            status: "ACTIVE",
            createdTime: daysAgo(210),
        },
        {
            id: "user_demo_noor",
            email: "noor@harborview.team",
            displayName: "Noor Haddad",
            status: "ACTIVE",
            createdTime: daysAgo(174),
        },
        {
            id: "user_demo_sam",
            email: "sam@harborview.team",
            displayName: "Sam Whitfield",
            status: "ACTIVE",
            createdTime: daysAgo(126),
        },
        {
            id: "user_demo_ines",
            email: "ines@harborview.team",
            displayName: "Inés Marino",
            status: "ACTIVE",
            createdTime: daysAgo(58),
        },
        {
            id: "user_demo_jonas",
            email: "jonas@harborview.team",
            displayName: "Jonas Beck",
            status: "DEACTIVATED",
            createdTime: daysAgo(300),
        },
    ]
    const projects: DemoProject[] = [
        {
            id: "project_demo_onboarding",
            name: "Customer onboarding revamp",
            description: "Cut the first-session drop-off in half before the spring launch.",
            status: "ACTIVE",
            createdTime: daysAgo(4),
            archivedAt: null,
            createdById: "user_demo_noor",
        },
        {
            id: "project_demo_billing",
            name: "Usage-based billing",
            description: "Meter events, nightly rollups, and the new invoice line items.",
            status: "ACTIVE",
            createdTime: daysAgo(11),
            archivedAt: null,
            createdById: "user_demo_avery",
        },
        {
            id: "project_demo_mobile",
            name: "Mobile companion app",
            description: "Read-only dashboards on iOS and Android, notifications first.",
            status: "ACTIVE",
            createdTime: daysAgo(19),
            archivedAt: null,
            createdById: "user_demo_sam",
        },
        {
            id: "project_demo_search",
            name: "Search relevance tuning",
            description: "Synonyms, typo tolerance, and the analytics to prove it worked.",
            status: "ACTIVE",
            createdTime: daysAgo(33),
            archivedAt: null,
            createdById: "user_demo_ines",
        },
        {
            id: "project_demo_help",
            name: "Help center refresh",
            description: "New information architecture and a searchable changelog.",
            status: "ACTIVE",
            createdTime: daysAgo(47),
            archivedAt: null,
            createdById: "user_demo_noor",
        },
        {
            id: "project_demo_sso",
            name: "Enterprise SSO",
            description: "SAML and SCIM for the two largest accounts in the pipeline.",
            status: "ACTIVE",
            createdTime: daysAgo(61),
            archivedAt: null,
            createdById: "user_demo_avery",
        },
        {
            id: "project_demo_migration",
            name: "Legacy importer",
            description: "One-click migration from the spreadsheet era. Shipped in March.",
            status: "ARCHIVED",
            createdTime: daysAgo(150),
            archivedAt: daysAgo(38),
            createdById: "user_demo_sam",
        },
    ]
    const memberships: DemoMembership[] = [
        {
            id: "pm_demo_1",
            projectId: "project_demo_onboarding",
            userId: "user_demo_noor",
            role: "OWNER",
            createdTime: daysAgo(4),
        },
        {
            id: "pm_demo_2",
            projectId: "project_demo_onboarding",
            userId: "user_demo_avery",
            role: "EDITOR",
            createdTime: daysAgo(3),
        },
        {
            id: "pm_demo_3",
            projectId: "project_demo_onboarding",
            userId: "user_demo_ines",
            role: "VIEWER",
            createdTime: daysAgo(2),
        },
        {
            id: "pm_demo_4",
            projectId: "project_demo_billing",
            userId: "user_demo_avery",
            role: "OWNER",
            createdTime: daysAgo(11),
        },
        {
            id: "pm_demo_5",
            projectId: "project_demo_billing",
            userId: "user_demo_sam",
            role: "EDITOR",
            createdTime: daysAgo(9),
        },
    ]
    return {
        accountName: "Harborview",
        currentUserId: "user_demo_avery",
        users,
        projects,
        memberships,
        checkoutSessions: [],
        shopProduct: {
            key: "book",
            name: "The Lighthouse Letters",
            tagline: "A novel — first edition hardcover, signed by the author",
            priceMinorUnits: 2400,
            currency: "usd",
        },
        // Mirrors the kernel's server-side ShopCatalog so the checkout
        // feature pack's preview sells the same product a sandbox does.
        shopProducts: [
            {
                key: "book",
                name: "The Lighthouse Letters",
                tagline: "A novel — first edition hardcover, signed by the author",
                priceMinorUnits: 2400,
                currency: "usd",
            },
            {
                key: "session",
                name: "Strategy Session",
                tagline: "A focused 60-minute working session, scheduled after checkout",
                priceMinorUnits: 7500,
                currency: "usd",
            },
        ],
        idCounter: 0,
    }
}

// -------------------------------------------------------------- persistence

// v2: the store gained shopProducts (the checkout feature pack's preview);
// bumping the key discards stale seeds that would miss the field.
const STORAGE_KEY = "base.demoStore.v2"

/**
 * The store lives in sessionStorage so it survives full page loads — the
 * checkout flow navigates to /checkout/test, and a purchase must find the
 * session it just created. Session scope (not local) keeps every new visit
 * to the preview starting from the curated seed.
 */
function loadDemoStore(): DemoStore {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (raw !== null) {
            return JSON.parse(raw) as DemoStore
        }
    } catch {
        // Fall through to a fresh seed (private mode, disabled storage, ...).
    }
    return createDemoStore()
}

function saveDemoStore(store: DemoStore): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
        // Best-effort: the demo still works within the current page.
    }
}

// ------------------------------------------------------------- wire shapes

function accountOf(store: DemoStore): Record<string, unknown> {
    return { __typename: "Account", id: "account_demo", name: store.accountName }
}

function userNode(store: DemoStore, user: DemoUser): Record<string, unknown> {
    return {
        __typename: "User",
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        createdTime: user.createdTime,
        avatarUploadId: null,
        account: accountOf(store),
    }
}

function userRef(user: DemoUser): Record<string, unknown> {
    return {
        __typename: "User",
        id: user.id,
        displayName: user.displayName,
        email: user.email,
    }
}

function projectNode(store: DemoStore, project: DemoProject): Record<string, unknown> {
    const creator = store.users.find((user) => user.id === project.createdById) ?? store.users[0]
    return {
        __typename: "Project",
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdTime: project.createdTime,
        archivedAt: project.archivedAt,
        createdBy: { __typename: "User", id: creator.id, displayName: creator.displayName },
    }
}

function membershipNode(store: DemoStore, membership: DemoMembership): Record<string, unknown> {
    const user = store.users.find((candidate) => candidate.id === membership.userId) ?? store.users[0]
    return {
        __typename: "ProjectMembership",
        id: membership.id,
        role: membership.role,
        createdTime: membership.createdTime,
        user: userRef(user),
    }
}

function checkoutSessionNode(session: DemoCheckoutSession): Record<string, unknown> {
    return {
        __typename: "CheckoutSession",
        id: session.id,
        provider: "LOCAL",
        status: session.status,
        checkoutUrl: session.checkoutUrl,
        productKey: session.productKey,
        productName: session.productName,
        amountTotal: session.amountTotal,
        currency: session.currency,
        deliveryAvailable: false,
        createdTime: session.createdTime,
    }
}

// ------------------------------------------------------------- connections

interface ConnectionArgs {
    connection?: {
        pagination?: { first?: number; after?: string | null }
        sort?: { fieldName: string; direction: "ASC" | "DESC" }[]
    }
}

function connectionOf<T>(
    typename: string,
    rows: T[],
    args: ConnectionArgs | undefined,
    toNode: (row: T) => Record<string, unknown>,
    sortValue: (row: T, fieldName: string) => string | number,
): Record<string, unknown> {
    const sorted = [...rows]
    const sortOrders = args?.connection?.sort ?? []
    if (sortOrders.length > 0) {
        sorted.sort((a, b) => {
            for (const order of sortOrders) {
                const left = sortValue(a, order.fieldName)
                const right = sortValue(b, order.fieldName)
                if (left === right) {
                    continue
                }
                const ascending = left < right ? -1 : 1
                return order.direction === "DESC" ? -ascending : ascending
            }
            return 0
        })
    }
    const after = args?.connection?.pagination?.after
    const start = after != null ? Number(after) : 0
    const first = args?.connection?.pagination?.first ?? 50
    const page = sorted.slice(start, start + first)
    const end = start + page.length
    return {
        __typename: typename,
        nodes: page.map(toNode),
        pageInfo: {
            __typename: "PageInfo",
            hasNextPage: end < sorted.length,
            endCursor: String(end),
        },
    }
}

// ------------------------------------------------------------ schema forms

function schemaForm(
    title: string,
    properties: Record<string, unknown>,
    required: string[],
    order: string[],
    uiOverrides: Record<string, unknown> = {},
    defaultData: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        __typename: "SchemaForm",
        jsonSchema: JSON.stringify({ type: "object", title, properties, required }),
        uiSchema: JSON.stringify({ "ui:order": order, ...uiOverrides }),
        defaultData: JSON.stringify(defaultData),
    }
}

const descriptionUi = { "ui:widget": "textarea" }

// --------------------------------------------------------------- resolvers

type Variables = Record<string, any>

function nextId(store: DemoStore, prefix: string): string {
    store.idCounter += 1
    return `${prefix}_demo_created_${store.idCounter}`
}

/** Resolves one named operation against the store; returns the `data` payload. */
function resolveOperation(
    store: DemoStore,
    operationName: string,
    variables: Variables,
): Record<string, unknown> {
    switch (operationName) {
        case "CurrentUser": {
            const current = store.users.find((user) => user.id === store.currentUserId) ?? store.users[0]
            return { currentUser: userNode(store, current) }
        }
        case "Users": {
            const filters = variables.input?.filters ?? {}
            let rows = store.users
            if (typeof filters.displayName === "string" && filters.displayName !== "") {
                const needle = filters.displayName.toLowerCase()
                rows = rows.filter((user) => user.displayName.toLowerCase().includes(needle))
            }
            if (typeof filters.email === "string" && filters.email !== "") {
                const needle = filters.email.toLowerCase()
                rows = rows.filter((user) => user.email.toLowerCase().includes(needle))
            }
            if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
                rows = rows.filter((user) => filters.statuses.includes(user.status))
            }
            return {
                users: connectionOf(
                    "UserConnection",
                    rows,
                    variables.input,
                    (user) => userNode(store, user),
                    (user, field) => (user as unknown as Record<string, string>)[field] ?? user.createdTime,
                ),
            }
        }
        case "Projects": {
            const filters = variables.input?.filters ?? {}
            let rows = store.projects
            if (typeof filters.name === "string" && filters.name !== "") {
                const needle = filters.name.toLowerCase()
                rows = rows.filter((project) => project.name.toLowerCase().includes(needle))
            }
            if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
                rows = rows.filter((project) => filters.statuses.includes(project.status))
            }
            return {
                projects: connectionOf(
                    "ProjectConnection",
                    rows,
                    variables.input,
                    (project) => projectNode(store, project),
                    (project, field) =>
                        (project as unknown as Record<string, string>)[field] ?? project.createdTime,
                ),
            }
        }
        case "ProjectMembers": {
            const project = store.projects.find((candidate) => candidate.id === variables.id)
            if (project === undefined) {
                throw new Error(`No project '${String(variables.id)}' in the demo workspace.`)
            }
            const memberships = store.memberships
                .filter((membership) => membership.projectId === project.id)
                .map((membership) => membershipNode(store, membership))
            return {
                project: { __typename: "Project", id: project.id, name: project.name, memberships },
            }
        }
        case "CreateUser": {
            const fields = variables.input.fields
            const user: DemoUser = {
                id: nextId(store, "user"),
                email: fields.email,
                displayName: fields.displayName,
                status: "ACTIVE",
                createdTime: new Date().toISOString(),
            }
            store.users.push(user)
            return { createUser: userNode(store, user) }
        }
        case "UpdateUser": {
            const user = store.users.find((candidate) => candidate.id === variables.input.objectId)
            if (user === undefined) {
                throw new Error("No such user in the demo workspace.")
            }
            const fields = variables.input.fields
            if (typeof fields.displayName === "string") {
                user.displayName = fields.displayName
            }
            if (fields.status === "ACTIVE" || fields.status === "DEACTIVATED") {
                user.status = fields.status
            }
            return { updateUser: userNode(store, user) }
        }
        case "CreateProject": {
            const fields = variables.input.fields
            const project: DemoProject = {
                id: nextId(store, "project"),
                name: fields.name,
                description: fields.description ?? null,
                status: "ACTIVE",
                createdTime: new Date().toISOString(),
                archivedAt: null,
                createdById: store.currentUserId,
            }
            store.projects.push(project)
            return { createProject: projectNode(store, project) }
        }
        case "UpdateProject": {
            const project = store.projects.find((candidate) => candidate.id === variables.input.objectId)
            if (project === undefined) {
                throw new Error("No such project in the demo workspace.")
            }
            const fields = variables.input.fields
            if (typeof fields.name === "string") {
                project.name = fields.name
            }
            if (typeof fields.description === "string") {
                project.description = fields.description
            }
            if (fields.doArchive === true) {
                project.status = "ARCHIVED"
                project.archivedAt = new Date().toISOString()
            }
            return { updateProject: projectNode(store, project) }
        }
        case "AddProjectMember": {
            const fields = variables.input.fields
            const membership: DemoMembership = {
                id: nextId(store, "pm"),
                projectId: fields.projectId,
                userId: fields.userId,
                role: fields.role,
                createdTime: new Date().toISOString(),
            }
            store.memberships.push(membership)
            return { addProjectMember: membershipNode(store, membership) }
        }
        case "UpdateProjectMember": {
            const membership = store.memberships.find(
                (candidate) => candidate.id === variables.input.objectId,
            )
            if (membership === undefined) {
                throw new Error("No such membership in the demo workspace.")
            }
            membership.role = variables.input.fields.role
            return { updateProjectMember: membershipNode(store, membership) }
        }
        case "RemoveProjectMember": {
            store.memberships = store.memberships.filter((membership) => membership.id !== variables.objectId)
            return { removeProjectMember: true }
        }
        case "UserCreateFormSchema":
            return {
                schema: schemaForm(
                    "Create User",
                    {
                        accountId: { type: "string", title: "Account" },
                        email: { type: "string", title: "Email" },
                        displayName: { type: "string", title: "Display Name" },
                    },
                    ["accountId", "email", "displayName"],
                    ["accountId", "email", "displayName"],
                    {},
                    { accountId: "account_demo" },
                ),
            }
        case "UserUpdateFormSchema": {
            const user = store.users.find((candidate) => candidate.id === variables.input?.objectId)
            return {
                schema: schemaForm(
                    "Update User",
                    {
                        displayName: { type: "string", title: "Display Name" },
                        status: { type: "string", title: "Status", enum: ["ACTIVE", "DEACTIVATED"] },
                    },
                    [],
                    ["displayName", "status"],
                    {},
                    user !== undefined ? { displayName: user.displayName, status: user.status } : {},
                ),
            }
        }
        case "ProjectCreateFormSchema":
            return {
                schema: schemaForm(
                    "Create Project",
                    {
                        name: { type: "string", title: "Name" },
                        description: { type: "string", title: "Description" },
                    },
                    ["name"],
                    ["name", "description"],
                    { description: descriptionUi },
                ),
            }
        case "ProjectUpdateFormSchema": {
            const project = store.projects.find((candidate) => candidate.id === variables.input?.objectId)
            return {
                schema: schemaForm(
                    "Update Project",
                    {
                        name: { type: "string", title: "Name" },
                        description: { type: "string", title: "Description" },
                    },
                    [],
                    ["name", "description"],
                    { description: descriptionUi },
                    project !== undefined
                        ? { name: project.name, description: project.description ?? undefined }
                        : {},
                ),
            }
        }
        case "ShopProduct":
            return { shopProduct: { __typename: "ShopProduct", ...store.shopProduct } }
        case "ShopProducts":
            return {
                shopProducts: store.shopProducts.map((product) => ({
                    __typename: "ShopProduct",
                    ...product,
                })),
            }
        case "CreateCheckoutSession": {
            const fields = variables.input.fields
            // The buyer names the product (the checkout feature pack sells
            // "session"); the shop pack's flow predates productKey and
            // falls back to its one product.
            const product =
                store.shopProducts.find((candidate) => candidate.key === fields.productKey) ??
                store.shopProduct
            const id = nextId(store, "checkout")
            const session: DemoCheckoutSession = {
                id,
                status: "PENDING",
                checkoutUrl: `${fields.origin}/checkout/test?session=${id}`,
                productKey: product.key,
                productName: product.name,
                amountTotal: product.priceMinorUnits,
                currency: product.currency,
                createdTime: new Date().toISOString(),
            }
            store.checkoutSessions.push(session)
            return { createCheckoutSession: checkoutSessionNode(session) }
        }
        case "CheckoutSession": {
            const session = store.checkoutSessions.find((candidate) => candidate.id === variables.id)
            if (session === undefined) {
                throw new Error("No such checkout session in the demo shop.")
            }
            return { checkoutSession: checkoutSessionNode(session) }
        }
        case "CompleteTestCheckoutSession": {
            const session = store.checkoutSessions.find(
                (candidate) => candidate.id === variables.input.sessionId,
            )
            if (session === undefined) {
                throw new Error("No such checkout session in the demo shop.")
            }
            session.status = "PAID"
            return { completeTestCheckoutSession: checkoutSessionNode(session) }
        }
        default:
            throw new Error(`"${operationName}" is not available in the demo preview.`)
    }
}

// -------------------------------------------------------------------- link

const DEMO_LATENCY_MS = 160

export interface CreateDemoLinkOptions {
    /** Fixture store; a fresh curated store when omitted. Exposed for tests. */
    store?: DemoStore
}

/** The terminating link. See the module doc. */
export function createDemoLink(options: CreateDemoLinkOptions = {}): ApolloLink {
    const store = options.store ?? loadDemoStore()
    return new ApolloLink((operation: Operation) => {
        return new Observable<FetchResult>((observer) => {
            const timer = setTimeout(() => {
                try {
                    const data = resolveOperation(store, operation.operationName, operation.variables)
                    saveDemoStore(store)
                    observer.next({ data })
                    observer.complete()
                } catch (error) {
                    observer.next({
                        errors: [
                            { message: error instanceof Error ? error.message : String(error) } as never,
                        ],
                    })
                    observer.complete()
                }
            }, DEMO_LATENCY_MS)
            return () => clearTimeout(timer)
        })
    })
}
