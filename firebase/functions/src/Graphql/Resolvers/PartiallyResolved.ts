import { Account } from "../../Data/Identity/Account.js"
import { User } from "../../Data/Identity/User.js"
import { Project } from "../../Data/Project/Project.js"
import { ProjectMembership } from "../../Data/Project/ProjectMembership.js"
import { CheckoutSession } from "../../Data/Shop/CheckoutSession.js"

/**
 * Resolver layering contract:
 *
 * Root resolvers (Query/Mutation) return these "partially resolved" objects —
 * plain database rows that carry foreign ids (accountId, createdByUserId, ...)
 * instead of nested objects. Field resolvers (User.account, Project.createdBy,
 * ProjectMembership.user/project) hydrate the relations through the request
 * context's dataloaders, so nested selections batch into single queries and
 * unselected relations cost nothing.
 *
 * graphql-codegen maps the GraphQL object types to these types (see
 * graphql-codegen.yaml "mappers"), which makes the layering type-checked.
 */
export type PartiallyResolvedAccount = Account
export type PartiallyResolvedUser = User
export type PartiallyResolvedProject = Project
export type PartiallyResolvedProjectMembership = ProjectMembership
export type PartiallyResolvedCheckoutSession = CheckoutSession
