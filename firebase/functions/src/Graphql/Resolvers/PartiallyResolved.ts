import { CfoInvite } from "../../Data/Cfo/CfoInvite.js"
import { DriveAlbum } from "../../Data/Drive/DriveAlbum.js"
import { DriveEntry } from "../../Data/Drive/DriveEntry.js"
import { CfoMembership } from "../../Data/Cfo/CfoMembership.js"
import { CreditDocument } from "../../Data/Credit/CreditDocument.js"
import { CreditLc } from "../../Data/Credit/CreditLc.js"
import { EntryField } from "../../Data/Entry/EntryField.js"
import { EntryRecord } from "../../Data/Entry/EntryRecord.js"
import { Song } from "../../Data/Songs/Song.js"
import { FlowLine } from "../../Data/Flow/FlowLine.js"
import { FlowTemplate } from "../../Data/Flow/FlowTemplate.js"
import { PitchDeck } from "../../Data/Pitch/PitchDeck.js"
import { PitchSlide } from "../../Data/Pitch/PitchSlide.js"
import { Account } from "../../Data/Identity/Account.js"
import { User } from "../../Data/Identity/User.js"
import { Project } from "../../Data/Project/Project.js"
import { ProjectMembership } from "../../Data/Project/ProjectMembership.js"
import { CheckoutSession } from "../../Data/Payments/CheckoutSession.js"
import { Purchase } from "../../Data/Payments/Purchase.js"
import { Subscription } from "../../Data/Payments/Subscription.js"
import { PushDevice } from "../../Data/Push/PushDevice.js"
import { QuickBooksConnection } from "../../Data/QuickBooks/QuickBooksConnection.js"
import { Upload } from "../../Data/Storage/Upload.js"

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
export type PartiallyResolvedPurchase = Purchase
export type PartiallyResolvedPaymentSubscription = Subscription
export type PartiallyResolvedQuickBooksConnection = QuickBooksConnection
export type PartiallyResolvedUpload = Upload
export type PartiallyResolvedPushDevice = PushDevice
export type PartiallyResolvedCfoMembership = CfoMembership
export type PartiallyResolvedCfoInvite = CfoInvite
/** A CfoClient is resolved from the member's membership row; the books fields hydrate lazily. */
export type PartiallyResolvedCfoClient = CfoMembership
export type PartiallyResolvedCreditLc = CreditLc
export type PartiallyResolvedCreditDocument = CreditDocument
export type PartiallyResolvedFlowTemplate = FlowTemplate
/** A grid row plus its computed per-month numbers (budgets/actuals/variance). */
export type PartiallyResolvedFlowLine = FlowLine & {
    budgetsMinorUnits: number[]
    actualsMinorUnits: (number | null)[]
    variancesMinorUnits: (number | null)[]
}
export type PartiallyResolvedPitchDeck = PitchDeck
export type PartiallyResolvedPitchSlide = PitchSlide
export type PartiallyResolvedEntryField = EntryField
export type PartiallyResolvedEntryRecord = EntryRecord
export type PartiallyResolvedSong = Song
export type PartiallyResolvedDriveEntry = DriveEntry
export type PartiallyResolvedDriveAlbum = DriveAlbum
