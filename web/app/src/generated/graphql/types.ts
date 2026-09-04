import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Id: { input: string; output: string; }
  Instant: { input: string; output: string; }
};

export type Account = {
  __typename?: 'Account';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
};

export type AccountConnection = {
  __typename?: 'AccountConnection';
  nodes: Array<Maybe<Account>>;
  pageInfo: PageInfo;
};

export type AccountConnectionFilters = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type AccountConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<AccountConnectionFilters>;
};

/** The accounting providers a workspace can connect. Both serve the same simulated dataset in QUICKBOOKS_MODE=local. */
export type AccountingProvider =
  | 'QUICKBOOKS'
  | 'XERO';

export type AddDriveAlbumEntryInput = {
  albumId: Scalars['Id']['input'];
  entryId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type AddProjectMemberFields = {
  projectId: Scalars['Id']['input'];
  role: ProjectMembershipRole;
  userId: Scalars['Id']['input'];
};

export type AddProjectMemberInput = {
  fields: AddProjectMemberFields;
  idempotencyKey: Scalars['String']['input'];
};

export type AiVoiceSession = {
  __typename?: 'AiVoiceSession';
  /** Short-lived secret the native app opens its OpenAI Realtime WebSocket with. */
  clientSecret: Scalars['String']['output'];
  /** When the client secret expires; reconnect by minting a new session. */
  expiresAt?: Maybe<Scalars['Instant']['output']>;
  /** The realtime model to pass when connecting, e.g. "gpt-realtime-2". */
  model: Scalars['String']['output'];
  /** The voice the session speaks with. */
  voice: Scalars['String']['output'];
};

export type BeginQuickBooksAuthorizationInput = {
  /** Where Intuit redirects back after consent (must be registered on the Intuit app). */
  redirectUri: Scalars['String']['input'];
};

export type BillingPortalSession = {
  __typename?: 'BillingPortalSession';
  /** Where to send the user to manage billing: Stripe's Billing Portal, or the in-app test billing page in local mode. */
  url: Scalars['String']['output'];
};

/**
 * One member's books: identity plus the live state of their accounting
 * connection. The advisor reads every client's; a client reads their own.
 * Statement fields resolve lazily — they cost nothing unless selected.
 */
export type CfoClient = {
  __typename?: 'CfoClient';
  /** Trailing thirteen month-end balance sheets; empty until they connect. */
  balanceSheet: Array<QuickBooksBalanceSheetPeriod>;
  /** The member's accounting connection; null until they connect. */
  connection?: Maybe<QuickBooksConnection>;
  membership: CfoMembership;
  /** Trailing thirteen months of P&L; empty until they connect. */
  profitAndLoss: Array<QuickBooksProfitAndLossPeriod>;
  /** Headline numbers for the member's company; null until they connect. */
  snapshot?: Maybe<QuickBooksCompanySnapshot>;
};

export type CfoConnectMyBooksInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which accounting provider to connect; defaults to QUICKBOOKS. */
  provider?: InputMaybe<AccountingProvider>;
};

export type CfoExportClientStatementsXlsxInput = {
  /** Whose books to export: the advisor may pass any client; a client only themself. */
  clientUserId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
  /** Which statements to include; defaults to ALL. */
  statement?: InputMaybe<QuickBooksStatementExportKind>;
};

export type CfoInvite = {
  __typename?: 'CfoInvite';
  /** Lowercased; the invitee signs up with this address to join. */
  email: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  invitedTime: Scalars['Instant']['output'];
  role: CfoRole;
  status: CfoInviteStatus;
};

export type CfoInviteClientInput = {
  email: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  /** Where the invite email's button points (the composed site's /login). */
  signInUrl: Scalars['String']['input'];
  /** The product name for the invite email (the composed site's name). */
  siteName: Scalars['String']['input'];
};

export type CfoInviteStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'REVOKED';

export type CfoMembership = {
  __typename?: 'CfoMembership';
  id: Scalars['Id']['output'];
  joinedTime: Scalars['Instant']['output'];
  role: CfoRole;
  user: User;
};

export type CfoRevokeInviteInput = {
  inviteId: Scalars['Id']['input'];
};

export type CfoRole =
  | 'ADVISOR'
  | 'CLIENT';

export type CheckoutMode =
  /** A one-off charge (the default; buyers are anonymous). */
  | 'PAYMENT'
  /** Recurring billing; the session belongs to an authenticated user. */
  | 'SUBSCRIPTION';

export type CheckoutProvider =
  /** Sandbox-only simulated checkout (PAYMENTS_MODE=local); no real payment. */
  | 'LOCAL'
  /** Stripe hosted Checkout (PAYMENTS_MODE=stripe). */
  | 'STRIPE';

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  /** Total in the currency's minor units. */
  amountTotal: Scalars['Int']['output'];
  /** Where to send the buyer to pay: the in-app test checkout or Stripe's hosted page. */
  checkoutUrl: Scalars['String']['output'];
  createdTime: Scalars['Instant']['output'];
  currency: Scalars['String']['output'];
  /** True when the product has a session-gated download (see docs/payments.md). */
  deliveryAvailable: Scalars['Boolean']['output'];
  id: Scalars['Id']['output'];
  mode: CheckoutMode;
  /** Product snapshot taken at checkout time. */
  productKey: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  provider: CheckoutProvider;
  /** Recurring billing period; null for one-off payments. */
  recurringInterval?: Maybe<SubscriptionInterval>;
  status: CheckoutSessionStatus;
};

export type CheckoutSessionStatus =
  | 'PAID'
  | 'PENDING';

export type CompleteQuickBooksAuthorizationInput = {
  /** The authorization code from Intuit's callback query string. */
  code: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  /** The connected company's realm id from Intuit's callback query string. */
  realmId: Scalars['String']['input'];
  /** The exact redirectUri the authorization began with. */
  redirectUri: Scalars['String']['input'];
  /** The opaque state from Intuit's callback query string. */
  state: Scalars['String']['input'];
};

export type CompleteTestCheckoutSessionInput = {
  sessionId: Scalars['Id']['input'];
};

export type ConnectQuickBooksInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which accounting provider to connect; defaults to QUICKBOOKS. */
  provider?: InputMaybe<AccountingProvider>;
};

export type ConnectionInput = {
  pagination: PaginationInput;
  sort: Array<SortOrderInput>;
};

export type CreateAccountFields = {
  name: Scalars['String']['input'];
};

export type CreateAccountInput = {
  fields: CreateAccountFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateBillingPortalSessionInput = {
  /** The web app's origin (window.location.origin); the portal's return URL is built from it. */
  origin: Scalars['String']['input'];
};

export type CreateCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
  /** Which catalog product to charge for; omitted means the storefront's default product. */
  productKey?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCheckoutSessionInput = {
  fields: CreateCheckoutSessionFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateDriveAlbumFields = {
  name: Scalars['String']['input'];
};

export type CreateDriveAlbumInput = {
  fields: CreateDriveAlbumFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateDriveFolderFields = {
  name: Scalars['String']['input'];
  /** The destination folder; null/omitted creates at the library root. */
  parentId?: InputMaybe<Scalars['Id']['input']>;
};

export type CreateDriveFolderInput = {
  fields: CreateDriveFolderFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateEntryFieldFields = {
  fieldType: EntryFieldType;
  label: Scalars['String']['input'];
  /** Choices for SELECT fields; ignored for every other type. */
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateEntryFieldInput = {
  fields: CreateEntryFieldFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateEntryRecordFields = {
  valuesJson: Scalars['String']['input'];
};

export type CreateEntryRecordInput = {
  fields: CreateEntryRecordFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateProjectFields = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateProjectInput = {
  fields: CreateProjectFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateSongFields = {
  artist: Scalars['String']['input'];
  chartRank: Scalars['Int']['input'];
  genre: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  streamsBillions?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};

export type CreateSongInput = {
  fields: CreateSongFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateSubscriptionCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
  /** Which catalog plan to subscribe to; omitted means the default plan. */
  productKey?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSubscriptionCheckoutSessionInput = {
  fields: CreateSubscriptionCheckoutSessionFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateUploadFields = {
  /** Must be on the profile's content-type allowlist (Services/Storage/StorageConfig.ts). */
  contentType: Scalars['String']['input'];
  /** The admission profile; DEFAULT when omitted. */
  profile?: InputMaybe<UploadProfile>;
  /** Declared size; validated against the profile's cap, re-checked at finalize. */
  sizeBytes: Scalars['Int']['input'];
  visibility: UploadVisibility;
};

export type CreateUploadInput = {
  fields: CreateUploadFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreateUserFields = {
  accountId: Scalars['Id']['input'];
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type CreateUserInput = {
  fields: CreateUserFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CreditAttachDocumentInput = {
  /** The dropped file's name, for the document list. */
  fileName?: InputMaybe<Scalars['String']['input']>;
  idempotencyKey: Scalars['String']['input'];
  lcId: Scalars['Id']['input'];
  /** A READY application/pdf upload (the dropped supporting document). */
  uploadId: Scalars['Id']['input'];
};

export type CreditDeleteLcInput = {
  lcId: Scalars['Id']['input'];
};

/** A supporting document dropped against a letter of credit. */
export type CreditDocument = {
  __typename?: 'CreditDocument';
  amountMinorUnits?: Maybe<Scalars['Int']['output']>;
  attachedTime: Scalars['Instant']['output'];
  /** Lowercase ISO currency code, e.g. "usd"; null when the document states none. */
  currency?: Maybe<Scalars['String']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
  goodsDescription?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  kind: CreditDocumentKind;
  portOfDischarge?: Maybe<Scalars['String']['output']>;
  portOfLoading?: Maybe<Scalars['String']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
  /** The bill of lading's shipped-on-board date, ISO yyyy-mm-dd. */
  shipmentDate?: Maybe<Scalars['String']['output']>;
  uploadId: Scalars['Id']['output'];
};

export type CreditDocumentKind =
  | 'BILL_OF_LADING'
  | 'COMMERCIAL_INVOICE'
  | 'OTHER'
  | 'PACKING_LIST';

/** One check from the discrepancy engine. */
export type CreditFinding = {
  __typename?: 'CreditFinding';
  /** Stable machine code, e.g. AMOUNT_OVER_TOLERANCE. */
  code: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  /** The document the finding is about; null for LC-level checks. */
  documentId?: Maybe<Scalars['Id']['output']>;
  severity: CreditFindingSeverity;
  title: Scalars['String']['output'];
};

export type CreditFindingSeverity =
  | 'DISCREPANCY'
  | 'OK'
  | 'WARNING';

export type CreditIngestLcInput = {
  idempotencyKey: Scalars['String']['input'];
  /** A READY application/pdf upload (the dropped LC). */
  uploadId: Scalars['Id']['input'];
};

/**
 * A letter of credit as ingested from the dropped PDF: the fields the credit
 * desk actually checks. Dates are ISO yyyy-mm-dd; money follows the kernel
 * money rule (integer minor units + ISO currency).
 */
export type CreditLc = {
  __typename?: 'CreditLc';
  amountMinorUnits: Scalars['Int']['output'];
  applicant?: Maybe<Scalars['String']['output']>;
  beneficiary?: Maybe<Scalars['String']['output']>;
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  /** Supporting documents dropped against this credit, oldest first. */
  documents: Array<CreditDocument>;
  /** The field 46A documents-required list. */
  documentsRequired: Array<Scalars['String']['output']>;
  expiryDate: Scalars['String']['output'];
  /** The discrepancy report, worst findings first. Deterministic. */
  findings: Array<CreditFinding>;
  goodsDescription: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  ingestedTime: Scalars['Instant']['output'];
  issueDate?: Maybe<Scalars['String']['output']>;
  issuingBank?: Maybe<Scalars['String']['output']>;
  latestShipmentDate?: Maybe<Scalars['String']['output']>;
  partialShipments: ShipmentTerm;
  portOfDischarge?: Maybe<Scalars['String']['output']>;
  portOfLoading?: Maybe<Scalars['String']['output']>;
  /** Field 48: days after shipment the documents must be presented within. */
  presentationPeriodDays?: Maybe<Scalars['Int']['output']>;
  /** Field 20, the documentary credit number. */
  reference: Scalars['String']['output'];
  /** Field 39A plus-side tolerance, whole percent. */
  tolerancePercent: Scalars['Int']['output'];
  transhipment: ShipmentTerm;
  /** The source PDF in the storage kernel. */
  uploadId: Scalars['Id']['output'];
};

export type CreditRemoveDocumentInput = {
  documentId: Scalars['Id']['input'];
};

export type DeleteDriveAlbumInput = {
  objectId: Scalars['Id']['input'];
};

export type DeleteDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type DeleteEntryFieldInput = {
  objectId: Scalars['Id']['input'];
};

export type DeleteEntryRecordInput = {
  objectId: Scalars['Id']['input'];
};

export type DeleteSongInput = {
  objectId: Scalars['Id']['input'];
};

export type DeleteUploadInput = {
  uploadId: Scalars['Id']['input'];
};

/** One-shot reading of an uploaded PDF document. */
export type DocumentInterpretation = {
  __typename?: 'DocumentInterpretation';
  /** What kind of document this is, e.g. "Commercial invoice" or "Résumé". */
  documentType: Scalars['String']['output'];
  /** Notable fields worth extracting: parties, dates, amounts, references. */
  fields: Array<InterpretedField>;
  /** The document's most important points, in reading order. */
  keyPoints: Array<Scalars['String']['output']>;
  pageCount: Scalars['Int']['output'];
  /** A plain-language summary, a few sentences. */
  summary: Scalars['String']['output'];
  /** The document's own title, when it states one. */
  title?: Maybe<Scalars['String']['output']>;
};

export type DriveAlbum = {
  __typename?: 'DriveAlbum';
  createdTime: Scalars['Instant']['output'];
  /** How many entries the album holds. */
  entryCount: Scalars['Int']['output'];
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  updatedTime: Scalars['Instant']['output'];
};

export type DriveEntry = {
  __typename?: 'DriveEntry';
  caption?: Maybe<Scalars['String']['output']>;
  /** Photo lens: the EXIF capture time, extracted client-side at upload. */
  capturedTime?: Maybe<Scalars['Instant']['output']>;
  /** The upload's content type; null for folders. */
  contentType?: Maybe<Scalars['String']['output']>;
  createdTime: Scalars['Instant']['output'];
  /** A ready-to-fetch URL for the bytes (stable when shared, short-lived otherwise); null for folders. */
  fileUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  kind: DriveEntryKind;
  name: Scalars['String']['output'];
  /** The parent folder id; null at the library root. */
  parentId?: Maybe<Scalars['Id']['output']>;
  /** True when the underlying upload is PUBLIC (anyone with the /file URL can read it). */
  shared: Scalars['Boolean']['output'];
  /** The upload's verified byte count; null for folders. */
  sizeBytes?: Maybe<Scalars['Int']['output']>;
  starred: Scalars['Boolean']['output'];
  /** The sibling WebP thumbnail's upload; null without one. */
  thumbUploadId?: Maybe<Scalars['Id']['output']>;
  /** A ready-to-fetch URL for the thumbnail; null without one. */
  thumbUrl?: Maybe<Scalars['String']['output']>;
  /** Set while the entry sits in the trash; restore clears it. */
  trashedTime?: Maybe<Scalars['Instant']['output']>;
  updatedTime: Scalars['Instant']['output'];
  /** The bound upload; null for folders. */
  uploadId?: Maybe<Scalars['Id']['output']>;
};

export type DriveEntryConnection = {
  __typename?: 'DriveEntryConnection';
  nodes: Array<Maybe<DriveEntry>>;
  pageInfo: PageInfo;
};

export type DriveEntryConnectionFilters = {
  /** Entries that appear in this album (owner-checked). */
  albumId?: InputMaybe<Scalars['Id']['input']>;
  /** Children of this folder. Overrides rootOnly. */
  folderId?: InputMaybe<Scalars['Id']['input']>;
  /** True lists the trash; otherwise trashed entries are excluded. */
  inTrash?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<DriveEntryKind>;
  /** When true (and no folderId), only entries at the library root. */
  rootOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-insensitive substring match across name and caption. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** True keeps only starred entries. */
  starred?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DriveEntryConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<DriveEntryConnectionFilters>;
};

export type DriveEntryKind =
  | 'FILE'
  | 'FOLDER';

export type EntryField = {
  __typename?: 'EntryField';
  createdTime: Scalars['Instant']['output'];
  /** Stable cell key inside a record's valuesJson; derived from the label at create. */
  fieldKey: Scalars['String']['output'];
  fieldType: EntryFieldType;
  id: Scalars['Id']['output'];
  label: Scalars['String']['output'];
  /** Choices for SELECT fields; null for every other type. */
  options?: Maybe<Array<Scalars['String']['output']>>;
  /** Column order, ascending. */
  position: Scalars['Int']['output'];
  required: Scalars['Boolean']['output'];
};

export type EntryFieldType =
  | 'DATE'
  | 'NUMBER'
  | 'SELECT'
  | 'TEXT'
  | 'YESNO';

export type EntryRecord = {
  __typename?: 'EntryRecord';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  updatedTime: Scalars['Instant']['output'];
  /** The row's cell values, JSON-encoded: { [fieldKey]: string | number | boolean }. */
  valuesJson: Scalars['String']['output'];
};

export type EntryRecordConnection = {
  __typename?: 'EntryRecordConnection';
  nodes: Array<Maybe<EntryRecord>>;
  pageInfo: PageInfo;
};

export type EntryRecordConnectionFilters = {
  /** Case-insensitive substring match across the record's text cell values. */
  search?: InputMaybe<Scalars['String']['input']>;
};

export type EntryRecordConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<EntryRecordConnectionFilters>;
};

export type ExportQuickBooksStatementsXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which statements to include; defaults to ALL. */
  statement?: InputMaybe<QuickBooksStatementExportKind>;
};

/** A resolved download URL. PRIVATE URLs expire; PUBLIC URLs are stable. */
export type FileUrl = {
  __typename?: 'FileUrl';
  url: Scalars['String']['output'];
};

export type FinalizeUploadInput = {
  uploadId: Scalars['Id']['input'];
};

export type FlowAddLineInput = {
  idempotencyKey: Scalars['String']['input'];
  label: Scalars['String']['input'];
  linkedCategory?: InputMaybe<Scalars['String']['input']>;
  section: FlowSection;
  templateId: Scalars['Id']['input'];
};

export type FlowCreateTemplateInput = {
  idempotencyKey: Scalars['String']['input'];
  /** 1-24 grid months. */
  monthCount: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  /** Seed one linked row per P&L category with budgets from the latest actual month (requires connected books). */
  seedFromActuals?: InputMaybe<Scalars['Boolean']['input']>;
  /** First grid month as YYYY-MM. */
  startMonth: Scalars['String']['input'];
};

export type FlowDeleteTemplateInput = {
  templateId: Scalars['Id']['input'];
};

export type FlowExportTemplateXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  templateId: Scalars['Id']['input'];
};

export type FlowImportTemplateXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  /** A READY xlsx upload whose Budget sheet has the shape the export produces. */
  uploadId: Scalars['Id']['input'];
};

/** One row of the grid: the plan, plus live actuals and variance per month. */
export type FlowLine = {
  __typename?: 'FlowLine';
  /** Live actuals per grid month; null where the month has no actuals (unlinked row, future month, or no connection). */
  actualsMinorUnits: Array<Maybe<Scalars['Int']['output']>>;
  /** Planned amounts, one per grid month, integer minor units. */
  budgetsMinorUnits: Array<Scalars['Int']['output']>;
  id: Scalars['Id']['output'];
  label: Scalars['String']['output'];
  /** The P&L category this row links to on the owner's books; null for a free row. */
  linkedCategory?: Maybe<Scalars['String']['output']>;
  position: Scalars['Int']['output'];
  section: FlowSection;
  /** actual minus budget per grid month; null wherever actuals are null. */
  variancesMinorUnits: Array<Maybe<Scalars['Int']['output']>>;
};

/** The P&L categories the owner's books serve, for the link dropdown. */
export type FlowLinkableCategories = {
  __typename?: 'FlowLinkableCategories';
  expenseCategories: Array<Scalars['String']['output']>;
  incomeCategories: Array<Scalars['String']['output']>;
};

export type FlowRemoveLineInput = {
  lineId: Scalars['Id']['input'];
};

export type FlowRenameTemplateInput = {
  name: Scalars['String']['input'];
  templateId: Scalars['Id']['input'];
};

export type FlowSection =
  | 'EXPENSES'
  | 'INCOME';

/**
 * A budget/forecast template: a named grid whose columns are consecutive
 * calendar months and whose rows are FlowLines. Money follows the kernel
 * money rule (integer minor units + ISO currency).
 */
export type FlowTemplate = {
  __typename?: 'FlowTemplate';
  createdTime: Scalars['Instant']['output'];
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  /** The grid's rows: income first, then expenses, by position. */
  lines: Array<FlowLine>;
  monthCount: Scalars['Int']['output'];
  /** The grid's months, oldest first (startMonth plus monthCount - 1 more). */
  months: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** First grid month as YYYY-MM. */
  startMonth: Scalars['String']['output'];
};

export type FlowUpdateLineInput = {
  /** The full row of planned amounts (exactly monthCount entries, integer minor units). */
  budgetsMinorUnits?: InputMaybe<Array<Scalars['Int']['input']>>;
  label?: InputMaybe<Scalars['String']['input']>;
  lineId: Scalars['Id']['input'];
  /** Pass an empty string to clear the link; omit to leave it unchanged. */
  linkedCategory?: InputMaybe<Scalars['String']['input']>;
};

export type InterpretDocumentInput = {
  /** A READY application/pdf upload (the dropped document). */
  uploadId: Scalars['Id']['input'];
};

/** One extracted field: a label and the value the document states. */
export type InterpretedField = {
  __typename?: 'InterpretedField';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** One claimed (job, due time) from the job_runs ledger. */
export type JobRun = {
  __typename?: 'JobRun';
  /** The thrown error's message when status is FAILED. */
  error?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['Instant']['output']>;
  id: Scalars['Id']['output'];
  /** The registry name of the job (src/Jobs/JobsRegistry.ts). */
  jobName: Scalars['String']['output'];
  /** The cron due time this run claimed (UTC, minute precision). */
  scheduledFor: Scalars['Instant']['output'];
  startedAt: Scalars['Instant']['output'];
  status: JobRunStatus;
};

export type JobRunStatus =
  /** The handler threw; error carries the message. */
  | 'FAILED'
  /** The run claimed its due time and is executing (or crashed mid-run). */
  | 'RUNNING'
  /** The handler completed. */
  | 'SUCCEEDED';

export type MoveDriveEntryInput = {
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
  /** The destination folder; null moves the entry to the library root. */
  parentId?: InputMaybe<Scalars['Id']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addDriveAlbumEntry: DriveAlbum;
  addProjectMember: ProjectMembership;
  /** Starts the INTUIT-mode live connect: returns the Intuit consent URL to send the user to. */
  beginQuickBooksAuthorization: QuickBooksAuthorization;
  /** Cancels the caller's simulated subscription; refuses when PAYMENTS_MODE=stripe. */
  cancelTestSubscription: PaymentSubscription;
  /** Connects the caller's own books; each member gets their own connection. */
  cfoConnectMyBooks: QuickBooksConnection;
  /** Disconnects the caller's own books. Idempotent. */
  cfoDisconnectMyBooks: Scalars['Boolean']['output'];
  /** Files a member's statements as a PRIVATE xlsx workbook for the caller; download via fileUrl. */
  cfoExportClientStatementsXlsx: Upload;
  /** Invites an email into the practice as a client and sends the invite email (advisor-only). */
  cfoInviteClient: CfoInvite;
  /** Revokes a pending invite (advisor-only). */
  cfoRevokeInvite: CfoInvite;
  /** Empties the caller's whole library (the Clear-demo-library action). */
  clearDriveLibrary: Scalars['Boolean']['output'];
  /** Finishes the INTUIT-mode live connect from Intuit's callback parameters. */
  completeQuickBooksAuthorization: QuickBooksConnection;
  completeTestCheckoutSession: CheckoutSession;
  connectMyBooks: QuickBooksConnection;
  connectQuickBooks: QuickBooksConnection;
  createAccount: Account;
  createAiVoiceSession: AiVoiceSession;
  /** A Billing Portal URL for the caller's subscription (the in-app test billing page in local mode). */
  createBillingPortalSession: BillingPortalSession;
  createCheckoutSession: CheckoutSession;
  createDriveAlbum: DriveAlbum;
  createDriveFolder: DriveEntry;
  createEntryField: EntryField;
  createEntryRecord: EntryRecord;
  createProject: Project;
  createSong: Song;
  createSubscriptionCheckoutSession: CheckoutSession;
  /** Mints an upload slot: a PENDING row plus the URL and headers for the byte PUT. */
  createUpload: UploadSlot;
  createUser: User;
  /** Ingests a supporting document dropped against a letter of credit. */
  creditAttachDocument: CreditDocument;
  /** Deletes a letter of credit and its attached documents. */
  creditDeleteLc: Scalars['Boolean']['output'];
  /** Ingests a dropped LC PDF: extracts the MT700-family breakdown and persists it. */
  creditIngestLc: CreditLc;
  /** Removes one attached document. */
  creditRemoveDocument: Scalars['Boolean']['output'];
  /** Deletes the album and its memberships; entries stay untouched. */
  deleteDriveAlbum: Scalars['Boolean']['output'];
  /** Permanently deletes the entry (and subtree), objects included. */
  deleteDriveEntry: Scalars['Boolean']['output'];
  /** Deletes a field definition; existing records keep their cell values. */
  deleteEntryField: Scalars['Boolean']['output'];
  deleteEntryRecord: Scalars['Boolean']['output'];
  deleteSong: Scalars['Boolean']['output'];
  /** Deletes the stored object and its row (owner-only). */
  deleteUpload: Scalars['Boolean']['output'];
  disconnectMyBooks: Scalars['Boolean']['output'];
  disconnectQuickBooks: Scalars['Boolean']['output'];
  /** Renders the company's statements to an xlsx workbook filed PRIVATE for the caller; download via fileUrl. */
  exportQuickBooksStatementsXlsx: Upload;
  /** Verifies the bytes arrived and flips the upload to READY (owner-only, idempotent). */
  finalizeUpload: Upload;
  /** Appends a row to the grid, budgets all zero. */
  flowAddLine: FlowLine;
  /** Creates a budget template; optionally seeds rows from the live books. */
  flowCreateTemplate: FlowTemplate;
  /** Deletes a template and its lines. */
  flowDeleteTemplate: Scalars['Boolean']['output'];
  /** Renders the template to a PRIVATE xlsx workbook for the caller (Budget sheet + actuals-vs-budget sheet). */
  flowExportTemplateXlsx: Upload;
  /** Seeds a new template from a workbook's Budget sheet (the export's shape). */
  flowImportTemplateXlsx: FlowTemplate;
  flowRemoveLine: Scalars['Boolean']['output'];
  flowRenameTemplate: FlowTemplate;
  /** Updates a row's label, link, and/or planned amounts. */
  flowUpdateLine: FlowLine;
  /** Reads an uploaded PDF and returns its interpretation. Stateless: nothing is persisted. */
  interpretDocument: DocumentInterpretation;
  /** Reparents an entry; null parentId moves it to the library root. */
  moveDriveEntry: DriveEntry;
  /** Creates a deck with the full outline; slide copy defaults from the live books when connected. */
  pitchCreateDeck: PitchDeck;
  /** Deletes a deck and its slides. */
  pitchDeleteDeck: Scalars['Boolean']['output'];
  /** Renders the deck to a PRIVATE PDF for the caller via the documents kernel; download via fileUrl. */
  pitchExportDeckPdf: Upload;
  /** Updates a deck's brand fields (name, company, tagline, logo, accent). */
  pitchUpdateDeck: PitchDeck;
  /** Updates a slide's copy or include toggle (the cover cannot be excluded). */
  pitchUpdateSlide: PitchSlide;
  /** Binds a finalized upload into the tree as a FILE entry. */
  registerDriveFile: DriveEntry;
  /** Registers (or rotates) a push destination for the caller, upserting on endpoint. */
  registerPushDevice: PushDevice;
  removeDriveAlbumEntry: Scalars['Boolean']['output'];
  removeProjectMember: Scalars['Boolean']['output'];
  renameDriveAlbum: DriveAlbum;
  renameDriveEntry: DriveEntry;
  /** Swaps a file's media for freshly filed uploads (the photo rotate path). */
  replaceDriveEntryMedia: DriveEntry;
  /** Restores from the trash; falls back to the root when the parent is gone. */
  restoreDriveEntry: DriveEntry;
  setDriveEntryCaption: DriveEntry;
  setDriveEntryStarred: DriveEntry;
  /** Flips the underlying upload's visibility: the stable /file/<id> share link. */
  shareDriveEntry: DriveEntry;
  /** Moves an entry (folders take their subtree) to the trash. */
  trashDriveEntry: DriveEntry;
  /** Removes the caller's registration for the endpoint; true when one was removed. */
  unregisterPushDevice: Scalars['Boolean']['output'];
  updateEntryField: EntryField;
  updateEntryRecord: EntryRecord;
  updateProject: Project;
  updateProjectMember: ProjectMembership;
  updateSong: Song;
  updateUser: User;
  /** Server-side write: files inline bytes under the same allowlist, cap, and record as the browser flow. */
  writeFile: Upload;
};


export type MutationAddDriveAlbumEntryArgs = {
  input: AddDriveAlbumEntryInput;
};


export type MutationAddProjectMemberArgs = {
  input: AddProjectMemberInput;
};


export type MutationBeginQuickBooksAuthorizationArgs = {
  input: BeginQuickBooksAuthorizationInput;
};


export type MutationCfoConnectMyBooksArgs = {
  input: CfoConnectMyBooksInput;
};


export type MutationCfoExportClientStatementsXlsxArgs = {
  input: CfoExportClientStatementsXlsxInput;
};


export type MutationCfoInviteClientArgs = {
  input: CfoInviteClientInput;
};


export type MutationCfoRevokeInviteArgs = {
  input: CfoRevokeInviteInput;
};


export type MutationCompleteQuickBooksAuthorizationArgs = {
  input: CompleteQuickBooksAuthorizationInput;
};


export type MutationCompleteTestCheckoutSessionArgs = {
  input: CompleteTestCheckoutSessionInput;
};


export type MutationConnectMyBooksArgs = {
  input: ConnectQuickBooksInput;
};


export type MutationConnectQuickBooksArgs = {
  input: ConnectQuickBooksInput;
};


export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


export type MutationCreateBillingPortalSessionArgs = {
  input: CreateBillingPortalSessionInput;
};


export type MutationCreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type MutationCreateDriveAlbumArgs = {
  input: CreateDriveAlbumInput;
};


export type MutationCreateDriveFolderArgs = {
  input: CreateDriveFolderInput;
};


export type MutationCreateEntryFieldArgs = {
  input: CreateEntryFieldInput;
};


export type MutationCreateEntryRecordArgs = {
  input: CreateEntryRecordInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateSongArgs = {
  input: CreateSongInput;
};


export type MutationCreateSubscriptionCheckoutSessionArgs = {
  input: CreateSubscriptionCheckoutSessionInput;
};


export type MutationCreateUploadArgs = {
  input: CreateUploadInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreditAttachDocumentArgs = {
  input: CreditAttachDocumentInput;
};


export type MutationCreditDeleteLcArgs = {
  input: CreditDeleteLcInput;
};


export type MutationCreditIngestLcArgs = {
  input: CreditIngestLcInput;
};


export type MutationCreditRemoveDocumentArgs = {
  input: CreditRemoveDocumentInput;
};


export type MutationDeleteDriveAlbumArgs = {
  input: DeleteDriveAlbumInput;
};


export type MutationDeleteDriveEntryArgs = {
  input: DeleteDriveEntryInput;
};


export type MutationDeleteEntryFieldArgs = {
  input: DeleteEntryFieldInput;
};


export type MutationDeleteEntryRecordArgs = {
  input: DeleteEntryRecordInput;
};


export type MutationDeleteSongArgs = {
  input: DeleteSongInput;
};


export type MutationDeleteUploadArgs = {
  input: DeleteUploadInput;
};


export type MutationExportQuickBooksStatementsXlsxArgs = {
  input: ExportQuickBooksStatementsXlsxInput;
};


export type MutationFinalizeUploadArgs = {
  input: FinalizeUploadInput;
};


export type MutationFlowAddLineArgs = {
  input: FlowAddLineInput;
};


export type MutationFlowCreateTemplateArgs = {
  input: FlowCreateTemplateInput;
};


export type MutationFlowDeleteTemplateArgs = {
  input: FlowDeleteTemplateInput;
};


export type MutationFlowExportTemplateXlsxArgs = {
  input: FlowExportTemplateXlsxInput;
};


export type MutationFlowImportTemplateXlsxArgs = {
  input: FlowImportTemplateXlsxInput;
};


export type MutationFlowRemoveLineArgs = {
  input: FlowRemoveLineInput;
};


export type MutationFlowRenameTemplateArgs = {
  input: FlowRenameTemplateInput;
};


export type MutationFlowUpdateLineArgs = {
  input: FlowUpdateLineInput;
};


export type MutationInterpretDocumentArgs = {
  input: InterpretDocumentInput;
};


export type MutationMoveDriveEntryArgs = {
  input: MoveDriveEntryInput;
};


export type MutationPitchCreateDeckArgs = {
  input: PitchCreateDeckInput;
};


export type MutationPitchDeleteDeckArgs = {
  input: PitchDeleteDeckInput;
};


export type MutationPitchExportDeckPdfArgs = {
  input: PitchExportDeckPdfInput;
};


export type MutationPitchUpdateDeckArgs = {
  input: PitchUpdateDeckInput;
};


export type MutationPitchUpdateSlideArgs = {
  input: PitchUpdateSlideInput;
};


export type MutationRegisterDriveFileArgs = {
  input: RegisterDriveFileInput;
};


export type MutationRegisterPushDeviceArgs = {
  input: RegisterPushDeviceInput;
};


export type MutationRemoveDriveAlbumEntryArgs = {
  input: RemoveDriveAlbumEntryInput;
};


export type MutationRemoveProjectMemberArgs = {
  input: RemoveProjectMemberInput;
};


export type MutationRenameDriveAlbumArgs = {
  input: RenameDriveAlbumInput;
};


export type MutationRenameDriveEntryArgs = {
  input: RenameDriveEntryInput;
};


export type MutationReplaceDriveEntryMediaArgs = {
  input: ReplaceDriveEntryMediaInput;
};


export type MutationRestoreDriveEntryArgs = {
  input: RestoreDriveEntryInput;
};


export type MutationSetDriveEntryCaptionArgs = {
  input: SetDriveEntryCaptionInput;
};


export type MutationSetDriveEntryStarredArgs = {
  input: SetDriveEntryStarredInput;
};


export type MutationShareDriveEntryArgs = {
  input: ShareDriveEntryInput;
};


export type MutationTrashDriveEntryArgs = {
  input: TrashDriveEntryInput;
};


export type MutationUnregisterPushDeviceArgs = {
  input: UnregisterPushDeviceInput;
};


export type MutationUpdateEntryFieldArgs = {
  input: UpdateEntryFieldInput;
};


export type MutationUpdateEntryRecordArgs = {
  input: UpdateEntryRecordInput;
};


export type MutationUpdateProjectArgs = {
  input: UpdateProjectInput;
};


export type MutationUpdateProjectMemberArgs = {
  input: UpdateProjectMemberInput;
};


export type MutationUpdateSongArgs = {
  input: UpdateSongInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationWriteFileArgs = {
  input: WriteFileInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaginationInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

/**
 * One user's subscription: written exactly once when its checkout session
 * reaches PAID, then moved through ACTIVE / PAST_DUE / CANCELED by Stripe's
 * lifecycle events. Never anonymous.
 */
export type PaymentSubscription = {
  __typename?: 'PaymentSubscription';
  /** Per-period total in the currency's minor units. */
  amountTotal: Scalars['Int']['output'];
  createdTime: Scalars['Instant']['output'];
  currency: Scalars['String']['output'];
  /** End of the current billing period as reported by Stripe; null for LOCAL subscriptions. */
  currentPeriodEnd?: Maybe<Scalars['Instant']['output']>;
  id: Scalars['Id']['output'];
  /** Product snapshot taken at activation time. */
  productKey: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  provider: CheckoutProvider;
  recurringInterval: SubscriptionInterval;
  status: SubscriptionStatus;
};

export type PitchCreateDeckInput = {
  companyName: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagline?: InputMaybe<Scalars['String']['input']>;
};

/** An investor deck: brand plus the slide outline. */
export type PitchDeck = {
  __typename?: 'PitchDeck';
  /** Hex accent color for slide accents, e.g. "#1f6feb". */
  accentColor: Scalars['String']['output'];
  companyName: Scalars['String']['output'];
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  /** The uploaded logo (an uploads row), or null for no logo. */
  logoUploadId?: Maybe<Scalars['Id']['output']>;
  name: Scalars['String']['output'];
  /** The outline in order; excluded slides stay in the list with included: false. */
  slides: Array<PitchSlide>;
  tagline?: Maybe<Scalars['String']['output']>;
};

/**
 * The live numbers behind the chart slides, computed from the caller's books.
 * Served only while the books are connected (the query returns null otherwise).
 */
export type PitchDeckData = {
  __typename?: 'PitchDeckData';
  /** Trailing-three-month average net income; negative means burn. */
  averageNetIncomeMinorUnits: Scalars['Int']['output'];
  /** Month-end cash, trailing thirteen months. */
  cashSeries: Array<PitchSeriesPoint>;
  /** The connected company the numbers come from. */
  companyName: Scalars['String']['output'];
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  customerCount: Scalars['Int']['output'];
  expenseSeries: Array<PitchSeriesPoint>;
  latestCashMinorUnits: Scalars['Int']['output'];
  netIncomeSeries: Array<PitchSeriesPoint>;
  /** Latest month's net margin, whole percent. */
  netMarginPercent: Scalars['Int']['output'];
  paidInvoiceCount: Scalars['Int']['output'];
  /** Revenue change over the trailing year, whole percent. */
  revenueGrowthPercent: Scalars['Int']['output'];
  /** Monthly revenue, trailing thirteen months, oldest first. */
  revenueSeries: Array<PitchSeriesPoint>;
  /** Whole months of runway at the trailing burn; null when cash-flow positive. */
  runwayMonths?: Maybe<Scalars['Int']['output']>;
  trailingTwelveMonthRevenueMinorUnits: Scalars['Int']['output'];
};

export type PitchDeleteDeckInput = {
  deckId: Scalars['Id']['input'];
};

export type PitchExportDeckPdfInput = {
  deckId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
};

/** One month of a deck metric, integer minor units. */
export type PitchSeriesPoint = {
  __typename?: 'PitchSeriesPoint';
  minorUnits: Scalars['Int']['output'];
  /** ISO month, YYYY-MM. */
  month: Scalars['String']['output'];
};

/** One slide: editable copy plus an include toggle (the cover is always included). */
export type PitchSlide = {
  __typename?: 'PitchSlide';
  body: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  included: Scalars['Boolean']['output'];
  kind: PitchSlideKind;
  position: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

/** The fixed deck outline; every deck has one slide of each kind. */
export type PitchSlideKind =
  | 'ASK'
  | 'COVER'
  | 'MARGINS'
  | 'REVENUE'
  | 'RUNWAY'
  | 'TRACTION';

export type PitchUpdateDeckInput = {
  accentColor?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  deckId: Scalars['Id']['input'];
  /** A READY image upload to brand the cover; empty string clears; omit to leave unchanged. */
  logoUploadId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** Pass an empty string to clear; omit to leave unchanged. */
  tagline?: InputMaybe<Scalars['String']['input']>;
};

export type PitchUpdateSlideInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  included?: InputMaybe<Scalars['Boolean']['input']>;
  slideId: Scalars['Id']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type Project = {
  __typename?: 'Project';
  archivedAt?: Maybe<Scalars['Instant']['output']>;
  createdBy: User;
  createdTime: Scalars['Instant']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  memberships: Array<ProjectMembership>;
  name: Scalars['String']['output'];
  status: ProjectStatus;
};

export type ProjectConnection = {
  __typename?: 'ProjectConnection';
  nodes: Array<Maybe<Project>>;
  pageInfo: PageInfo;
};

export type ProjectConnectionFilters = {
  name?: InputMaybe<Scalars['String']['input']>;
  statuses?: InputMaybe<Array<ProjectStatus>>;
};

export type ProjectConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<ProjectConnectionFilters>;
};

export type ProjectMembership = {
  __typename?: 'ProjectMembership';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  project: Project;
  role: ProjectMembershipRole;
  user: User;
};

export type ProjectMembershipRole =
  | 'EDITOR'
  | 'OWNER'
  | 'VIEWER';

export type ProjectStatus =
  | 'ACTIVE'
  | 'ARCHIVED';

/** One PAID checkout, written exactly once no matter which observer saw payment first. */
export type Purchase = {
  __typename?: 'Purchase';
  /** Total in the currency's minor units. */
  amountTotal: Scalars['Int']['output'];
  /** Buyer email from the payment provider when available (receipts are sent here); null for LOCAL test checkouts. */
  buyerEmail?: Maybe<Scalars['String']['output']>;
  checkoutSessionId: Scalars['Id']['output'];
  createdTime: Scalars['Instant']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  productKey: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  provider: CheckoutProvider;
};

export type PurchaseConnection = {
  __typename?: 'PurchaseConnection';
  nodes: Array<Maybe<Purchase>>;
  pageInfo: PageInfo;
};

export type PurchaseConnectionInput = {
  connection: ConnectionInput;
};

/** One registered push destination (a browser subscription; native devices in C1b). */
export type PushDevice = {
  __typename?: 'PushDevice';
  createdTime: Scalars['Instant']['output'];
  /** The transport identity: the Web Push subscription endpoint (native device tokens in C1b). */
  endpoint: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  platform: PushDevicePlatform;
  /** Bumped every time the endpoint is (re-)registered. */
  rotatedTime: Scalars['Instant']['output'];
};

export type PushDevicePlatform =
  /** An Android device via FCM. Registration rails exist; the transport is the C1b follow-up. */
  | 'ANDROID'
  /** An iPhone/iPad via APNs. Registration rails exist; the transport is the C1b follow-up. */
  | 'IOS'
  /** A browser, via Web Push (the only channel with a live transport today). */
  | 'WEB';

export type Query = {
  __typename?: 'Query';
  accounts: AccountConnection;
  /** One member's books: the advisor may pass any member; a client only themself. */
  cfoClient: CfoClient;
  /** Every client with the live state of their books (advisor-only). */
  cfoClients: Array<CfoClient>;
  /** Every invite, newest first (advisor-only). */
  cfoInvites: Array<CfoInvite>;
  /** The caller's practice membership, created on first touch (first user = advisor). */
  cfoMyMembership: CfoMembership;
  checkoutSession: CheckoutSession;
  /** One letter of credit with its documents and discrepancy report. */
  creditLc: CreditLc;
  /** The caller's letters of credit, newest first. */
  creditLcs: Array<CreditLc>;
  currentUser: User;
  driveAlbum: DriveAlbum;
  /** The caller's albums, by name. */
  driveAlbums: Array<DriveAlbum>;
  driveEntries: DriveEntryConnection;
  driveEntry: DriveEntry;
  entryFieldCreateFormSchema: SchemaForm;
  entryFieldUpdateFormSchema: SchemaForm;
  /** The workbook's field definitions, in column order. */
  entryFields: Array<EntryField>;
  /** Built dynamically from the live field definitions — the modal form IS the user's schema. */
  entryRecordCreateFormSchema: SchemaForm;
  entryRecordUpdateFormSchema: SchemaForm;
  entryRecords: EntryRecordConnection;
  /** The download URL for a READY upload (PUBLIC: stable; PRIVATE: owner-checked, short-lived). */
  fileUrl: FileUrl;
  /** The P&L categories the caller's books serve, for the link dropdown. */
  flowLinkableCategories: FlowLinkableCategories;
  /** One template with its computed grid (live actuals + variance). */
  flowTemplate: FlowTemplate;
  /** The caller's budget templates, newest first. */
  flowTemplates: Array<FlowTemplate>;
  /** Scheduled-job run history, newest first (optionally one job, capped at 200). */
  jobRuns: Array<JobRun>;
  /** The caller's own books connection, or null before connecting (per-user surface). */
  myBooksConnection?: Maybe<QuickBooksConnection>;
  /** The caller's subscription (most recent; optionally scoped to a product), or null. */
  mySubscription?: Maybe<PaymentSubscription>;
  /** One deck with its slide outline. */
  pitchDeck: PitchDeck;
  /** The live numbers behind the chart slides; null before the books are connected. */
  pitchDeckData?: Maybe<PitchDeckData>;
  /** The caller's decks, newest first. */
  pitchDecks: Array<PitchDeck>;
  project: Project;
  projectCreateFormSchema: SchemaForm;
  projectUpdateFormSchema: SchemaForm;
  projects: ProjectConnection;
  purchases: PurchaseConnection;
  /** Thirteen trailing month-end balance sheets, oldest first. */
  quickBooksBalanceSheet: Array<QuickBooksBalanceSheetPeriod>;
  quickBooksCompanySnapshot: QuickBooksCompanySnapshot;
  quickBooksCustomers: Array<QuickBooksCustomer>;
  quickBooksInvoices: Array<QuickBooksInvoice>;
  /** Thirteen trailing months of P&L, oldest first. */
  quickBooksProfitAndLoss: Array<QuickBooksProfitAndLossPeriod>;
  quickBooksStatus: QuickBooksStatus;
  shopProduct: ShopProduct;
  shopProducts: Array<ShopProduct>;
  song: Song;
  songCreateFormSchema: SchemaForm;
  songUpdateFormSchema: SchemaForm;
  songs: SongConnection;
  userCreateFormSchema: SchemaForm;
  userUpdateFormSchema: SchemaForm;
  users: UserConnection;
};


export type QueryAccountsArgs = {
  input: AccountConnectionInput;
};


export type QueryCfoClientArgs = {
  clientUserId: Scalars['Id']['input'];
};


export type QueryCheckoutSessionArgs = {
  id: Scalars['Id']['input'];
};


export type QueryCreditLcArgs = {
  lcId: Scalars['Id']['input'];
};


export type QueryDriveAlbumArgs = {
  albumId: Scalars['Id']['input'];
};


export type QueryDriveEntriesArgs = {
  input: DriveEntryConnectionInput;
};


export type QueryDriveEntryArgs = {
  id: Scalars['Id']['input'];
};


export type QueryEntryFieldUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QueryEntryRecordUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QueryEntryRecordsArgs = {
  input: EntryRecordConnectionInput;
};


export type QueryFileUrlArgs = {
  uploadId: Scalars['Id']['input'];
};


export type QueryFlowTemplateArgs = {
  templateId: Scalars['Id']['input'];
};


export type QueryJobRunsArgs = {
  jobName?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMySubscriptionArgs = {
  productKey?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPitchDeckArgs = {
  deckId: Scalars['Id']['input'];
};


export type QueryProjectArgs = {
  id: Scalars['Id']['input'];
};


export type QueryProjectUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QueryProjectsArgs = {
  input: ProjectConnectionInput;
};


export type QueryPurchasesArgs = {
  input: PurchaseConnectionInput;
};


export type QueryQuickBooksInvoicesArgs = {
  input?: InputMaybe<QuickBooksInvoicesInput>;
};


export type QuerySongArgs = {
  id: Scalars['Id']['input'];
};


export type QuerySongUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QuerySongsArgs = {
  input: SongConnectionInput;
};


export type QueryUserUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QueryUsersArgs = {
  input: UserConnectionInput;
};

/** The Intuit consent-screen hand-off that starts a live (INTUIT-mode) connect. */
export type QuickBooksAuthorization = {
  __typename?: 'QuickBooksAuthorization';
  /** Send the user's browser here; Intuit redirects back with code, state and realmId. */
  authorizationUrl: Scalars['String']['output'];
};

/** One month-end balance sheet. Assets always equal liabilities plus equity. */
export type QuickBooksBalanceSheetPeriod = {
  __typename?: 'QuickBooksBalanceSheetPeriod';
  assetLines: Array<QuickBooksStatementLine>;
  equityLines: Array<QuickBooksStatementLine>;
  liabilityLines: Array<QuickBooksStatementLine>;
  /** Calendar month as YYYY-MM (as-of month end). */
  month: Scalars['String']['output'];
  totalAssetsMinorUnits: Scalars['Int']['output'];
  totalEquityMinorUnits: Scalars['Int']['output'];
  totalLiabilitiesMinorUnits: Scalars['Int']['output'];
};

export type QuickBooksCompanySnapshot = {
  __typename?: 'QuickBooksCompanySnapshot';
  companyName: Scalars['String']['output'];
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  customerCount: Scalars['Int']['output'];
  openInvoiceCount: Scalars['Int']['output'];
  /** Sum of unpaid invoice balances (open + overdue), in minor units. */
  outstandingMinorUnits: Scalars['Int']['output'];
  overdueInvoiceCount: Scalars['Int']['output'];
  /** Sum of overdue invoice balances, in minor units. */
  overdueMinorUnits: Scalars['Int']['output'];
  paidInvoiceCount: Scalars['Int']['output'];
  /** Sum of paid invoice totals, in the currency's minor units (cents for USD). */
  revenueMinorUnits: Scalars['Int']['output'];
};

export type QuickBooksConnection = {
  __typename?: 'QuickBooksConnection';
  companyName: Scalars['String']['output'];
  connectedTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  mode: QuickBooksMode;
  /** Which accounting provider this connection is for. */
  provider: AccountingProvider;
  /** The QuickBooks company (realm) id this connection is bound to. */
  realmId: Scalars['String']['output'];
};

export type QuickBooksCustomer = {
  __typename?: 'QuickBooksCustomer';
  city: Scalars['String']['output'];
  companyName?: Maybe<Scalars['String']['output']>;
  /** Date the customer was added, as YYYY-MM-DD. */
  customerSince: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  /** QuickBooks-side customer id. */
  id: Scalars['String']['output'];
  /** Sum of this customer's unpaid invoice balances, in minor units. */
  openBalanceMinorUnits: Scalars['Int']['output'];
  state: Scalars['String']['output'];
};

export type QuickBooksInvoice = {
  __typename?: 'QuickBooksInvoice';
  /** Unpaid remainder in minor units; 0 for paid invoices. */
  balanceMinorUnits: Scalars['Int']['output'];
  customerId: Scalars['String']['output'];
  customerName: Scalars['String']['output'];
  docNumber: Scalars['String']['output'];
  /** Due date as YYYY-MM-DD. */
  dueDate: Scalars['String']['output'];
  /** QuickBooks-side invoice id. */
  id: Scalars['String']['output'];
  /** Issue date as YYYY-MM-DD. */
  issueDate: Scalars['String']['output'];
  status: QuickBooksInvoiceStatus;
  /** Invoice total in minor units. */
  totalMinorUnits: Scalars['Int']['output'];
};

export type QuickBooksInvoiceStatus =
  | 'OPEN'
  | 'OVERDUE'
  | 'PAID';

export type QuickBooksInvoicesFilters = {
  statuses?: InputMaybe<Array<QuickBooksInvoiceStatus>>;
};

export type QuickBooksInvoicesInput = {
  filters?: InputMaybe<QuickBooksInvoicesFilters>;
};

export type QuickBooksMode =
  | 'INTUIT'
  | 'LOCAL';

/** One calendar month of profit & loss. Thirteen trailing months are served, oldest first. */
export type QuickBooksProfitAndLossPeriod = {
  __typename?: 'QuickBooksProfitAndLossPeriod';
  expenseLines: Array<QuickBooksStatementLine>;
  incomeLines: Array<QuickBooksStatementLine>;
  /** Calendar month as YYYY-MM. */
  month: Scalars['String']['output'];
  netIncomeMinorUnits: Scalars['Int']['output'];
  totalExpensesMinorUnits: Scalars['Int']['output'];
  totalIncomeMinorUnits: Scalars['Int']['output'];
};

/** Which statements an xlsx export includes. */
export type QuickBooksStatementExportKind =
  | 'ALL'
  | 'BALANCE_SHEET'
  | 'PROFIT_AND_LOSS';

/** One category line on a financial statement, in the currency's minor units. */
export type QuickBooksStatementLine = {
  __typename?: 'QuickBooksStatementLine';
  category: Scalars['String']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type QuickBooksStatus = {
  __typename?: 'QuickBooksStatus';
  connected: Scalars['Boolean']['output'];
  connection?: Maybe<QuickBooksConnection>;
  /** How new connections connect here: LOCAL (instant, simulated) or INTUIT (the OAuth flow). */
  mode: QuickBooksMode;
};

export type RegisterDriveFileFields = {
  caption?: InputMaybe<Scalars['String']['input']>;
  /** Photo lens: the EXIF capture time the client extracted before finalize. */
  capturedTime?: InputMaybe<Scalars['Instant']['input']>;
  name: Scalars['String']['input'];
  /** The destination folder; null/omitted registers at the library root. */
  parentId?: InputMaybe<Scalars['Id']['input']>;
  /** Photo lens: a sibling WebP thumbnail filed through the kernel. */
  thumbUploadId?: InputMaybe<Scalars['Id']['input']>;
  /** A finalized (READY) upload of the caller's, not yet registered. */
  uploadId: Scalars['Id']['input'];
};

export type RegisterDriveFileInput = {
  fields: RegisterDriveFileFields;
  idempotencyKey: Scalars['String']['input'];
};

export type RegisterPushDeviceInput = {
  /** Unique per browser/device; registration upserts on it. */
  endpoint: Scalars['String']['input'];
  platform: PushDevicePlatform;
  /** The full browser PushSubscription JSON (endpoint + keys.p256dh + keys.auth) for WEB. */
  subscriptionJson: Scalars['String']['input'];
};

export type RemoveDriveAlbumEntryInput = {
  albumId: Scalars['Id']['input'];
  entryId: Scalars['Id']['input'];
};

export type RemoveProjectMemberInput = {
  objectId: Scalars['Id']['input'];
};

export type RenameDriveAlbumInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type RenameDriveEntryInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type ReplaceDriveEntryMediaInput = {
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
  /** The replacement thumbnail; null/omitted drops the old one. */
  thumbUploadId?: InputMaybe<Scalars['Id']['input']>;
  /** The freshly filed replacement upload (READY, caller-owned). */
  uploadId: Scalars['Id']['input'];
};

export type RestoreDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type SchemaForm = {
  __typename?: 'SchemaForm';
  defaultData: Scalars['String']['output'];
  jsonSchema: Scalars['String']['output'];
  uiSchema: Scalars['String']['output'];
};

export type SchemaFormUpdateInput = {
  objectId: Scalars['Id']['input'];
};

export type SetDriveEntryCaptionInput = {
  /** Null clears the caption. */
  caption?: InputMaybe<Scalars['String']['input']>;
  objectId: Scalars['Id']['input'];
};

export type SetDriveEntryStarredInput = {
  objectId: Scalars['Id']['input'];
  starred: Scalars['Boolean']['input'];
};

export type ShareDriveEntryInput = {
  objectId: Scalars['Id']['input'];
  /** True flips the underlying upload PUBLIC; false back to PRIVATE. */
  shared: Scalars['Boolean']['input'];
};

export type ShipmentTerm =
  | 'ALLOWED'
  | 'NOT_ALLOWED'
  | 'NOT_STATED';

export type ShopProduct = {
  __typename?: 'ShopProduct';
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Price in the currency's minor units (cents for USD). */
  priceMinorUnits: Scalars['Int']['output'];
  tagline: Scalars['String']['output'];
};

export type Song = {
  __typename?: 'Song';
  artist: Scalars['String']['output'];
  /** 1 is the top of the chart. */
  chartRank: Scalars['Int']['output'];
  createdTime: Scalars['Instant']['output'];
  genre: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  /** Lifetime streams in billions, when known. */
  streamsBillions?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  updatedTime: Scalars['Instant']['output'];
  year: Scalars['Int']['output'];
};

export type SongConnection = {
  __typename?: 'SongConnection';
  nodes: Array<Maybe<Song>>;
  pageInfo: PageInfo;
};

export type SongConnectionFilters = {
  /** Case-insensitive substring match across title, artist, genre, and notes. */
  search?: InputMaybe<Scalars['String']['input']>;
};

export type SongConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<SongConnectionFilters>;
};

export type SortDirection =
  | 'asc'
  | 'desc';

export type SortOrderInput = {
  direction: SortDirection;
  fieldName: Scalars['String']['input'];
};

export type SubscriptionInterval =
  | 'MONTH'
  | 'YEAR';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE';

export type TrashDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type UnregisterPushDeviceInput = {
  endpoint: Scalars['String']['input'];
};

export type UpdateEntryFieldFields = {
  label?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateEntryFieldInput = {
  fields: UpdateEntryFieldFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type UpdateEntryRecordFields = {
  valuesJson: Scalars['String']['input'];
};

export type UpdateEntryRecordInput = {
  fields: UpdateEntryRecordFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type UpdateProjectFields = {
  description?: InputMaybe<Scalars['String']['input']>;
  doArchive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectInput = {
  fields: UpdateProjectFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type UpdateProjectMemberFields = {
  role: ProjectMembershipRole;
};

export type UpdateProjectMemberInput = {
  fields: UpdateProjectMemberFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type UpdateSongFields = {
  artist?: InputMaybe<Scalars['String']['input']>;
  chartRank?: InputMaybe<Scalars['Int']['input']>;
  genre?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  streamsBillions?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSongInput = {
  fields: UpdateSongFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type UpdateUserFields = {
  /** A READY PUBLIC upload id from the storage kernel (Settings avatar flow). */
  avatarUploadId?: InputMaybe<Scalars['Id']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
};

export type UpdateUserInput = {
  fields: UpdateUserFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type Upload = {
  __typename?: 'Upload';
  contentType: Scalars['String']['output'];
  createdTime: Scalars['Instant']['output'];
  /** The download-friendly name the file was filed with, when the caller supplied one. */
  fileName?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  /** Declared at create time; the actual byte count once READY. */
  sizeBytes: Scalars['Int']['output'];
  status: UploadStatus;
  visibility: UploadVisibility;
};

/** Admission profiles (Services/Storage/StorageConfig.ts): each surface's allowlist and size cap. */
export type UploadProfile =
  /** The original avatar-era rules: a small allowlist at 20MB. */
  | 'DEFAULT'
  /** The drive surface (Files/Images packs): broad document and media types at 100MB. */
  | 'DRIVE';

/** Everything the client needs to PUT the file bytes. */
export type UploadSlot = {
  __typename?: 'UploadSlot';
  /** Headers to send verbatim on the PUT, JSON-encoded ({"Content-Type": ...}). */
  headersJson: Scalars['String']['output'];
  upload: Upload;
  uploadId: Scalars['Id']['output'];
  /** Absolute signed GCS URL (gcs mode) or a /upload path on the storage function (local mode). */
  uploadUrl: Scalars['String']['output'];
};

export type UploadStatus =
  /** The slot exists; bytes have not been verified yet. */
  | 'PENDING'
  /** Bytes are verified and the file is servable. */
  | 'READY';

export type UploadVisibility =
  /** Only the owner can mint a short-lived download URL. */
  | 'PRIVATE'
  /** Anyone with the file URL can read it (stable /file/<id> serving URL). */
  | 'PUBLIC';

export type User = {
  __typename?: 'User';
  account?: Maybe<Account>;
  /** The user's avatar upload (storage kernel), or null when none is set. */
  avatarUploadId?: Maybe<Scalars['Id']['output']>;
  createdTime: Scalars['Instant']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  status: UserStatus;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  nodes: Array<Maybe<User>>;
  pageInfo: PageInfo;
};

export type UserConnectionFilters = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  statuses?: InputMaybe<Array<UserStatus>>;
};

export type UserConnectionInput = {
  connection: ConnectionInput;
  filters?: InputMaybe<UserConnectionFilters>;
};

export type UserStatus =
  | 'ACTIVE'
  | 'DISABLED';

export type WriteFileFields = {
  /** The file bytes, base64-encoded; decoded size is held to the same cap as a browser upload. */
  bytesBase64: Scalars['String']['input'];
  /** Must be on the kernel's content-type allowlist (Services/Storage/StorageConfig.ts). */
  contentType: Scalars['String']['input'];
  /** Optional download-friendly name recorded on the upload (e.g. a generated document's). */
  fileName?: InputMaybe<Scalars['String']['input']>;
  visibility: UploadVisibility;
};

export type WriteFileInput = {
  fields: WriteFileFields;
  idempotencyKey: Scalars['String']['input'];
};

export type CfoMembershipFieldsFragment = { __typename?: 'CfoMembership', id: string, role: CfoRole, joinedTime: string, user: { __typename?: 'User', id: string, email: string, displayName: string } };

export type CfoInviteFieldsFragment = { __typename?: 'CfoInvite', id: string, email: string, role: CfoRole, status: CfoInviteStatus, invitedTime: string };

export type CfoMyMembershipQueryVariables = Exact<{ [key: string]: never; }>;


export type CfoMyMembershipQuery = { __typename?: 'Query', cfoMyMembership: { __typename?: 'CfoMembership', id: string, role: CfoRole, joinedTime: string, user: { __typename?: 'User', id: string, email: string, displayName: string } } };

export type CfoClientsQueryVariables = Exact<{ [key: string]: never; }>;


export type CfoClientsQuery = { __typename?: 'Query', cfoClients: Array<{ __typename?: 'CfoClient', membership: { __typename?: 'CfoMembership', id: string, role: CfoRole, joinedTime: string, user: { __typename?: 'User', id: string, email: string, displayName: string } }, connection?: { __typename?: 'QuickBooksConnection', id: string, companyName: string, provider: AccountingProvider, connectedTime: string } | null, snapshot?: { __typename?: 'QuickBooksCompanySnapshot', companyName: string, currency: string, revenueMinorUnits: number, outstandingMinorUnits: number, overdueMinorUnits: number, paidInvoiceCount: number, openInvoiceCount: number, overdueInvoiceCount: number, customerCount: number } | null, profitAndLoss: Array<{ __typename?: 'QuickBooksProfitAndLossPeriod', month: string, totalIncomeMinorUnits: number, totalExpensesMinorUnits: number, netIncomeMinorUnits: number }> }> };

export type CfoClientStatementsQueryVariables = Exact<{
  clientUserId: Scalars['Id']['input'];
}>;


export type CfoClientStatementsQuery = { __typename?: 'Query', cfoClient: { __typename?: 'CfoClient', membership: { __typename?: 'CfoMembership', id: string, role: CfoRole, joinedTime: string, user: { __typename?: 'User', id: string, email: string, displayName: string } }, connection?: { __typename?: 'QuickBooksConnection', id: string, companyName: string, provider: AccountingProvider, connectedTime: string } | null, snapshot?: { __typename?: 'QuickBooksCompanySnapshot', companyName: string, currency: string, revenueMinorUnits: number, outstandingMinorUnits: number, overdueMinorUnits: number, paidInvoiceCount: number, openInvoiceCount: number, overdueInvoiceCount: number, customerCount: number } | null, profitAndLoss: Array<{ __typename?: 'QuickBooksProfitAndLossPeriod', month: string, totalIncomeMinorUnits: number, totalExpensesMinorUnits: number, netIncomeMinorUnits: number, incomeLines: Array<{ __typename?: 'QuickBooksStatementLine', category: string, minorUnits: number }>, expenseLines: Array<{ __typename?: 'QuickBooksStatementLine', category: string, minorUnits: number }> }>, balanceSheet: Array<{ __typename?: 'QuickBooksBalanceSheetPeriod', month: string, totalAssetsMinorUnits: number, totalLiabilitiesMinorUnits: number, totalEquityMinorUnits: number, assetLines: Array<{ __typename?: 'QuickBooksStatementLine', category: string, minorUnits: number }>, liabilityLines: Array<{ __typename?: 'QuickBooksStatementLine', category: string, minorUnits: number }>, equityLines: Array<{ __typename?: 'QuickBooksStatementLine', category: string, minorUnits: number }> }> } };

export type CfoInvitesQueryVariables = Exact<{ [key: string]: never; }>;


export type CfoInvitesQuery = { __typename?: 'Query', cfoInvites: Array<{ __typename?: 'CfoInvite', id: string, email: string, role: CfoRole, status: CfoInviteStatus, invitedTime: string }> };

export type CfoInviteClientMutationVariables = Exact<{
  input: CfoInviteClientInput;
}>;


export type CfoInviteClientMutation = { __typename?: 'Mutation', cfoInviteClient: { __typename?: 'CfoInvite', id: string, email: string, role: CfoRole, status: CfoInviteStatus, invitedTime: string } };

export type CfoRevokeInviteMutationVariables = Exact<{
  input: CfoRevokeInviteInput;
}>;


export type CfoRevokeInviteMutation = { __typename?: 'Mutation', cfoRevokeInvite: { __typename?: 'CfoInvite', id: string, email: string, role: CfoRole, status: CfoInviteStatus, invitedTime: string } };

export type CfoConnectMyBooksMutationVariables = Exact<{
  input: CfoConnectMyBooksInput;
}>;


export type CfoConnectMyBooksMutation = { __typename?: 'Mutation', cfoConnectMyBooks: { __typename?: 'QuickBooksConnection', id: string, companyName: string, provider: AccountingProvider, connectedTime: string } };

export type CfoDisconnectMyBooksMutationVariables = Exact<{ [key: string]: never; }>;


export type CfoDisconnectMyBooksMutation = { __typename?: 'Mutation', cfoDisconnectMyBooks: boolean };

export type CfoExportClientStatementsXlsxMutationVariables = Exact<{
  input: CfoExportClientStatementsXlsxInput;
}>;


export type CfoExportClientStatementsXlsxMutation = { __typename?: 'Mutation', cfoExportClientStatementsXlsx: { __typename?: 'Upload', id: string, fileName?: string | null } };

export type CreditDocumentFieldsFragment = { __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string };

export type CreditFindingFieldsFragment = { __typename?: 'CreditFinding', code: string, severity: CreditFindingSeverity, title: string, detail: string, documentId?: string | null };

export type CreditLcFieldsFragment = { __typename?: 'CreditLc', id: string, uploadId: string, reference: string, issuingBank?: string | null, applicant?: string | null, beneficiary?: string | null, currency: string, amountMinorUnits: number, tolerancePercent: number, issueDate?: string | null, expiryDate: string, latestShipmentDate?: string | null, presentationPeriodDays?: number | null, portOfLoading?: string | null, portOfDischarge?: string | null, partialShipments: ShipmentTerm, transhipment: ShipmentTerm, goodsDescription: string, documentsRequired: Array<string>, ingestedTime: string, documents: Array<{ __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string }>, findings: Array<{ __typename?: 'CreditFinding', code: string, severity: CreditFindingSeverity, title: string, detail: string, documentId?: string | null }> };

export type CreditLcsQueryVariables = Exact<{ [key: string]: never; }>;


export type CreditLcsQuery = { __typename?: 'Query', creditLcs: Array<{ __typename?: 'CreditLc', id: string, uploadId: string, reference: string, issuingBank?: string | null, applicant?: string | null, beneficiary?: string | null, currency: string, amountMinorUnits: number, tolerancePercent: number, issueDate?: string | null, expiryDate: string, latestShipmentDate?: string | null, presentationPeriodDays?: number | null, portOfLoading?: string | null, portOfDischarge?: string | null, partialShipments: ShipmentTerm, transhipment: ShipmentTerm, goodsDescription: string, documentsRequired: Array<string>, ingestedTime: string, documents: Array<{ __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string }>, findings: Array<{ __typename?: 'CreditFinding', code: string, severity: CreditFindingSeverity, title: string, detail: string, documentId?: string | null }> }> };

export type CreditLcQueryVariables = Exact<{
  lcId: Scalars['Id']['input'];
}>;


export type CreditLcQuery = { __typename?: 'Query', creditLc: { __typename?: 'CreditLc', id: string, uploadId: string, reference: string, issuingBank?: string | null, applicant?: string | null, beneficiary?: string | null, currency: string, amountMinorUnits: number, tolerancePercent: number, issueDate?: string | null, expiryDate: string, latestShipmentDate?: string | null, presentationPeriodDays?: number | null, portOfLoading?: string | null, portOfDischarge?: string | null, partialShipments: ShipmentTerm, transhipment: ShipmentTerm, goodsDescription: string, documentsRequired: Array<string>, ingestedTime: string, documents: Array<{ __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string }>, findings: Array<{ __typename?: 'CreditFinding', code: string, severity: CreditFindingSeverity, title: string, detail: string, documentId?: string | null }> } };

export type CreditIngestLcMutationVariables = Exact<{
  input: CreditIngestLcInput;
}>;


export type CreditIngestLcMutation = { __typename?: 'Mutation', creditIngestLc: { __typename?: 'CreditLc', id: string, uploadId: string, reference: string, issuingBank?: string | null, applicant?: string | null, beneficiary?: string | null, currency: string, amountMinorUnits: number, tolerancePercent: number, issueDate?: string | null, expiryDate: string, latestShipmentDate?: string | null, presentationPeriodDays?: number | null, portOfLoading?: string | null, portOfDischarge?: string | null, partialShipments: ShipmentTerm, transhipment: ShipmentTerm, goodsDescription: string, documentsRequired: Array<string>, ingestedTime: string, documents: Array<{ __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string }>, findings: Array<{ __typename?: 'CreditFinding', code: string, severity: CreditFindingSeverity, title: string, detail: string, documentId?: string | null }> } };

export type CreditAttachDocumentMutationVariables = Exact<{
  input: CreditAttachDocumentInput;
}>;


export type CreditAttachDocumentMutation = { __typename?: 'Mutation', creditAttachDocument: { __typename?: 'CreditDocument', id: string, uploadId: string, kind: CreditDocumentKind, fileName?: string | null, reference?: string | null, currency?: string | null, amountMinorUnits?: number | null, shipmentDate?: string | null, portOfLoading?: string | null, portOfDischarge?: string | null, goodsDescription?: string | null, attachedTime: string } };

export type CreditRemoveDocumentMutationVariables = Exact<{
  input: CreditRemoveDocumentInput;
}>;


export type CreditRemoveDocumentMutation = { __typename?: 'Mutation', creditRemoveDocument: boolean };

export type CreditDeleteLcMutationVariables = Exact<{
  input: CreditDeleteLcInput;
}>;


export type CreditDeleteLcMutation = { __typename?: 'Mutation', creditDeleteLc: boolean };

export type DriveEntryFieldsFragment = { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string };

export type DriveEntriesQueryVariables = Exact<{
  input: DriveEntryConnectionInput;
}>;


export type DriveEntriesQuery = { __typename?: 'Query', driveEntries: { __typename?: 'DriveEntryConnection', nodes: Array<{ __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } | null>, pageInfo: { __typename?: 'PageInfo', hasPreviousPage: boolean, hasNextPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type DriveEntryQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;


export type DriveEntryQuery = { __typename?: 'Query', driveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type DriveAlbumsQueryVariables = Exact<{ [key: string]: never; }>;


export type DriveAlbumsQuery = { __typename?: 'Query', driveAlbums: Array<{ __typename?: 'DriveAlbum', id: string, name: string, entryCount: number, createdTime: string, updatedTime: string }> };

export type CreateDriveFolderMutationVariables = Exact<{
  input: CreateDriveFolderInput;
}>;


export type CreateDriveFolderMutation = { __typename?: 'Mutation', createDriveFolder: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type RegisterDriveFileMutationVariables = Exact<{
  input: RegisterDriveFileInput;
}>;


export type RegisterDriveFileMutation = { __typename?: 'Mutation', registerDriveFile: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type RenameDriveEntryMutationVariables = Exact<{
  input: RenameDriveEntryInput;
}>;


export type RenameDriveEntryMutation = { __typename?: 'Mutation', renameDriveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type MoveDriveEntryMutationVariables = Exact<{
  input: MoveDriveEntryInput;
}>;


export type MoveDriveEntryMutation = { __typename?: 'Mutation', moveDriveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type TrashDriveEntryMutationVariables = Exact<{
  input: TrashDriveEntryInput;
}>;


export type TrashDriveEntryMutation = { __typename?: 'Mutation', trashDriveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type RestoreDriveEntryMutationVariables = Exact<{
  input: RestoreDriveEntryInput;
}>;


export type RestoreDriveEntryMutation = { __typename?: 'Mutation', restoreDriveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type DeleteDriveEntryMutationVariables = Exact<{
  input: DeleteDriveEntryInput;
}>;


export type DeleteDriveEntryMutation = { __typename?: 'Mutation', deleteDriveEntry: boolean };

export type SetDriveEntryStarredMutationVariables = Exact<{
  input: SetDriveEntryStarredInput;
}>;


export type SetDriveEntryStarredMutation = { __typename?: 'Mutation', setDriveEntryStarred: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type SetDriveEntryCaptionMutationVariables = Exact<{
  input: SetDriveEntryCaptionInput;
}>;


export type SetDriveEntryCaptionMutation = { __typename?: 'Mutation', setDriveEntryCaption: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type ReplaceDriveEntryMediaMutationVariables = Exact<{
  input: ReplaceDriveEntryMediaInput;
}>;


export type ReplaceDriveEntryMediaMutation = { __typename?: 'Mutation', replaceDriveEntryMedia: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type ShareDriveEntryMutationVariables = Exact<{
  input: ShareDriveEntryInput;
}>;


export type ShareDriveEntryMutation = { __typename?: 'Mutation', shareDriveEntry: { __typename?: 'DriveEntry', id: string, name: string, kind: DriveEntryKind, parentId?: string | null, starred: boolean, trashedTime?: string | null, capturedTime?: string | null, caption?: string | null, uploadId?: string | null, thumbUploadId?: string | null, contentType?: string | null, sizeBytes?: number | null, fileUrl?: string | null, thumbUrl?: string | null, shared: boolean, createdTime: string, updatedTime: string } };

export type CreateDriveAlbumMutationVariables = Exact<{
  input: CreateDriveAlbumInput;
}>;


export type CreateDriveAlbumMutation = { __typename?: 'Mutation', createDriveAlbum: { __typename?: 'DriveAlbum', id: string, name: string, entryCount: number } };

export type RenameDriveAlbumMutationVariables = Exact<{
  input: RenameDriveAlbumInput;
}>;


export type RenameDriveAlbumMutation = { __typename?: 'Mutation', renameDriveAlbum: { __typename?: 'DriveAlbum', id: string, name: string, entryCount: number } };

export type DeleteDriveAlbumMutationVariables = Exact<{
  input: DeleteDriveAlbumInput;
}>;


export type DeleteDriveAlbumMutation = { __typename?: 'Mutation', deleteDriveAlbum: boolean };

export type AddDriveAlbumEntryMutationVariables = Exact<{
  input: AddDriveAlbumEntryInput;
}>;


export type AddDriveAlbumEntryMutation = { __typename?: 'Mutation', addDriveAlbumEntry: { __typename?: 'DriveAlbum', id: string, name: string, entryCount: number } };

export type RemoveDriveAlbumEntryMutationVariables = Exact<{
  input: RemoveDriveAlbumEntryInput;
}>;


export type RemoveDriveAlbumEntryMutation = { __typename?: 'Mutation', removeDriveAlbumEntry: boolean };

export type ClearDriveLibraryMutationVariables = Exact<{ [key: string]: never; }>;


export type ClearDriveLibraryMutation = { __typename?: 'Mutation', clearDriveLibrary: boolean };

export type EntryFieldFieldsFragment = { __typename?: 'EntryField', id: string, label: string, fieldKey: string, fieldType: EntryFieldType, required: boolean, options?: Array<string> | null, position: number, createdTime: string };

export type EntryRecordFieldsFragment = { __typename?: 'EntryRecord', id: string, valuesJson: string, createdTime: string, updatedTime: string };

export type EntryFieldsQueryVariables = Exact<{ [key: string]: never; }>;


export type EntryFieldsQuery = { __typename?: 'Query', entryFields: Array<{ __typename?: 'EntryField', id: string, label: string, fieldKey: string, fieldType: EntryFieldType, required: boolean, options?: Array<string> | null, position: number, createdTime: string }> };

export type EntryRecordsQueryVariables = Exact<{
  input: EntryRecordConnectionInput;
}>;


export type EntryRecordsQuery = { __typename?: 'Query', entryRecords: { __typename?: 'EntryRecordConnection', nodes: Array<{ __typename?: 'EntryRecord', id: string, valuesJson: string, createdTime: string, updatedTime: string } | null>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } };

export type EntryFieldCreateFormSchemaQueryVariables = Exact<{ [key: string]: never; }>;


export type EntryFieldCreateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type EntryFieldUpdateFormSchemaQueryVariables = Exact<{
  input: SchemaFormUpdateInput;
}>;


export type EntryFieldUpdateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type EntryRecordCreateFormSchemaQueryVariables = Exact<{ [key: string]: never; }>;


export type EntryRecordCreateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type EntryRecordUpdateFormSchemaQueryVariables = Exact<{
  input: SchemaFormUpdateInput;
}>;


export type EntryRecordUpdateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type CreateEntryFieldMutationVariables = Exact<{
  input: CreateEntryFieldInput;
}>;


export type CreateEntryFieldMutation = { __typename?: 'Mutation', createEntryField: { __typename?: 'EntryField', id: string, label: string, fieldKey: string, fieldType: EntryFieldType, required: boolean, options?: Array<string> | null, position: number, createdTime: string } };

export type UpdateEntryFieldMutationVariables = Exact<{
  input: UpdateEntryFieldInput;
}>;


export type UpdateEntryFieldMutation = { __typename?: 'Mutation', updateEntryField: { __typename?: 'EntryField', id: string, label: string, fieldKey: string, fieldType: EntryFieldType, required: boolean, options?: Array<string> | null, position: number, createdTime: string } };

export type DeleteEntryFieldMutationVariables = Exact<{
  input: DeleteEntryFieldInput;
}>;


export type DeleteEntryFieldMutation = { __typename?: 'Mutation', deleteEntryField: boolean };

export type CreateEntryRecordMutationVariables = Exact<{
  input: CreateEntryRecordInput;
}>;


export type CreateEntryRecordMutation = { __typename?: 'Mutation', createEntryRecord: { __typename?: 'EntryRecord', id: string, valuesJson: string, createdTime: string, updatedTime: string } };

export type UpdateEntryRecordMutationVariables = Exact<{
  input: UpdateEntryRecordInput;
}>;


export type UpdateEntryRecordMutation = { __typename?: 'Mutation', updateEntryRecord: { __typename?: 'EntryRecord', id: string, valuesJson: string, createdTime: string, updatedTime: string } };

export type DeleteEntryRecordMutationVariables = Exact<{
  input: DeleteEntryRecordInput;
}>;


export type DeleteEntryRecordMutation = { __typename?: 'Mutation', deleteEntryRecord: boolean };

export type FlowLineFieldsFragment = { __typename?: 'FlowLine', id: string, position: number, label: string, section: FlowSection, linkedCategory?: string | null, budgetsMinorUnits: Array<number>, actualsMinorUnits: Array<number | null>, variancesMinorUnits: Array<number | null> };

export type FlowTemplateFieldsFragment = { __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string };

export type FlowTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type FlowTemplatesQuery = { __typename?: 'Query', flowTemplates: Array<{ __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string }> };

export type FlowTemplateGridQueryVariables = Exact<{
  templateId: Scalars['Id']['input'];
}>;


export type FlowTemplateGridQuery = { __typename?: 'Query', flowTemplate: { __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string, lines: Array<{ __typename?: 'FlowLine', id: string, position: number, label: string, section: FlowSection, linkedCategory?: string | null, budgetsMinorUnits: Array<number>, actualsMinorUnits: Array<number | null>, variancesMinorUnits: Array<number | null> }> } };

export type FlowLinkableCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type FlowLinkableCategoriesQuery = { __typename?: 'Query', flowLinkableCategories: { __typename?: 'FlowLinkableCategories', incomeCategories: Array<string>, expenseCategories: Array<string> } };

export type MyBooksConnectionQueryVariables = Exact<{ [key: string]: never; }>;


export type MyBooksConnectionQuery = { __typename?: 'Query', myBooksConnection?: { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string } | null };

export type ConnectMyBooksMutationVariables = Exact<{
  input: ConnectQuickBooksInput;
}>;


export type ConnectMyBooksMutation = { __typename?: 'Mutation', connectMyBooks: { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string } };

export type DisconnectMyBooksMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectMyBooksMutation = { __typename?: 'Mutation', disconnectMyBooks: boolean };

export type FlowCreateTemplateMutationVariables = Exact<{
  input: FlowCreateTemplateInput;
}>;


export type FlowCreateTemplateMutation = { __typename?: 'Mutation', flowCreateTemplate: { __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string } };

export type FlowRenameTemplateMutationVariables = Exact<{
  input: FlowRenameTemplateInput;
}>;


export type FlowRenameTemplateMutation = { __typename?: 'Mutation', flowRenameTemplate: { __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string } };

export type FlowDeleteTemplateMutationVariables = Exact<{
  input: FlowDeleteTemplateInput;
}>;


export type FlowDeleteTemplateMutation = { __typename?: 'Mutation', flowDeleteTemplate: boolean };

export type FlowAddLineMutationVariables = Exact<{
  input: FlowAddLineInput;
}>;


export type FlowAddLineMutation = { __typename?: 'Mutation', flowAddLine: { __typename?: 'FlowLine', id: string, position: number, label: string, section: FlowSection, linkedCategory?: string | null, budgetsMinorUnits: Array<number>, actualsMinorUnits: Array<number | null>, variancesMinorUnits: Array<number | null> } };

export type FlowUpdateLineMutationVariables = Exact<{
  input: FlowUpdateLineInput;
}>;


export type FlowUpdateLineMutation = { __typename?: 'Mutation', flowUpdateLine: { __typename?: 'FlowLine', id: string, position: number, label: string, section: FlowSection, linkedCategory?: string | null, budgetsMinorUnits: Array<number>, actualsMinorUnits: Array<number | null>, variancesMinorUnits: Array<number | null> } };

export type FlowRemoveLineMutationVariables = Exact<{
  input: FlowRemoveLineInput;
}>;


export type FlowRemoveLineMutation = { __typename?: 'Mutation', flowRemoveLine: boolean };

export type FlowExportTemplateXlsxMutationVariables = Exact<{
  input: FlowExportTemplateXlsxInput;
}>;


export type FlowExportTemplateXlsxMutation = { __typename?: 'Mutation', flowExportTemplateXlsx: { __typename?: 'Upload', id: string, fileName?: string | null } };

export type FlowImportTemplateXlsxMutationVariables = Exact<{
  input: FlowImportTemplateXlsxInput;
}>;


export type FlowImportTemplateXlsxMutation = { __typename?: 'Mutation', flowImportTemplateXlsx: { __typename?: 'FlowTemplate', id: string, name: string, startMonth: string, monthCount: number, months: Array<string>, currency: string, createdTime: string } };

export type SchemaFormFieldsFragment = { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string };

export type UserCreateFormSchemaQueryVariables = Exact<{ [key: string]: never; }>;


export type UserCreateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type UserUpdateFormSchemaQueryVariables = Exact<{
  input: SchemaFormUpdateInput;
}>;


export type UserUpdateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type ProjectCreateFormSchemaQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectCreateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type ProjectUpdateFormSchemaQueryVariables = Exact<{
  input: SchemaFormUpdateInput;
}>;


export type ProjectUpdateFormSchemaQuery = { __typename?: 'Query', schema: { __typename?: 'SchemaForm', jsonSchema: string, uiSchema: string, defaultData: string } };

export type PageInfoFieldsFragment = { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null };

export type UserFieldsFragment = { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, avatarUploadId?: string | null, account?: { __typename?: 'Account', id: string, name: string } | null };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, avatarUploadId?: string | null, account?: { __typename?: 'Account', id: string, name: string } | null } };

export type UsersQueryVariables = Exact<{
  input: UserConnectionInput;
}>;


export type UsersQuery = { __typename?: 'Query', users: { __typename?: 'UserConnection', nodes: Array<{ __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, avatarUploadId?: string | null, account?: { __typename?: 'Account', id: string, name: string } | null } | null>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, avatarUploadId?: string | null, account?: { __typename?: 'Account', id: string, name: string } | null } };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, avatarUploadId?: string | null, account?: { __typename?: 'Account', id: string, name: string } | null } };

export type InterpretDocumentMutationVariables = Exact<{
  input: InterpretDocumentInput;
}>;


export type InterpretDocumentMutation = { __typename?: 'Mutation', interpretDocument: { __typename?: 'DocumentInterpretation', documentType: string, title?: string | null, summary: string, keyPoints: Array<string>, pageCount: number, fields: Array<{ __typename?: 'InterpretedField', label: string, value: string }> } };

export type PaymentSubscriptionFieldsFragment = { __typename?: 'PaymentSubscription', id: string, status: SubscriptionStatus, provider: CheckoutProvider, productKey: string, productName: string, amountTotal: number, currency: string, recurringInterval: SubscriptionInterval, currentPeriodEnd?: string | null, createdTime: string };

export type MySubscriptionQueryVariables = Exact<{
  productKey?: InputMaybe<Scalars['String']['input']>;
}>;


export type MySubscriptionQuery = { __typename?: 'Query', mySubscription?: { __typename?: 'PaymentSubscription', id: string, status: SubscriptionStatus, provider: CheckoutProvider, productKey: string, productName: string, amountTotal: number, currency: string, recurringInterval: SubscriptionInterval, currentPeriodEnd?: string | null, createdTime: string } | null };

export type CreateBillingPortalSessionMutationVariables = Exact<{
  input: CreateBillingPortalSessionInput;
}>;


export type CreateBillingPortalSessionMutation = { __typename?: 'Mutation', createBillingPortalSession: { __typename?: 'BillingPortalSession', url: string } };

export type CancelTestSubscriptionMutationVariables = Exact<{ [key: string]: never; }>;


export type CancelTestSubscriptionMutation = { __typename?: 'Mutation', cancelTestSubscription: { __typename?: 'PaymentSubscription', id: string, status: SubscriptionStatus, provider: CheckoutProvider, productKey: string, productName: string, amountTotal: number, currency: string, recurringInterval: SubscriptionInterval, currentPeriodEnd?: string | null, createdTime: string } };

export type PitchSlideFieldsFragment = { __typename?: 'PitchSlide', id: string, kind: PitchSlideKind, position: number, title: string, body: string, included: boolean };

export type PitchDeckFieldsFragment = { __typename?: 'PitchDeck', id: string, name: string, companyName: string, tagline?: string | null, logoUploadId?: string | null, accentColor: string, createdTime: string };

export type PitchSeriesPointFieldsFragment = { __typename?: 'PitchSeriesPoint', month: string, minorUnits: number };

export type PitchDecksQueryVariables = Exact<{ [key: string]: never; }>;


export type PitchDecksQuery = { __typename?: 'Query', pitchDecks: Array<{ __typename?: 'PitchDeck', id: string, name: string, companyName: string, tagline?: string | null, logoUploadId?: string | null, accentColor: string, createdTime: string }> };

export type PitchDeckOutlineQueryVariables = Exact<{
  deckId: Scalars['Id']['input'];
}>;


export type PitchDeckOutlineQuery = { __typename?: 'Query', pitchDeck: { __typename?: 'PitchDeck', id: string, name: string, companyName: string, tagline?: string | null, logoUploadId?: string | null, accentColor: string, createdTime: string, slides: Array<{ __typename?: 'PitchSlide', id: string, kind: PitchSlideKind, position: number, title: string, body: string, included: boolean }> } };

export type PitchDeckDataQueryVariables = Exact<{ [key: string]: never; }>;


export type PitchDeckDataQuery = { __typename?: 'Query', pitchDeckData?: { __typename?: 'PitchDeckData', companyName: string, currency: string, revenueGrowthPercent: number, netMarginPercent: number, averageNetIncomeMinorUnits: number, latestCashMinorUnits: number, runwayMonths?: number | null, trailingTwelveMonthRevenueMinorUnits: number, customerCount: number, paidInvoiceCount: number, revenueSeries: Array<{ __typename?: 'PitchSeriesPoint', month: string, minorUnits: number }>, expenseSeries: Array<{ __typename?: 'PitchSeriesPoint', month: string, minorUnits: number }>, netIncomeSeries: Array<{ __typename?: 'PitchSeriesPoint', month: string, minorUnits: number }>, cashSeries: Array<{ __typename?: 'PitchSeriesPoint', month: string, minorUnits: number }> } | null };

export type PitchCreateDeckMutationVariables = Exact<{
  input: PitchCreateDeckInput;
}>;


export type PitchCreateDeckMutation = { __typename?: 'Mutation', pitchCreateDeck: { __typename?: 'PitchDeck', id: string, name: string, companyName: string, tagline?: string | null, logoUploadId?: string | null, accentColor: string, createdTime: string } };

export type PitchUpdateDeckMutationVariables = Exact<{
  input: PitchUpdateDeckInput;
}>;


export type PitchUpdateDeckMutation = { __typename?: 'Mutation', pitchUpdateDeck: { __typename?: 'PitchDeck', id: string, name: string, companyName: string, tagline?: string | null, logoUploadId?: string | null, accentColor: string, createdTime: string } };

export type PitchDeleteDeckMutationVariables = Exact<{
  input: PitchDeleteDeckInput;
}>;


export type PitchDeleteDeckMutation = { __typename?: 'Mutation', pitchDeleteDeck: boolean };

export type PitchUpdateSlideMutationVariables = Exact<{
  input: PitchUpdateSlideInput;
}>;


export type PitchUpdateSlideMutation = { __typename?: 'Mutation', pitchUpdateSlide: { __typename?: 'PitchSlide', id: string, kind: PitchSlideKind, position: number, title: string, body: string, included: boolean } };

export type PitchExportDeckPdfMutationVariables = Exact<{
  input: PitchExportDeckPdfInput;
}>;


export type PitchExportDeckPdfMutation = { __typename?: 'Mutation', pitchExportDeckPdf: { __typename?: 'Upload', id: string, fileName?: string | null } };

export type ProjectFieldsFragment = { __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, createdTime: string, archivedAt?: string | null, createdBy: { __typename?: 'User', id: string, displayName: string } };

export type ProjectsQueryVariables = Exact<{
  input: ProjectConnectionInput;
}>;


export type ProjectsQuery = { __typename?: 'Query', projects: { __typename?: 'ProjectConnection', nodes: Array<{ __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, createdTime: string, archivedAt?: string | null, createdBy: { __typename?: 'User', id: string, displayName: string } } | null>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, createdTime: string, archivedAt?: string | null, createdBy: { __typename?: 'User', id: string, displayName: string } } };

export type UpdateProjectMutationVariables = Exact<{
  input: UpdateProjectInput;
}>;


export type UpdateProjectMutation = { __typename?: 'Mutation', updateProject: { __typename?: 'Project', id: string, name: string, description?: string | null, status: ProjectStatus, createdTime: string, archivedAt?: string | null, createdBy: { __typename?: 'User', id: string, displayName: string } } };

export type ProjectMembershipFieldsFragment = { __typename?: 'ProjectMembership', id: string, role: ProjectMembershipRole, createdTime: string, user: { __typename?: 'User', id: string, displayName: string, email: string } };

export type ProjectMembersQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;


export type ProjectMembersQuery = { __typename?: 'Query', project: { __typename?: 'Project', id: string, name: string, memberships: Array<{ __typename?: 'ProjectMembership', id: string, role: ProjectMembershipRole, createdTime: string, user: { __typename?: 'User', id: string, displayName: string, email: string } }> } };

export type AddProjectMemberMutationVariables = Exact<{
  input: AddProjectMemberInput;
}>;


export type AddProjectMemberMutation = { __typename?: 'Mutation', addProjectMember: { __typename?: 'ProjectMembership', id: string, role: ProjectMembershipRole, createdTime: string, user: { __typename?: 'User', id: string, displayName: string, email: string } } };

export type UpdateProjectMemberMutationVariables = Exact<{
  input: UpdateProjectMemberInput;
}>;


export type UpdateProjectMemberMutation = { __typename?: 'Mutation', updateProjectMember: { __typename?: 'ProjectMembership', id: string, role: ProjectMembershipRole, createdTime: string, user: { __typename?: 'User', id: string, displayName: string, email: string } } };

export type RemoveProjectMemberMutationVariables = Exact<{
  input: RemoveProjectMemberInput;
}>;


export type RemoveProjectMemberMutation = { __typename?: 'Mutation', removeProjectMember: boolean };

export type RegisterPushDeviceMutationVariables = Exact<{
  input: RegisterPushDeviceInput;
}>;


export type RegisterPushDeviceMutation = { __typename?: 'Mutation', registerPushDevice: { __typename?: 'PushDevice', id: string, platform: PushDevicePlatform, endpoint: string, createdTime: string, rotatedTime: string } };

export type UnregisterPushDeviceMutationVariables = Exact<{
  input: UnregisterPushDeviceInput;
}>;


export type UnregisterPushDeviceMutation = { __typename?: 'Mutation', unregisterPushDevice: boolean };

export type QuickBooksConnectionFieldsFragment = { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string };

export type QuickBooksStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type QuickBooksStatusQuery = { __typename?: 'Query', quickBooksStatus: { __typename?: 'QuickBooksStatus', connected: boolean, mode: QuickBooksMode, connection?: { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string } | null } };

export type QuickBooksCompanySnapshotQueryVariables = Exact<{ [key: string]: never; }>;


export type QuickBooksCompanySnapshotQuery = { __typename?: 'Query', quickBooksCompanySnapshot: { __typename?: 'QuickBooksCompanySnapshot', companyName: string, currency: string, revenueMinorUnits: number, outstandingMinorUnits: number, overdueMinorUnits: number, paidInvoiceCount: number, openInvoiceCount: number, overdueInvoiceCount: number, customerCount: number } };

export type QuickBooksCustomersQueryVariables = Exact<{ [key: string]: never; }>;


export type QuickBooksCustomersQuery = { __typename?: 'Query', quickBooksCustomers: Array<{ __typename?: 'QuickBooksCustomer', id: string, displayName: string, companyName?: string | null, email: string, city: string, state: string, customerSince: string, openBalanceMinorUnits: number }> };

export type QuickBooksInvoicesQueryVariables = Exact<{
  input?: InputMaybe<QuickBooksInvoicesInput>;
}>;


export type QuickBooksInvoicesQuery = { __typename?: 'Query', quickBooksInvoices: Array<{ __typename?: 'QuickBooksInvoice', id: string, docNumber: string, customerId: string, customerName: string, status: QuickBooksInvoiceStatus, issueDate: string, dueDate: string, totalMinorUnits: number, balanceMinorUnits: number }> };

export type ConnectQuickBooksMutationVariables = Exact<{
  input: ConnectQuickBooksInput;
}>;


export type ConnectQuickBooksMutation = { __typename?: 'Mutation', connectQuickBooks: { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string } };

export type DisconnectQuickBooksMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectQuickBooksMutation = { __typename?: 'Mutation', disconnectQuickBooks: boolean };

export type BeginQuickBooksAuthorizationMutationVariables = Exact<{
  input: BeginQuickBooksAuthorizationInput;
}>;


export type BeginQuickBooksAuthorizationMutation = { __typename?: 'Mutation', beginQuickBooksAuthorization: { __typename?: 'QuickBooksAuthorization', authorizationUrl: string } };

export type CompleteQuickBooksAuthorizationMutationVariables = Exact<{
  input: CompleteQuickBooksAuthorizationInput;
}>;


export type CompleteQuickBooksAuthorizationMutation = { __typename?: 'Mutation', completeQuickBooksAuthorization: { __typename?: 'QuickBooksConnection', id: string, realmId: string, companyName: string, mode: QuickBooksMode, provider: AccountingProvider, connectedTime: string } };

export type CreateSubscriptionCheckoutSessionMutationVariables = Exact<{
  input: CreateSubscriptionCheckoutSessionInput;
}>;


export type CreateSubscriptionCheckoutSessionMutation = { __typename?: 'Mutation', createSubscriptionCheckoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productKey: string, productName: string, amountTotal: number, currency: string, deliveryAvailable: boolean, createdTime: string } };

export type CheckoutSessionFieldsFragment = { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productKey: string, productName: string, amountTotal: number, currency: string, deliveryAvailable: boolean, createdTime: string };

export type ShopProductQueryVariables = Exact<{ [key: string]: never; }>;


export type ShopProductQuery = { __typename?: 'Query', shopProduct: { __typename?: 'ShopProduct', key: string, name: string, tagline: string, priceMinorUnits: number, currency: string } };

export type ShopProductsQueryVariables = Exact<{ [key: string]: never; }>;


export type ShopProductsQuery = { __typename?: 'Query', shopProducts: Array<{ __typename?: 'ShopProduct', key: string, name: string, tagline: string, priceMinorUnits: number, currency: string }> };

export type CheckoutSessionQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;


export type CheckoutSessionQuery = { __typename?: 'Query', checkoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productKey: string, productName: string, amountTotal: number, currency: string, deliveryAvailable: boolean, createdTime: string } };

export type CreateCheckoutSessionMutationVariables = Exact<{
  input: CreateCheckoutSessionInput;
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', createCheckoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productKey: string, productName: string, amountTotal: number, currency: string, deliveryAvailable: boolean, createdTime: string } };

export type CompleteTestCheckoutSessionMutationVariables = Exact<{
  input: CompleteTestCheckoutSessionInput;
}>;


export type CompleteTestCheckoutSessionMutation = { __typename?: 'Mutation', completeTestCheckoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productKey: string, productName: string, amountTotal: number, currency: string, deliveryAvailable: boolean, createdTime: string } };

export type SongFieldsFragment = { __typename?: 'Song', id: string, chartRank: number, title: string, artist: string, year: number, genre: string, streamsBillions?: number | null, notes?: string | null, createdTime: string, updatedTime: string };

export type SongsQueryVariables = Exact<{
  input: SongConnectionInput;
}>;


export type SongsQuery = { __typename?: 'Query', songs: { __typename?: 'SongConnection', nodes: Array<{ __typename?: 'Song', id: string, chartRank: number, title: string, artist: string, year: number, genre: string, streamsBillions?: number | null, notes?: string | null, createdTime: string, updatedTime: string } | null>, pageInfo: { __typename?: 'PageInfo', hasPreviousPage: boolean, hasNextPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type CreateSongMutationVariables = Exact<{
  input: CreateSongInput;
}>;


export type CreateSongMutation = { __typename?: 'Mutation', createSong: { __typename?: 'Song', id: string, chartRank: number, title: string, artist: string, year: number, genre: string, streamsBillions?: number | null, notes?: string | null, createdTime: string, updatedTime: string } };

export type UpdateSongMutationVariables = Exact<{
  input: UpdateSongInput;
}>;


export type UpdateSongMutation = { __typename?: 'Mutation', updateSong: { __typename?: 'Song', id: string, chartRank: number, title: string, artist: string, year: number, genre: string, streamsBillions?: number | null, notes?: string | null, createdTime: string, updatedTime: string } };

export type DeleteSongMutationVariables = Exact<{
  input: DeleteSongInput;
}>;


export type DeleteSongMutation = { __typename?: 'Mutation', deleteSong: boolean };

export type CreateUploadMutationVariables = Exact<{
  input: CreateUploadInput;
}>;


export type CreateUploadMutation = { __typename?: 'Mutation', createUpload: { __typename?: 'UploadSlot', uploadId: string, uploadUrl: string, headersJson: string, upload: { __typename?: 'Upload', id: string, contentType: string, sizeBytes: number, visibility: UploadVisibility, status: UploadStatus } } };

export type FinalizeUploadMutationVariables = Exact<{
  input: FinalizeUploadInput;
}>;


export type FinalizeUploadMutation = { __typename?: 'Mutation', finalizeUpload: { __typename?: 'Upload', id: string, status: UploadStatus, sizeBytes: number } };

export type DeleteUploadMutationVariables = Exact<{
  input: DeleteUploadInput;
}>;


export type DeleteUploadMutation = { __typename?: 'Mutation', deleteUpload: boolean };

export type FileUrlQueryVariables = Exact<{
  uploadId: Scalars['Id']['input'];
}>;


export type FileUrlQuery = { __typename?: 'Query', fileUrl: { __typename?: 'FileUrl', url: string } };

export const CfoMembershipFieldsFragmentDoc = gql`
    fragment CfoMembershipFields on CfoMembership {
  id
  role
  joinedTime
  user {
    id
    email
    displayName
  }
}
    `;
export const CfoInviteFieldsFragmentDoc = gql`
    fragment CfoInviteFields on CfoInvite {
  id
  email
  role
  status
  invitedTime
}
    `;
export const CreditDocumentFieldsFragmentDoc = gql`
    fragment CreditDocumentFields on CreditDocument {
  id
  uploadId
  kind
  fileName
  reference
  currency
  amountMinorUnits
  shipmentDate
  portOfLoading
  portOfDischarge
  goodsDescription
  attachedTime
}
    `;
export const CreditFindingFieldsFragmentDoc = gql`
    fragment CreditFindingFields on CreditFinding {
  code
  severity
  title
  detail
  documentId
}
    `;
export const CreditLcFieldsFragmentDoc = gql`
    fragment CreditLcFields on CreditLc {
  id
  uploadId
  reference
  issuingBank
  applicant
  beneficiary
  currency
  amountMinorUnits
  tolerancePercent
  issueDate
  expiryDate
  latestShipmentDate
  presentationPeriodDays
  portOfLoading
  portOfDischarge
  partialShipments
  transhipment
  goodsDescription
  documentsRequired
  ingestedTime
  documents {
    ...CreditDocumentFields
  }
  findings {
    ...CreditFindingFields
  }
}
    ${CreditDocumentFieldsFragmentDoc}
${CreditFindingFieldsFragmentDoc}`;
export const DriveEntryFieldsFragmentDoc = gql`
    fragment DriveEntryFields on DriveEntry {
  id
  name
  kind
  parentId
  starred
  trashedTime
  capturedTime
  caption
  uploadId
  thumbUploadId
  contentType
  sizeBytes
  fileUrl
  thumbUrl
  shared
  createdTime
  updatedTime
}
    `;
export const EntryFieldFieldsFragmentDoc = gql`
    fragment EntryFieldFields on EntryField {
  id
  label
  fieldKey
  fieldType
  required
  options
  position
  createdTime
}
    `;
export const EntryRecordFieldsFragmentDoc = gql`
    fragment EntryRecordFields on EntryRecord {
  id
  valuesJson
  createdTime
  updatedTime
}
    `;
export const FlowLineFieldsFragmentDoc = gql`
    fragment FlowLineFields on FlowLine {
  id
  position
  label
  section
  linkedCategory
  budgetsMinorUnits
  actualsMinorUnits
  variancesMinorUnits
}
    `;
export const FlowTemplateFieldsFragmentDoc = gql`
    fragment FlowTemplateFields on FlowTemplate {
  id
  name
  startMonth
  monthCount
  months
  currency
  createdTime
}
    `;
export const SchemaFormFieldsFragmentDoc = gql`
    fragment SchemaFormFields on SchemaForm {
  jsonSchema
  uiSchema
  defaultData
}
    `;
export const PageInfoFieldsFragmentDoc = gql`
    fragment PageInfoFields on PageInfo {
  hasNextPage
  endCursor
}
    `;
export const UserFieldsFragmentDoc = gql`
    fragment UserFields on User {
  id
  email
  displayName
  status
  createdTime
  avatarUploadId
  account {
    id
    name
  }
}
    `;
export const PaymentSubscriptionFieldsFragmentDoc = gql`
    fragment PaymentSubscriptionFields on PaymentSubscription {
  id
  status
  provider
  productKey
  productName
  amountTotal
  currency
  recurringInterval
  currentPeriodEnd
  createdTime
}
    `;
export const PitchSlideFieldsFragmentDoc = gql`
    fragment PitchSlideFields on PitchSlide {
  id
  kind
  position
  title
  body
  included
}
    `;
export const PitchDeckFieldsFragmentDoc = gql`
    fragment PitchDeckFields on PitchDeck {
  id
  name
  companyName
  tagline
  logoUploadId
  accentColor
  createdTime
}
    `;
export const PitchSeriesPointFieldsFragmentDoc = gql`
    fragment PitchSeriesPointFields on PitchSeriesPoint {
  month
  minorUnits
}
    `;
export const ProjectFieldsFragmentDoc = gql`
    fragment ProjectFields on Project {
  id
  name
  description
  status
  createdTime
  archivedAt
  createdBy {
    id
    displayName
  }
}
    `;
export const ProjectMembershipFieldsFragmentDoc = gql`
    fragment ProjectMembershipFields on ProjectMembership {
  id
  role
  createdTime
  user {
    id
    displayName
    email
  }
}
    `;
export const QuickBooksConnectionFieldsFragmentDoc = gql`
    fragment QuickBooksConnectionFields on QuickBooksConnection {
  id
  realmId
  companyName
  mode
  provider
  connectedTime
}
    `;
export const CheckoutSessionFieldsFragmentDoc = gql`
    fragment CheckoutSessionFields on CheckoutSession {
  id
  provider
  status
  checkoutUrl
  productKey
  productName
  amountTotal
  currency
  deliveryAvailable
  createdTime
}
    `;
export const SongFieldsFragmentDoc = gql`
    fragment SongFields on Song {
  id
  chartRank
  title
  artist
  year
  genre
  streamsBillions
  notes
  createdTime
  updatedTime
}
    `;
export const CfoMyMembershipDocument = gql`
    query CfoMyMembership {
  cfoMyMembership {
    ...CfoMembershipFields
  }
}
    ${CfoMembershipFieldsFragmentDoc}`;

/**
 * __useCfoMyMembershipQuery__
 *
 * To run a query within a React component, call `useCfoMyMembershipQuery` and pass it any options that fit your needs.
 * When your component renders, `useCfoMyMembershipQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCfoMyMembershipQuery({
 *   variables: {
 *   },
 * });
 */
export function useCfoMyMembershipQuery(baseOptions?: Apollo.QueryHookOptions<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>(CfoMyMembershipDocument, options);
      }
export function useCfoMyMembershipLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>(CfoMyMembershipDocument, options);
        }
// @ts-ignore
export function useCfoMyMembershipSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>): Apollo.UseSuspenseQueryResult<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>;
export function useCfoMyMembershipSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>): Apollo.UseSuspenseQueryResult<CfoMyMembershipQuery | undefined, CfoMyMembershipQueryVariables>;
export function useCfoMyMembershipSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>(CfoMyMembershipDocument, options);
        }
export type CfoMyMembershipQueryHookResult = ReturnType<typeof useCfoMyMembershipQuery>;
export type CfoMyMembershipLazyQueryHookResult = ReturnType<typeof useCfoMyMembershipLazyQuery>;
export type CfoMyMembershipSuspenseQueryHookResult = ReturnType<typeof useCfoMyMembershipSuspenseQuery>;
export type CfoMyMembershipQueryResult = Apollo.QueryResult<CfoMyMembershipQuery, CfoMyMembershipQueryVariables>;
export const CfoClientsDocument = gql`
    query CfoClients {
  cfoClients {
    membership {
      ...CfoMembershipFields
    }
    connection {
      id
      companyName
      provider
      connectedTime
    }
    snapshot {
      companyName
      currency
      revenueMinorUnits
      outstandingMinorUnits
      overdueMinorUnits
      paidInvoiceCount
      openInvoiceCount
      overdueInvoiceCount
      customerCount
    }
    profitAndLoss {
      month
      totalIncomeMinorUnits
      totalExpensesMinorUnits
      netIncomeMinorUnits
    }
  }
}
    ${CfoMembershipFieldsFragmentDoc}`;

/**
 * __useCfoClientsQuery__
 *
 * To run a query within a React component, call `useCfoClientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCfoClientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCfoClientsQuery({
 *   variables: {
 *   },
 * });
 */
export function useCfoClientsQuery(baseOptions?: Apollo.QueryHookOptions<CfoClientsQuery, CfoClientsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CfoClientsQuery, CfoClientsQueryVariables>(CfoClientsDocument, options);
      }
export function useCfoClientsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CfoClientsQuery, CfoClientsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CfoClientsQuery, CfoClientsQueryVariables>(CfoClientsDocument, options);
        }
// @ts-ignore
export function useCfoClientsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CfoClientsQuery, CfoClientsQueryVariables>): Apollo.UseSuspenseQueryResult<CfoClientsQuery, CfoClientsQueryVariables>;
export function useCfoClientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoClientsQuery, CfoClientsQueryVariables>): Apollo.UseSuspenseQueryResult<CfoClientsQuery | undefined, CfoClientsQueryVariables>;
export function useCfoClientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoClientsQuery, CfoClientsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CfoClientsQuery, CfoClientsQueryVariables>(CfoClientsDocument, options);
        }
export type CfoClientsQueryHookResult = ReturnType<typeof useCfoClientsQuery>;
export type CfoClientsLazyQueryHookResult = ReturnType<typeof useCfoClientsLazyQuery>;
export type CfoClientsSuspenseQueryHookResult = ReturnType<typeof useCfoClientsSuspenseQuery>;
export type CfoClientsQueryResult = Apollo.QueryResult<CfoClientsQuery, CfoClientsQueryVariables>;
export const CfoClientStatementsDocument = gql`
    query CfoClientStatements($clientUserId: Id!) {
  cfoClient(clientUserId: $clientUserId) {
    membership {
      ...CfoMembershipFields
    }
    connection {
      id
      companyName
      provider
      connectedTime
    }
    snapshot {
      companyName
      currency
      revenueMinorUnits
      outstandingMinorUnits
      overdueMinorUnits
      paidInvoiceCount
      openInvoiceCount
      overdueInvoiceCount
      customerCount
    }
    profitAndLoss {
      month
      incomeLines {
        category
        minorUnits
      }
      totalIncomeMinorUnits
      expenseLines {
        category
        minorUnits
      }
      totalExpensesMinorUnits
      netIncomeMinorUnits
    }
    balanceSheet {
      month
      assetLines {
        category
        minorUnits
      }
      totalAssetsMinorUnits
      liabilityLines {
        category
        minorUnits
      }
      totalLiabilitiesMinorUnits
      equityLines {
        category
        minorUnits
      }
      totalEquityMinorUnits
    }
  }
}
    ${CfoMembershipFieldsFragmentDoc}`;

/**
 * __useCfoClientStatementsQuery__
 *
 * To run a query within a React component, call `useCfoClientStatementsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCfoClientStatementsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCfoClientStatementsQuery({
 *   variables: {
 *      clientUserId: // value for 'clientUserId'
 *   },
 * });
 */
export function useCfoClientStatementsQuery(baseOptions: Apollo.QueryHookOptions<CfoClientStatementsQuery, CfoClientStatementsQueryVariables> & ({ variables: CfoClientStatementsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>(CfoClientStatementsDocument, options);
      }
export function useCfoClientStatementsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>(CfoClientStatementsDocument, options);
        }
// @ts-ignore
export function useCfoClientStatementsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>): Apollo.UseSuspenseQueryResult<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>;
export function useCfoClientStatementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>): Apollo.UseSuspenseQueryResult<CfoClientStatementsQuery | undefined, CfoClientStatementsQueryVariables>;
export function useCfoClientStatementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>(CfoClientStatementsDocument, options);
        }
export type CfoClientStatementsQueryHookResult = ReturnType<typeof useCfoClientStatementsQuery>;
export type CfoClientStatementsLazyQueryHookResult = ReturnType<typeof useCfoClientStatementsLazyQuery>;
export type CfoClientStatementsSuspenseQueryHookResult = ReturnType<typeof useCfoClientStatementsSuspenseQuery>;
export type CfoClientStatementsQueryResult = Apollo.QueryResult<CfoClientStatementsQuery, CfoClientStatementsQueryVariables>;
export const CfoInvitesDocument = gql`
    query CfoInvites {
  cfoInvites {
    ...CfoInviteFields
  }
}
    ${CfoInviteFieldsFragmentDoc}`;

/**
 * __useCfoInvitesQuery__
 *
 * To run a query within a React component, call `useCfoInvitesQuery` and pass it any options that fit your needs.
 * When your component renders, `useCfoInvitesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCfoInvitesQuery({
 *   variables: {
 *   },
 * });
 */
export function useCfoInvitesQuery(baseOptions?: Apollo.QueryHookOptions<CfoInvitesQuery, CfoInvitesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CfoInvitesQuery, CfoInvitesQueryVariables>(CfoInvitesDocument, options);
      }
export function useCfoInvitesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CfoInvitesQuery, CfoInvitesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CfoInvitesQuery, CfoInvitesQueryVariables>(CfoInvitesDocument, options);
        }
// @ts-ignore
export function useCfoInvitesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CfoInvitesQuery, CfoInvitesQueryVariables>): Apollo.UseSuspenseQueryResult<CfoInvitesQuery, CfoInvitesQueryVariables>;
export function useCfoInvitesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoInvitesQuery, CfoInvitesQueryVariables>): Apollo.UseSuspenseQueryResult<CfoInvitesQuery | undefined, CfoInvitesQueryVariables>;
export function useCfoInvitesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CfoInvitesQuery, CfoInvitesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CfoInvitesQuery, CfoInvitesQueryVariables>(CfoInvitesDocument, options);
        }
export type CfoInvitesQueryHookResult = ReturnType<typeof useCfoInvitesQuery>;
export type CfoInvitesLazyQueryHookResult = ReturnType<typeof useCfoInvitesLazyQuery>;
export type CfoInvitesSuspenseQueryHookResult = ReturnType<typeof useCfoInvitesSuspenseQuery>;
export type CfoInvitesQueryResult = Apollo.QueryResult<CfoInvitesQuery, CfoInvitesQueryVariables>;
export const CfoInviteClientDocument = gql`
    mutation CfoInviteClient($input: CfoInviteClientInput!) {
  cfoInviteClient(input: $input) {
    ...CfoInviteFields
  }
}
    ${CfoInviteFieldsFragmentDoc}`;
export type CfoInviteClientMutationFn = Apollo.MutationFunction<CfoInviteClientMutation, CfoInviteClientMutationVariables>;

/**
 * __useCfoInviteClientMutation__
 *
 * To run a mutation, you first call `useCfoInviteClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCfoInviteClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cfoInviteClientMutation, { data, loading, error }] = useCfoInviteClientMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCfoInviteClientMutation(baseOptions?: Apollo.MutationHookOptions<CfoInviteClientMutation, CfoInviteClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CfoInviteClientMutation, CfoInviteClientMutationVariables>(CfoInviteClientDocument, options);
      }
export type CfoInviteClientMutationHookResult = ReturnType<typeof useCfoInviteClientMutation>;
export type CfoInviteClientMutationResult = Apollo.MutationResult<CfoInviteClientMutation>;
export type CfoInviteClientMutationOptions = Apollo.BaseMutationOptions<CfoInviteClientMutation, CfoInviteClientMutationVariables>;
export const CfoRevokeInviteDocument = gql`
    mutation CfoRevokeInvite($input: CfoRevokeInviteInput!) {
  cfoRevokeInvite(input: $input) {
    ...CfoInviteFields
  }
}
    ${CfoInviteFieldsFragmentDoc}`;
export type CfoRevokeInviteMutationFn = Apollo.MutationFunction<CfoRevokeInviteMutation, CfoRevokeInviteMutationVariables>;

/**
 * __useCfoRevokeInviteMutation__
 *
 * To run a mutation, you first call `useCfoRevokeInviteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCfoRevokeInviteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cfoRevokeInviteMutation, { data, loading, error }] = useCfoRevokeInviteMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCfoRevokeInviteMutation(baseOptions?: Apollo.MutationHookOptions<CfoRevokeInviteMutation, CfoRevokeInviteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CfoRevokeInviteMutation, CfoRevokeInviteMutationVariables>(CfoRevokeInviteDocument, options);
      }
export type CfoRevokeInviteMutationHookResult = ReturnType<typeof useCfoRevokeInviteMutation>;
export type CfoRevokeInviteMutationResult = Apollo.MutationResult<CfoRevokeInviteMutation>;
export type CfoRevokeInviteMutationOptions = Apollo.BaseMutationOptions<CfoRevokeInviteMutation, CfoRevokeInviteMutationVariables>;
export const CfoConnectMyBooksDocument = gql`
    mutation CfoConnectMyBooks($input: CfoConnectMyBooksInput!) {
  cfoConnectMyBooks(input: $input) {
    id
    companyName
    provider
    connectedTime
  }
}
    `;
export type CfoConnectMyBooksMutationFn = Apollo.MutationFunction<CfoConnectMyBooksMutation, CfoConnectMyBooksMutationVariables>;

/**
 * __useCfoConnectMyBooksMutation__
 *
 * To run a mutation, you first call `useCfoConnectMyBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCfoConnectMyBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cfoConnectMyBooksMutation, { data, loading, error }] = useCfoConnectMyBooksMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCfoConnectMyBooksMutation(baseOptions?: Apollo.MutationHookOptions<CfoConnectMyBooksMutation, CfoConnectMyBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CfoConnectMyBooksMutation, CfoConnectMyBooksMutationVariables>(CfoConnectMyBooksDocument, options);
      }
export type CfoConnectMyBooksMutationHookResult = ReturnType<typeof useCfoConnectMyBooksMutation>;
export type CfoConnectMyBooksMutationResult = Apollo.MutationResult<CfoConnectMyBooksMutation>;
export type CfoConnectMyBooksMutationOptions = Apollo.BaseMutationOptions<CfoConnectMyBooksMutation, CfoConnectMyBooksMutationVariables>;
export const CfoDisconnectMyBooksDocument = gql`
    mutation CfoDisconnectMyBooks {
  cfoDisconnectMyBooks
}
    `;
export type CfoDisconnectMyBooksMutationFn = Apollo.MutationFunction<CfoDisconnectMyBooksMutation, CfoDisconnectMyBooksMutationVariables>;

/**
 * __useCfoDisconnectMyBooksMutation__
 *
 * To run a mutation, you first call `useCfoDisconnectMyBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCfoDisconnectMyBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cfoDisconnectMyBooksMutation, { data, loading, error }] = useCfoDisconnectMyBooksMutation({
 *   variables: {
 *   },
 * });
 */
export function useCfoDisconnectMyBooksMutation(baseOptions?: Apollo.MutationHookOptions<CfoDisconnectMyBooksMutation, CfoDisconnectMyBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CfoDisconnectMyBooksMutation, CfoDisconnectMyBooksMutationVariables>(CfoDisconnectMyBooksDocument, options);
      }
export type CfoDisconnectMyBooksMutationHookResult = ReturnType<typeof useCfoDisconnectMyBooksMutation>;
export type CfoDisconnectMyBooksMutationResult = Apollo.MutationResult<CfoDisconnectMyBooksMutation>;
export type CfoDisconnectMyBooksMutationOptions = Apollo.BaseMutationOptions<CfoDisconnectMyBooksMutation, CfoDisconnectMyBooksMutationVariables>;
export const CfoExportClientStatementsXlsxDocument = gql`
    mutation CfoExportClientStatementsXlsx($input: CfoExportClientStatementsXlsxInput!) {
  cfoExportClientStatementsXlsx(input: $input) {
    id
    fileName
  }
}
    `;
export type CfoExportClientStatementsXlsxMutationFn = Apollo.MutationFunction<CfoExportClientStatementsXlsxMutation, CfoExportClientStatementsXlsxMutationVariables>;

/**
 * __useCfoExportClientStatementsXlsxMutation__
 *
 * To run a mutation, you first call `useCfoExportClientStatementsXlsxMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCfoExportClientStatementsXlsxMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cfoExportClientStatementsXlsxMutation, { data, loading, error }] = useCfoExportClientStatementsXlsxMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCfoExportClientStatementsXlsxMutation(baseOptions?: Apollo.MutationHookOptions<CfoExportClientStatementsXlsxMutation, CfoExportClientStatementsXlsxMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CfoExportClientStatementsXlsxMutation, CfoExportClientStatementsXlsxMutationVariables>(CfoExportClientStatementsXlsxDocument, options);
      }
export type CfoExportClientStatementsXlsxMutationHookResult = ReturnType<typeof useCfoExportClientStatementsXlsxMutation>;
export type CfoExportClientStatementsXlsxMutationResult = Apollo.MutationResult<CfoExportClientStatementsXlsxMutation>;
export type CfoExportClientStatementsXlsxMutationOptions = Apollo.BaseMutationOptions<CfoExportClientStatementsXlsxMutation, CfoExportClientStatementsXlsxMutationVariables>;
export const CreditLcsDocument = gql`
    query CreditLcs {
  creditLcs {
    ...CreditLcFields
  }
}
    ${CreditLcFieldsFragmentDoc}`;

/**
 * __useCreditLcsQuery__
 *
 * To run a query within a React component, call `useCreditLcsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCreditLcsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCreditLcsQuery({
 *   variables: {
 *   },
 * });
 */
export function useCreditLcsQuery(baseOptions?: Apollo.QueryHookOptions<CreditLcsQuery, CreditLcsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CreditLcsQuery, CreditLcsQueryVariables>(CreditLcsDocument, options);
      }
export function useCreditLcsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CreditLcsQuery, CreditLcsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CreditLcsQuery, CreditLcsQueryVariables>(CreditLcsDocument, options);
        }
// @ts-ignore
export function useCreditLcsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CreditLcsQuery, CreditLcsQueryVariables>): Apollo.UseSuspenseQueryResult<CreditLcsQuery, CreditLcsQueryVariables>;
export function useCreditLcsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CreditLcsQuery, CreditLcsQueryVariables>): Apollo.UseSuspenseQueryResult<CreditLcsQuery | undefined, CreditLcsQueryVariables>;
export function useCreditLcsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CreditLcsQuery, CreditLcsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CreditLcsQuery, CreditLcsQueryVariables>(CreditLcsDocument, options);
        }
export type CreditLcsQueryHookResult = ReturnType<typeof useCreditLcsQuery>;
export type CreditLcsLazyQueryHookResult = ReturnType<typeof useCreditLcsLazyQuery>;
export type CreditLcsSuspenseQueryHookResult = ReturnType<typeof useCreditLcsSuspenseQuery>;
export type CreditLcsQueryResult = Apollo.QueryResult<CreditLcsQuery, CreditLcsQueryVariables>;
export const CreditLcDocument = gql`
    query CreditLc($lcId: Id!) {
  creditLc(lcId: $lcId) {
    ...CreditLcFields
  }
}
    ${CreditLcFieldsFragmentDoc}`;

/**
 * __useCreditLcQuery__
 *
 * To run a query within a React component, call `useCreditLcQuery` and pass it any options that fit your needs.
 * When your component renders, `useCreditLcQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCreditLcQuery({
 *   variables: {
 *      lcId: // value for 'lcId'
 *   },
 * });
 */
export function useCreditLcQuery(baseOptions: Apollo.QueryHookOptions<CreditLcQuery, CreditLcQueryVariables> & ({ variables: CreditLcQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CreditLcQuery, CreditLcQueryVariables>(CreditLcDocument, options);
      }
export function useCreditLcLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CreditLcQuery, CreditLcQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CreditLcQuery, CreditLcQueryVariables>(CreditLcDocument, options);
        }
// @ts-ignore
export function useCreditLcSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CreditLcQuery, CreditLcQueryVariables>): Apollo.UseSuspenseQueryResult<CreditLcQuery, CreditLcQueryVariables>;
export function useCreditLcSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CreditLcQuery, CreditLcQueryVariables>): Apollo.UseSuspenseQueryResult<CreditLcQuery | undefined, CreditLcQueryVariables>;
export function useCreditLcSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CreditLcQuery, CreditLcQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CreditLcQuery, CreditLcQueryVariables>(CreditLcDocument, options);
        }
export type CreditLcQueryHookResult = ReturnType<typeof useCreditLcQuery>;
export type CreditLcLazyQueryHookResult = ReturnType<typeof useCreditLcLazyQuery>;
export type CreditLcSuspenseQueryHookResult = ReturnType<typeof useCreditLcSuspenseQuery>;
export type CreditLcQueryResult = Apollo.QueryResult<CreditLcQuery, CreditLcQueryVariables>;
export const CreditIngestLcDocument = gql`
    mutation CreditIngestLc($input: CreditIngestLcInput!) {
  creditIngestLc(input: $input) {
    ...CreditLcFields
  }
}
    ${CreditLcFieldsFragmentDoc}`;
export type CreditIngestLcMutationFn = Apollo.MutationFunction<CreditIngestLcMutation, CreditIngestLcMutationVariables>;

/**
 * __useCreditIngestLcMutation__
 *
 * To run a mutation, you first call `useCreditIngestLcMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreditIngestLcMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [creditIngestLcMutation, { data, loading, error }] = useCreditIngestLcMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreditIngestLcMutation(baseOptions?: Apollo.MutationHookOptions<CreditIngestLcMutation, CreditIngestLcMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreditIngestLcMutation, CreditIngestLcMutationVariables>(CreditIngestLcDocument, options);
      }
export type CreditIngestLcMutationHookResult = ReturnType<typeof useCreditIngestLcMutation>;
export type CreditIngestLcMutationResult = Apollo.MutationResult<CreditIngestLcMutation>;
export type CreditIngestLcMutationOptions = Apollo.BaseMutationOptions<CreditIngestLcMutation, CreditIngestLcMutationVariables>;
export const CreditAttachDocumentDocument = gql`
    mutation CreditAttachDocument($input: CreditAttachDocumentInput!) {
  creditAttachDocument(input: $input) {
    ...CreditDocumentFields
  }
}
    ${CreditDocumentFieldsFragmentDoc}`;
export type CreditAttachDocumentMutationFn = Apollo.MutationFunction<CreditAttachDocumentMutation, CreditAttachDocumentMutationVariables>;

/**
 * __useCreditAttachDocumentMutation__
 *
 * To run a mutation, you first call `useCreditAttachDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreditAttachDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [creditAttachDocumentMutation, { data, loading, error }] = useCreditAttachDocumentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreditAttachDocumentMutation(baseOptions?: Apollo.MutationHookOptions<CreditAttachDocumentMutation, CreditAttachDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreditAttachDocumentMutation, CreditAttachDocumentMutationVariables>(CreditAttachDocumentDocument, options);
      }
export type CreditAttachDocumentMutationHookResult = ReturnType<typeof useCreditAttachDocumentMutation>;
export type CreditAttachDocumentMutationResult = Apollo.MutationResult<CreditAttachDocumentMutation>;
export type CreditAttachDocumentMutationOptions = Apollo.BaseMutationOptions<CreditAttachDocumentMutation, CreditAttachDocumentMutationVariables>;
export const CreditRemoveDocumentDocument = gql`
    mutation CreditRemoveDocument($input: CreditRemoveDocumentInput!) {
  creditRemoveDocument(input: $input)
}
    `;
export type CreditRemoveDocumentMutationFn = Apollo.MutationFunction<CreditRemoveDocumentMutation, CreditRemoveDocumentMutationVariables>;

/**
 * __useCreditRemoveDocumentMutation__
 *
 * To run a mutation, you first call `useCreditRemoveDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreditRemoveDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [creditRemoveDocumentMutation, { data, loading, error }] = useCreditRemoveDocumentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreditRemoveDocumentMutation(baseOptions?: Apollo.MutationHookOptions<CreditRemoveDocumentMutation, CreditRemoveDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreditRemoveDocumentMutation, CreditRemoveDocumentMutationVariables>(CreditRemoveDocumentDocument, options);
      }
export type CreditRemoveDocumentMutationHookResult = ReturnType<typeof useCreditRemoveDocumentMutation>;
export type CreditRemoveDocumentMutationResult = Apollo.MutationResult<CreditRemoveDocumentMutation>;
export type CreditRemoveDocumentMutationOptions = Apollo.BaseMutationOptions<CreditRemoveDocumentMutation, CreditRemoveDocumentMutationVariables>;
export const CreditDeleteLcDocument = gql`
    mutation CreditDeleteLc($input: CreditDeleteLcInput!) {
  creditDeleteLc(input: $input)
}
    `;
export type CreditDeleteLcMutationFn = Apollo.MutationFunction<CreditDeleteLcMutation, CreditDeleteLcMutationVariables>;

/**
 * __useCreditDeleteLcMutation__
 *
 * To run a mutation, you first call `useCreditDeleteLcMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreditDeleteLcMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [creditDeleteLcMutation, { data, loading, error }] = useCreditDeleteLcMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreditDeleteLcMutation(baseOptions?: Apollo.MutationHookOptions<CreditDeleteLcMutation, CreditDeleteLcMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreditDeleteLcMutation, CreditDeleteLcMutationVariables>(CreditDeleteLcDocument, options);
      }
export type CreditDeleteLcMutationHookResult = ReturnType<typeof useCreditDeleteLcMutation>;
export type CreditDeleteLcMutationResult = Apollo.MutationResult<CreditDeleteLcMutation>;
export type CreditDeleteLcMutationOptions = Apollo.BaseMutationOptions<CreditDeleteLcMutation, CreditDeleteLcMutationVariables>;
export const DriveEntriesDocument = gql`
    query DriveEntries($input: DriveEntryConnectionInput!) {
  driveEntries(input: $input) {
    nodes {
      ...DriveEntryFields
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
  }
}
    ${DriveEntryFieldsFragmentDoc}`;

/**
 * __useDriveEntriesQuery__
 *
 * To run a query within a React component, call `useDriveEntriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useDriveEntriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDriveEntriesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDriveEntriesQuery(baseOptions: Apollo.QueryHookOptions<DriveEntriesQuery, DriveEntriesQueryVariables> & ({ variables: DriveEntriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DriveEntriesQuery, DriveEntriesQueryVariables>(DriveEntriesDocument, options);
      }
export function useDriveEntriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DriveEntriesQuery, DriveEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DriveEntriesQuery, DriveEntriesQueryVariables>(DriveEntriesDocument, options);
        }
// @ts-ignore
export function useDriveEntriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DriveEntriesQuery, DriveEntriesQueryVariables>): Apollo.UseSuspenseQueryResult<DriveEntriesQuery, DriveEntriesQueryVariables>;
export function useDriveEntriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveEntriesQuery, DriveEntriesQueryVariables>): Apollo.UseSuspenseQueryResult<DriveEntriesQuery | undefined, DriveEntriesQueryVariables>;
export function useDriveEntriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveEntriesQuery, DriveEntriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DriveEntriesQuery, DriveEntriesQueryVariables>(DriveEntriesDocument, options);
        }
export type DriveEntriesQueryHookResult = ReturnType<typeof useDriveEntriesQuery>;
export type DriveEntriesLazyQueryHookResult = ReturnType<typeof useDriveEntriesLazyQuery>;
export type DriveEntriesSuspenseQueryHookResult = ReturnType<typeof useDriveEntriesSuspenseQuery>;
export type DriveEntriesQueryResult = Apollo.QueryResult<DriveEntriesQuery, DriveEntriesQueryVariables>;
export const DriveEntryDocument = gql`
    query DriveEntry($id: Id!) {
  driveEntry(id: $id) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;

/**
 * __useDriveEntryQuery__
 *
 * To run a query within a React component, call `useDriveEntryQuery` and pass it any options that fit your needs.
 * When your component renders, `useDriveEntryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDriveEntryQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDriveEntryQuery(baseOptions: Apollo.QueryHookOptions<DriveEntryQuery, DriveEntryQueryVariables> & ({ variables: DriveEntryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DriveEntryQuery, DriveEntryQueryVariables>(DriveEntryDocument, options);
      }
export function useDriveEntryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DriveEntryQuery, DriveEntryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DriveEntryQuery, DriveEntryQueryVariables>(DriveEntryDocument, options);
        }
// @ts-ignore
export function useDriveEntrySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DriveEntryQuery, DriveEntryQueryVariables>): Apollo.UseSuspenseQueryResult<DriveEntryQuery, DriveEntryQueryVariables>;
export function useDriveEntrySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveEntryQuery, DriveEntryQueryVariables>): Apollo.UseSuspenseQueryResult<DriveEntryQuery | undefined, DriveEntryQueryVariables>;
export function useDriveEntrySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveEntryQuery, DriveEntryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DriveEntryQuery, DriveEntryQueryVariables>(DriveEntryDocument, options);
        }
export type DriveEntryQueryHookResult = ReturnType<typeof useDriveEntryQuery>;
export type DriveEntryLazyQueryHookResult = ReturnType<typeof useDriveEntryLazyQuery>;
export type DriveEntrySuspenseQueryHookResult = ReturnType<typeof useDriveEntrySuspenseQuery>;
export type DriveEntryQueryResult = Apollo.QueryResult<DriveEntryQuery, DriveEntryQueryVariables>;
export const DriveAlbumsDocument = gql`
    query DriveAlbums {
  driveAlbums {
    id
    name
    entryCount
    createdTime
    updatedTime
  }
}
    `;

/**
 * __useDriveAlbumsQuery__
 *
 * To run a query within a React component, call `useDriveAlbumsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDriveAlbumsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDriveAlbumsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDriveAlbumsQuery(baseOptions?: Apollo.QueryHookOptions<DriveAlbumsQuery, DriveAlbumsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DriveAlbumsQuery, DriveAlbumsQueryVariables>(DriveAlbumsDocument, options);
      }
export function useDriveAlbumsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DriveAlbumsQuery, DriveAlbumsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DriveAlbumsQuery, DriveAlbumsQueryVariables>(DriveAlbumsDocument, options);
        }
// @ts-ignore
export function useDriveAlbumsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DriveAlbumsQuery, DriveAlbumsQueryVariables>): Apollo.UseSuspenseQueryResult<DriveAlbumsQuery, DriveAlbumsQueryVariables>;
export function useDriveAlbumsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveAlbumsQuery, DriveAlbumsQueryVariables>): Apollo.UseSuspenseQueryResult<DriveAlbumsQuery | undefined, DriveAlbumsQueryVariables>;
export function useDriveAlbumsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DriveAlbumsQuery, DriveAlbumsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DriveAlbumsQuery, DriveAlbumsQueryVariables>(DriveAlbumsDocument, options);
        }
export type DriveAlbumsQueryHookResult = ReturnType<typeof useDriveAlbumsQuery>;
export type DriveAlbumsLazyQueryHookResult = ReturnType<typeof useDriveAlbumsLazyQuery>;
export type DriveAlbumsSuspenseQueryHookResult = ReturnType<typeof useDriveAlbumsSuspenseQuery>;
export type DriveAlbumsQueryResult = Apollo.QueryResult<DriveAlbumsQuery, DriveAlbumsQueryVariables>;
export const CreateDriveFolderDocument = gql`
    mutation CreateDriveFolder($input: CreateDriveFolderInput!) {
  createDriveFolder(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type CreateDriveFolderMutationFn = Apollo.MutationFunction<CreateDriveFolderMutation, CreateDriveFolderMutationVariables>;

/**
 * __useCreateDriveFolderMutation__
 *
 * To run a mutation, you first call `useCreateDriveFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDriveFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDriveFolderMutation, { data, loading, error }] = useCreateDriveFolderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDriveFolderMutation(baseOptions?: Apollo.MutationHookOptions<CreateDriveFolderMutation, CreateDriveFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDriveFolderMutation, CreateDriveFolderMutationVariables>(CreateDriveFolderDocument, options);
      }
export type CreateDriveFolderMutationHookResult = ReturnType<typeof useCreateDriveFolderMutation>;
export type CreateDriveFolderMutationResult = Apollo.MutationResult<CreateDriveFolderMutation>;
export type CreateDriveFolderMutationOptions = Apollo.BaseMutationOptions<CreateDriveFolderMutation, CreateDriveFolderMutationVariables>;
export const RegisterDriveFileDocument = gql`
    mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
  registerDriveFile(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type RegisterDriveFileMutationFn = Apollo.MutationFunction<RegisterDriveFileMutation, RegisterDriveFileMutationVariables>;

/**
 * __useRegisterDriveFileMutation__
 *
 * To run a mutation, you first call `useRegisterDriveFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterDriveFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerDriveFileMutation, { data, loading, error }] = useRegisterDriveFileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterDriveFileMutation(baseOptions?: Apollo.MutationHookOptions<RegisterDriveFileMutation, RegisterDriveFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterDriveFileMutation, RegisterDriveFileMutationVariables>(RegisterDriveFileDocument, options);
      }
export type RegisterDriveFileMutationHookResult = ReturnType<typeof useRegisterDriveFileMutation>;
export type RegisterDriveFileMutationResult = Apollo.MutationResult<RegisterDriveFileMutation>;
export type RegisterDriveFileMutationOptions = Apollo.BaseMutationOptions<RegisterDriveFileMutation, RegisterDriveFileMutationVariables>;
export const RenameDriveEntryDocument = gql`
    mutation RenameDriveEntry($input: RenameDriveEntryInput!) {
  renameDriveEntry(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type RenameDriveEntryMutationFn = Apollo.MutationFunction<RenameDriveEntryMutation, RenameDriveEntryMutationVariables>;

/**
 * __useRenameDriveEntryMutation__
 *
 * To run a mutation, you first call `useRenameDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameDriveEntryMutation, { data, loading, error }] = useRenameDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRenameDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<RenameDriveEntryMutation, RenameDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameDriveEntryMutation, RenameDriveEntryMutationVariables>(RenameDriveEntryDocument, options);
      }
export type RenameDriveEntryMutationHookResult = ReturnType<typeof useRenameDriveEntryMutation>;
export type RenameDriveEntryMutationResult = Apollo.MutationResult<RenameDriveEntryMutation>;
export type RenameDriveEntryMutationOptions = Apollo.BaseMutationOptions<RenameDriveEntryMutation, RenameDriveEntryMutationVariables>;
export const MoveDriveEntryDocument = gql`
    mutation MoveDriveEntry($input: MoveDriveEntryInput!) {
  moveDriveEntry(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type MoveDriveEntryMutationFn = Apollo.MutationFunction<MoveDriveEntryMutation, MoveDriveEntryMutationVariables>;

/**
 * __useMoveDriveEntryMutation__
 *
 * To run a mutation, you first call `useMoveDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMoveDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [moveDriveEntryMutation, { data, loading, error }] = useMoveDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useMoveDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<MoveDriveEntryMutation, MoveDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MoveDriveEntryMutation, MoveDriveEntryMutationVariables>(MoveDriveEntryDocument, options);
      }
export type MoveDriveEntryMutationHookResult = ReturnType<typeof useMoveDriveEntryMutation>;
export type MoveDriveEntryMutationResult = Apollo.MutationResult<MoveDriveEntryMutation>;
export type MoveDriveEntryMutationOptions = Apollo.BaseMutationOptions<MoveDriveEntryMutation, MoveDriveEntryMutationVariables>;
export const TrashDriveEntryDocument = gql`
    mutation TrashDriveEntry($input: TrashDriveEntryInput!) {
  trashDriveEntry(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type TrashDriveEntryMutationFn = Apollo.MutationFunction<TrashDriveEntryMutation, TrashDriveEntryMutationVariables>;

/**
 * __useTrashDriveEntryMutation__
 *
 * To run a mutation, you first call `useTrashDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTrashDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [trashDriveEntryMutation, { data, loading, error }] = useTrashDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTrashDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<TrashDriveEntryMutation, TrashDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TrashDriveEntryMutation, TrashDriveEntryMutationVariables>(TrashDriveEntryDocument, options);
      }
export type TrashDriveEntryMutationHookResult = ReturnType<typeof useTrashDriveEntryMutation>;
export type TrashDriveEntryMutationResult = Apollo.MutationResult<TrashDriveEntryMutation>;
export type TrashDriveEntryMutationOptions = Apollo.BaseMutationOptions<TrashDriveEntryMutation, TrashDriveEntryMutationVariables>;
export const RestoreDriveEntryDocument = gql`
    mutation RestoreDriveEntry($input: RestoreDriveEntryInput!) {
  restoreDriveEntry(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type RestoreDriveEntryMutationFn = Apollo.MutationFunction<RestoreDriveEntryMutation, RestoreDriveEntryMutationVariables>;

/**
 * __useRestoreDriveEntryMutation__
 *
 * To run a mutation, you first call `useRestoreDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRestoreDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [restoreDriveEntryMutation, { data, loading, error }] = useRestoreDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRestoreDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<RestoreDriveEntryMutation, RestoreDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RestoreDriveEntryMutation, RestoreDriveEntryMutationVariables>(RestoreDriveEntryDocument, options);
      }
export type RestoreDriveEntryMutationHookResult = ReturnType<typeof useRestoreDriveEntryMutation>;
export type RestoreDriveEntryMutationResult = Apollo.MutationResult<RestoreDriveEntryMutation>;
export type RestoreDriveEntryMutationOptions = Apollo.BaseMutationOptions<RestoreDriveEntryMutation, RestoreDriveEntryMutationVariables>;
export const DeleteDriveEntryDocument = gql`
    mutation DeleteDriveEntry($input: DeleteDriveEntryInput!) {
  deleteDriveEntry(input: $input)
}
    `;
export type DeleteDriveEntryMutationFn = Apollo.MutationFunction<DeleteDriveEntryMutation, DeleteDriveEntryMutationVariables>;

/**
 * __useDeleteDriveEntryMutation__
 *
 * To run a mutation, you first call `useDeleteDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDriveEntryMutation, { data, loading, error }] = useDeleteDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<DeleteDriveEntryMutation, DeleteDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteDriveEntryMutation, DeleteDriveEntryMutationVariables>(DeleteDriveEntryDocument, options);
      }
export type DeleteDriveEntryMutationHookResult = ReturnType<typeof useDeleteDriveEntryMutation>;
export type DeleteDriveEntryMutationResult = Apollo.MutationResult<DeleteDriveEntryMutation>;
export type DeleteDriveEntryMutationOptions = Apollo.BaseMutationOptions<DeleteDriveEntryMutation, DeleteDriveEntryMutationVariables>;
export const SetDriveEntryStarredDocument = gql`
    mutation SetDriveEntryStarred($input: SetDriveEntryStarredInput!) {
  setDriveEntryStarred(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type SetDriveEntryStarredMutationFn = Apollo.MutationFunction<SetDriveEntryStarredMutation, SetDriveEntryStarredMutationVariables>;

/**
 * __useSetDriveEntryStarredMutation__
 *
 * To run a mutation, you first call `useSetDriveEntryStarredMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetDriveEntryStarredMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setDriveEntryStarredMutation, { data, loading, error }] = useSetDriveEntryStarredMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetDriveEntryStarredMutation(baseOptions?: Apollo.MutationHookOptions<SetDriveEntryStarredMutation, SetDriveEntryStarredMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetDriveEntryStarredMutation, SetDriveEntryStarredMutationVariables>(SetDriveEntryStarredDocument, options);
      }
export type SetDriveEntryStarredMutationHookResult = ReturnType<typeof useSetDriveEntryStarredMutation>;
export type SetDriveEntryStarredMutationResult = Apollo.MutationResult<SetDriveEntryStarredMutation>;
export type SetDriveEntryStarredMutationOptions = Apollo.BaseMutationOptions<SetDriveEntryStarredMutation, SetDriveEntryStarredMutationVariables>;
export const SetDriveEntryCaptionDocument = gql`
    mutation SetDriveEntryCaption($input: SetDriveEntryCaptionInput!) {
  setDriveEntryCaption(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type SetDriveEntryCaptionMutationFn = Apollo.MutationFunction<SetDriveEntryCaptionMutation, SetDriveEntryCaptionMutationVariables>;

/**
 * __useSetDriveEntryCaptionMutation__
 *
 * To run a mutation, you first call `useSetDriveEntryCaptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetDriveEntryCaptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setDriveEntryCaptionMutation, { data, loading, error }] = useSetDriveEntryCaptionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetDriveEntryCaptionMutation(baseOptions?: Apollo.MutationHookOptions<SetDriveEntryCaptionMutation, SetDriveEntryCaptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetDriveEntryCaptionMutation, SetDriveEntryCaptionMutationVariables>(SetDriveEntryCaptionDocument, options);
      }
export type SetDriveEntryCaptionMutationHookResult = ReturnType<typeof useSetDriveEntryCaptionMutation>;
export type SetDriveEntryCaptionMutationResult = Apollo.MutationResult<SetDriveEntryCaptionMutation>;
export type SetDriveEntryCaptionMutationOptions = Apollo.BaseMutationOptions<SetDriveEntryCaptionMutation, SetDriveEntryCaptionMutationVariables>;
export const ReplaceDriveEntryMediaDocument = gql`
    mutation ReplaceDriveEntryMedia($input: ReplaceDriveEntryMediaInput!) {
  replaceDriveEntryMedia(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type ReplaceDriveEntryMediaMutationFn = Apollo.MutationFunction<ReplaceDriveEntryMediaMutation, ReplaceDriveEntryMediaMutationVariables>;

/**
 * __useReplaceDriveEntryMediaMutation__
 *
 * To run a mutation, you first call `useReplaceDriveEntryMediaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReplaceDriveEntryMediaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [replaceDriveEntryMediaMutation, { data, loading, error }] = useReplaceDriveEntryMediaMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useReplaceDriveEntryMediaMutation(baseOptions?: Apollo.MutationHookOptions<ReplaceDriveEntryMediaMutation, ReplaceDriveEntryMediaMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReplaceDriveEntryMediaMutation, ReplaceDriveEntryMediaMutationVariables>(ReplaceDriveEntryMediaDocument, options);
      }
export type ReplaceDriveEntryMediaMutationHookResult = ReturnType<typeof useReplaceDriveEntryMediaMutation>;
export type ReplaceDriveEntryMediaMutationResult = Apollo.MutationResult<ReplaceDriveEntryMediaMutation>;
export type ReplaceDriveEntryMediaMutationOptions = Apollo.BaseMutationOptions<ReplaceDriveEntryMediaMutation, ReplaceDriveEntryMediaMutationVariables>;
export const ShareDriveEntryDocument = gql`
    mutation ShareDriveEntry($input: ShareDriveEntryInput!) {
  shareDriveEntry(input: $input) {
    ...DriveEntryFields
  }
}
    ${DriveEntryFieldsFragmentDoc}`;
export type ShareDriveEntryMutationFn = Apollo.MutationFunction<ShareDriveEntryMutation, ShareDriveEntryMutationVariables>;

/**
 * __useShareDriveEntryMutation__
 *
 * To run a mutation, you first call `useShareDriveEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useShareDriveEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [shareDriveEntryMutation, { data, loading, error }] = useShareDriveEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useShareDriveEntryMutation(baseOptions?: Apollo.MutationHookOptions<ShareDriveEntryMutation, ShareDriveEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ShareDriveEntryMutation, ShareDriveEntryMutationVariables>(ShareDriveEntryDocument, options);
      }
export type ShareDriveEntryMutationHookResult = ReturnType<typeof useShareDriveEntryMutation>;
export type ShareDriveEntryMutationResult = Apollo.MutationResult<ShareDriveEntryMutation>;
export type ShareDriveEntryMutationOptions = Apollo.BaseMutationOptions<ShareDriveEntryMutation, ShareDriveEntryMutationVariables>;
export const CreateDriveAlbumDocument = gql`
    mutation CreateDriveAlbum($input: CreateDriveAlbumInput!) {
  createDriveAlbum(input: $input) {
    id
    name
    entryCount
  }
}
    `;
export type CreateDriveAlbumMutationFn = Apollo.MutationFunction<CreateDriveAlbumMutation, CreateDriveAlbumMutationVariables>;

/**
 * __useCreateDriveAlbumMutation__
 *
 * To run a mutation, you first call `useCreateDriveAlbumMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDriveAlbumMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDriveAlbumMutation, { data, loading, error }] = useCreateDriveAlbumMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDriveAlbumMutation(baseOptions?: Apollo.MutationHookOptions<CreateDriveAlbumMutation, CreateDriveAlbumMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDriveAlbumMutation, CreateDriveAlbumMutationVariables>(CreateDriveAlbumDocument, options);
      }
export type CreateDriveAlbumMutationHookResult = ReturnType<typeof useCreateDriveAlbumMutation>;
export type CreateDriveAlbumMutationResult = Apollo.MutationResult<CreateDriveAlbumMutation>;
export type CreateDriveAlbumMutationOptions = Apollo.BaseMutationOptions<CreateDriveAlbumMutation, CreateDriveAlbumMutationVariables>;
export const RenameDriveAlbumDocument = gql`
    mutation RenameDriveAlbum($input: RenameDriveAlbumInput!) {
  renameDriveAlbum(input: $input) {
    id
    name
    entryCount
  }
}
    `;
export type RenameDriveAlbumMutationFn = Apollo.MutationFunction<RenameDriveAlbumMutation, RenameDriveAlbumMutationVariables>;

/**
 * __useRenameDriveAlbumMutation__
 *
 * To run a mutation, you first call `useRenameDriveAlbumMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameDriveAlbumMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameDriveAlbumMutation, { data, loading, error }] = useRenameDriveAlbumMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRenameDriveAlbumMutation(baseOptions?: Apollo.MutationHookOptions<RenameDriveAlbumMutation, RenameDriveAlbumMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameDriveAlbumMutation, RenameDriveAlbumMutationVariables>(RenameDriveAlbumDocument, options);
      }
export type RenameDriveAlbumMutationHookResult = ReturnType<typeof useRenameDriveAlbumMutation>;
export type RenameDriveAlbumMutationResult = Apollo.MutationResult<RenameDriveAlbumMutation>;
export type RenameDriveAlbumMutationOptions = Apollo.BaseMutationOptions<RenameDriveAlbumMutation, RenameDriveAlbumMutationVariables>;
export const DeleteDriveAlbumDocument = gql`
    mutation DeleteDriveAlbum($input: DeleteDriveAlbumInput!) {
  deleteDriveAlbum(input: $input)
}
    `;
export type DeleteDriveAlbumMutationFn = Apollo.MutationFunction<DeleteDriveAlbumMutation, DeleteDriveAlbumMutationVariables>;

/**
 * __useDeleteDriveAlbumMutation__
 *
 * To run a mutation, you first call `useDeleteDriveAlbumMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDriveAlbumMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDriveAlbumMutation, { data, loading, error }] = useDeleteDriveAlbumMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteDriveAlbumMutation(baseOptions?: Apollo.MutationHookOptions<DeleteDriveAlbumMutation, DeleteDriveAlbumMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteDriveAlbumMutation, DeleteDriveAlbumMutationVariables>(DeleteDriveAlbumDocument, options);
      }
export type DeleteDriveAlbumMutationHookResult = ReturnType<typeof useDeleteDriveAlbumMutation>;
export type DeleteDriveAlbumMutationResult = Apollo.MutationResult<DeleteDriveAlbumMutation>;
export type DeleteDriveAlbumMutationOptions = Apollo.BaseMutationOptions<DeleteDriveAlbumMutation, DeleteDriveAlbumMutationVariables>;
export const AddDriveAlbumEntryDocument = gql`
    mutation AddDriveAlbumEntry($input: AddDriveAlbumEntryInput!) {
  addDriveAlbumEntry(input: $input) {
    id
    name
    entryCount
  }
}
    `;
export type AddDriveAlbumEntryMutationFn = Apollo.MutationFunction<AddDriveAlbumEntryMutation, AddDriveAlbumEntryMutationVariables>;

/**
 * __useAddDriveAlbumEntryMutation__
 *
 * To run a mutation, you first call `useAddDriveAlbumEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddDriveAlbumEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addDriveAlbumEntryMutation, { data, loading, error }] = useAddDriveAlbumEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddDriveAlbumEntryMutation(baseOptions?: Apollo.MutationHookOptions<AddDriveAlbumEntryMutation, AddDriveAlbumEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddDriveAlbumEntryMutation, AddDriveAlbumEntryMutationVariables>(AddDriveAlbumEntryDocument, options);
      }
export type AddDriveAlbumEntryMutationHookResult = ReturnType<typeof useAddDriveAlbumEntryMutation>;
export type AddDriveAlbumEntryMutationResult = Apollo.MutationResult<AddDriveAlbumEntryMutation>;
export type AddDriveAlbumEntryMutationOptions = Apollo.BaseMutationOptions<AddDriveAlbumEntryMutation, AddDriveAlbumEntryMutationVariables>;
export const RemoveDriveAlbumEntryDocument = gql`
    mutation RemoveDriveAlbumEntry($input: RemoveDriveAlbumEntryInput!) {
  removeDriveAlbumEntry(input: $input)
}
    `;
export type RemoveDriveAlbumEntryMutationFn = Apollo.MutationFunction<RemoveDriveAlbumEntryMutation, RemoveDriveAlbumEntryMutationVariables>;

/**
 * __useRemoveDriveAlbumEntryMutation__
 *
 * To run a mutation, you first call `useRemoveDriveAlbumEntryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveDriveAlbumEntryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeDriveAlbumEntryMutation, { data, loading, error }] = useRemoveDriveAlbumEntryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRemoveDriveAlbumEntryMutation(baseOptions?: Apollo.MutationHookOptions<RemoveDriveAlbumEntryMutation, RemoveDriveAlbumEntryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveDriveAlbumEntryMutation, RemoveDriveAlbumEntryMutationVariables>(RemoveDriveAlbumEntryDocument, options);
      }
export type RemoveDriveAlbumEntryMutationHookResult = ReturnType<typeof useRemoveDriveAlbumEntryMutation>;
export type RemoveDriveAlbumEntryMutationResult = Apollo.MutationResult<RemoveDriveAlbumEntryMutation>;
export type RemoveDriveAlbumEntryMutationOptions = Apollo.BaseMutationOptions<RemoveDriveAlbumEntryMutation, RemoveDriveAlbumEntryMutationVariables>;
export const ClearDriveLibraryDocument = gql`
    mutation ClearDriveLibrary {
  clearDriveLibrary
}
    `;
export type ClearDriveLibraryMutationFn = Apollo.MutationFunction<ClearDriveLibraryMutation, ClearDriveLibraryMutationVariables>;

/**
 * __useClearDriveLibraryMutation__
 *
 * To run a mutation, you first call `useClearDriveLibraryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClearDriveLibraryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [clearDriveLibraryMutation, { data, loading, error }] = useClearDriveLibraryMutation({
 *   variables: {
 *   },
 * });
 */
export function useClearDriveLibraryMutation(baseOptions?: Apollo.MutationHookOptions<ClearDriveLibraryMutation, ClearDriveLibraryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ClearDriveLibraryMutation, ClearDriveLibraryMutationVariables>(ClearDriveLibraryDocument, options);
      }
export type ClearDriveLibraryMutationHookResult = ReturnType<typeof useClearDriveLibraryMutation>;
export type ClearDriveLibraryMutationResult = Apollo.MutationResult<ClearDriveLibraryMutation>;
export type ClearDriveLibraryMutationOptions = Apollo.BaseMutationOptions<ClearDriveLibraryMutation, ClearDriveLibraryMutationVariables>;
export const EntryFieldsDocument = gql`
    query EntryFields {
  entryFields {
    ...EntryFieldFields
  }
}
    ${EntryFieldFieldsFragmentDoc}`;

/**
 * __useEntryFieldsQuery__
 *
 * To run a query within a React component, call `useEntryFieldsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryFieldsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryFieldsQuery({
 *   variables: {
 *   },
 * });
 */
export function useEntryFieldsQuery(baseOptions?: Apollo.QueryHookOptions<EntryFieldsQuery, EntryFieldsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryFieldsQuery, EntryFieldsQueryVariables>(EntryFieldsDocument, options);
      }
export function useEntryFieldsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryFieldsQuery, EntryFieldsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryFieldsQuery, EntryFieldsQueryVariables>(EntryFieldsDocument, options);
        }
// @ts-ignore
export function useEntryFieldsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryFieldsQuery, EntryFieldsQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldsQuery, EntryFieldsQueryVariables>;
export function useEntryFieldsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldsQuery, EntryFieldsQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldsQuery | undefined, EntryFieldsQueryVariables>;
export function useEntryFieldsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldsQuery, EntryFieldsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryFieldsQuery, EntryFieldsQueryVariables>(EntryFieldsDocument, options);
        }
export type EntryFieldsQueryHookResult = ReturnType<typeof useEntryFieldsQuery>;
export type EntryFieldsLazyQueryHookResult = ReturnType<typeof useEntryFieldsLazyQuery>;
export type EntryFieldsSuspenseQueryHookResult = ReturnType<typeof useEntryFieldsSuspenseQuery>;
export type EntryFieldsQueryResult = Apollo.QueryResult<EntryFieldsQuery, EntryFieldsQueryVariables>;
export const EntryRecordsDocument = gql`
    query EntryRecords($input: EntryRecordConnectionInput!) {
  entryRecords(input: $input) {
    nodes {
      ...EntryRecordFields
    }
    pageInfo {
      ...PageInfoFields
    }
  }
}
    ${EntryRecordFieldsFragmentDoc}
${PageInfoFieldsFragmentDoc}`;

/**
 * __useEntryRecordsQuery__
 *
 * To run a query within a React component, call `useEntryRecordsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryRecordsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryRecordsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEntryRecordsQuery(baseOptions: Apollo.QueryHookOptions<EntryRecordsQuery, EntryRecordsQueryVariables> & ({ variables: EntryRecordsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryRecordsQuery, EntryRecordsQueryVariables>(EntryRecordsDocument, options);
      }
export function useEntryRecordsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryRecordsQuery, EntryRecordsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryRecordsQuery, EntryRecordsQueryVariables>(EntryRecordsDocument, options);
        }
// @ts-ignore
export function useEntryRecordsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryRecordsQuery, EntryRecordsQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordsQuery, EntryRecordsQueryVariables>;
export function useEntryRecordsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordsQuery, EntryRecordsQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordsQuery | undefined, EntryRecordsQueryVariables>;
export function useEntryRecordsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordsQuery, EntryRecordsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryRecordsQuery, EntryRecordsQueryVariables>(EntryRecordsDocument, options);
        }
export type EntryRecordsQueryHookResult = ReturnType<typeof useEntryRecordsQuery>;
export type EntryRecordsLazyQueryHookResult = ReturnType<typeof useEntryRecordsLazyQuery>;
export type EntryRecordsSuspenseQueryHookResult = ReturnType<typeof useEntryRecordsSuspenseQuery>;
export type EntryRecordsQueryResult = Apollo.QueryResult<EntryRecordsQuery, EntryRecordsQueryVariables>;
export const EntryFieldCreateFormSchemaDocument = gql`
    query EntryFieldCreateFormSchema {
  schema: entryFieldCreateFormSchema {
    jsonSchema
    uiSchema
    defaultData
  }
}
    `;

/**
 * __useEntryFieldCreateFormSchemaQuery__
 *
 * To run a query within a React component, call `useEntryFieldCreateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryFieldCreateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryFieldCreateFormSchemaQuery({
 *   variables: {
 *   },
 * });
 */
export function useEntryFieldCreateFormSchemaQuery(baseOptions?: Apollo.QueryHookOptions<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>(EntryFieldCreateFormSchemaDocument, options);
      }
export function useEntryFieldCreateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>(EntryFieldCreateFormSchemaDocument, options);
        }
// @ts-ignore
export function useEntryFieldCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>;
export function useEntryFieldCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldCreateFormSchemaQuery | undefined, EntryFieldCreateFormSchemaQueryVariables>;
export function useEntryFieldCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>(EntryFieldCreateFormSchemaDocument, options);
        }
export type EntryFieldCreateFormSchemaQueryHookResult = ReturnType<typeof useEntryFieldCreateFormSchemaQuery>;
export type EntryFieldCreateFormSchemaLazyQueryHookResult = ReturnType<typeof useEntryFieldCreateFormSchemaLazyQuery>;
export type EntryFieldCreateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useEntryFieldCreateFormSchemaSuspenseQuery>;
export type EntryFieldCreateFormSchemaQueryResult = Apollo.QueryResult<EntryFieldCreateFormSchemaQuery, EntryFieldCreateFormSchemaQueryVariables>;
export const EntryFieldUpdateFormSchemaDocument = gql`
    query EntryFieldUpdateFormSchema($input: SchemaFormUpdateInput!) {
  schema: entryFieldUpdateFormSchema(input: $input) {
    jsonSchema
    uiSchema
    defaultData
  }
}
    `;

/**
 * __useEntryFieldUpdateFormSchemaQuery__
 *
 * To run a query within a React component, call `useEntryFieldUpdateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryFieldUpdateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryFieldUpdateFormSchemaQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEntryFieldUpdateFormSchemaQuery(baseOptions: Apollo.QueryHookOptions<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables> & ({ variables: EntryFieldUpdateFormSchemaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>(EntryFieldUpdateFormSchemaDocument, options);
      }
export function useEntryFieldUpdateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>(EntryFieldUpdateFormSchemaDocument, options);
        }
// @ts-ignore
export function useEntryFieldUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>;
export function useEntryFieldUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryFieldUpdateFormSchemaQuery | undefined, EntryFieldUpdateFormSchemaQueryVariables>;
export function useEntryFieldUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>(EntryFieldUpdateFormSchemaDocument, options);
        }
export type EntryFieldUpdateFormSchemaQueryHookResult = ReturnType<typeof useEntryFieldUpdateFormSchemaQuery>;
export type EntryFieldUpdateFormSchemaLazyQueryHookResult = ReturnType<typeof useEntryFieldUpdateFormSchemaLazyQuery>;
export type EntryFieldUpdateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useEntryFieldUpdateFormSchemaSuspenseQuery>;
export type EntryFieldUpdateFormSchemaQueryResult = Apollo.QueryResult<EntryFieldUpdateFormSchemaQuery, EntryFieldUpdateFormSchemaQueryVariables>;
export const EntryRecordCreateFormSchemaDocument = gql`
    query EntryRecordCreateFormSchema {
  schema: entryRecordCreateFormSchema {
    jsonSchema
    uiSchema
    defaultData
  }
}
    `;

/**
 * __useEntryRecordCreateFormSchemaQuery__
 *
 * To run a query within a React component, call `useEntryRecordCreateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryRecordCreateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryRecordCreateFormSchemaQuery({
 *   variables: {
 *   },
 * });
 */
export function useEntryRecordCreateFormSchemaQuery(baseOptions?: Apollo.QueryHookOptions<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>(EntryRecordCreateFormSchemaDocument, options);
      }
export function useEntryRecordCreateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>(EntryRecordCreateFormSchemaDocument, options);
        }
// @ts-ignore
export function useEntryRecordCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>;
export function useEntryRecordCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordCreateFormSchemaQuery | undefined, EntryRecordCreateFormSchemaQueryVariables>;
export function useEntryRecordCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>(EntryRecordCreateFormSchemaDocument, options);
        }
export type EntryRecordCreateFormSchemaQueryHookResult = ReturnType<typeof useEntryRecordCreateFormSchemaQuery>;
export type EntryRecordCreateFormSchemaLazyQueryHookResult = ReturnType<typeof useEntryRecordCreateFormSchemaLazyQuery>;
export type EntryRecordCreateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useEntryRecordCreateFormSchemaSuspenseQuery>;
export type EntryRecordCreateFormSchemaQueryResult = Apollo.QueryResult<EntryRecordCreateFormSchemaQuery, EntryRecordCreateFormSchemaQueryVariables>;
export const EntryRecordUpdateFormSchemaDocument = gql`
    query EntryRecordUpdateFormSchema($input: SchemaFormUpdateInput!) {
  schema: entryRecordUpdateFormSchema(input: $input) {
    jsonSchema
    uiSchema
    defaultData
  }
}
    `;

/**
 * __useEntryRecordUpdateFormSchemaQuery__
 *
 * To run a query within a React component, call `useEntryRecordUpdateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useEntryRecordUpdateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEntryRecordUpdateFormSchemaQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEntryRecordUpdateFormSchemaQuery(baseOptions: Apollo.QueryHookOptions<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables> & ({ variables: EntryRecordUpdateFormSchemaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>(EntryRecordUpdateFormSchemaDocument, options);
      }
export function useEntryRecordUpdateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>(EntryRecordUpdateFormSchemaDocument, options);
        }
// @ts-ignore
export function useEntryRecordUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>;
export function useEntryRecordUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<EntryRecordUpdateFormSchemaQuery | undefined, EntryRecordUpdateFormSchemaQueryVariables>;
export function useEntryRecordUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>(EntryRecordUpdateFormSchemaDocument, options);
        }
export type EntryRecordUpdateFormSchemaQueryHookResult = ReturnType<typeof useEntryRecordUpdateFormSchemaQuery>;
export type EntryRecordUpdateFormSchemaLazyQueryHookResult = ReturnType<typeof useEntryRecordUpdateFormSchemaLazyQuery>;
export type EntryRecordUpdateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useEntryRecordUpdateFormSchemaSuspenseQuery>;
export type EntryRecordUpdateFormSchemaQueryResult = Apollo.QueryResult<EntryRecordUpdateFormSchemaQuery, EntryRecordUpdateFormSchemaQueryVariables>;
export const CreateEntryFieldDocument = gql`
    mutation CreateEntryField($input: CreateEntryFieldInput!) {
  createEntryField(input: $input) {
    ...EntryFieldFields
  }
}
    ${EntryFieldFieldsFragmentDoc}`;
export type CreateEntryFieldMutationFn = Apollo.MutationFunction<CreateEntryFieldMutation, CreateEntryFieldMutationVariables>;

/**
 * __useCreateEntryFieldMutation__
 *
 * To run a mutation, you first call `useCreateEntryFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEntryFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEntryFieldMutation, { data, loading, error }] = useCreateEntryFieldMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateEntryFieldMutation(baseOptions?: Apollo.MutationHookOptions<CreateEntryFieldMutation, CreateEntryFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateEntryFieldMutation, CreateEntryFieldMutationVariables>(CreateEntryFieldDocument, options);
      }
export type CreateEntryFieldMutationHookResult = ReturnType<typeof useCreateEntryFieldMutation>;
export type CreateEntryFieldMutationResult = Apollo.MutationResult<CreateEntryFieldMutation>;
export type CreateEntryFieldMutationOptions = Apollo.BaseMutationOptions<CreateEntryFieldMutation, CreateEntryFieldMutationVariables>;
export const UpdateEntryFieldDocument = gql`
    mutation UpdateEntryField($input: UpdateEntryFieldInput!) {
  updateEntryField(input: $input) {
    ...EntryFieldFields
  }
}
    ${EntryFieldFieldsFragmentDoc}`;
export type UpdateEntryFieldMutationFn = Apollo.MutationFunction<UpdateEntryFieldMutation, UpdateEntryFieldMutationVariables>;

/**
 * __useUpdateEntryFieldMutation__
 *
 * To run a mutation, you first call `useUpdateEntryFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEntryFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEntryFieldMutation, { data, loading, error }] = useUpdateEntryFieldMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateEntryFieldMutation(baseOptions?: Apollo.MutationHookOptions<UpdateEntryFieldMutation, UpdateEntryFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateEntryFieldMutation, UpdateEntryFieldMutationVariables>(UpdateEntryFieldDocument, options);
      }
export type UpdateEntryFieldMutationHookResult = ReturnType<typeof useUpdateEntryFieldMutation>;
export type UpdateEntryFieldMutationResult = Apollo.MutationResult<UpdateEntryFieldMutation>;
export type UpdateEntryFieldMutationOptions = Apollo.BaseMutationOptions<UpdateEntryFieldMutation, UpdateEntryFieldMutationVariables>;
export const DeleteEntryFieldDocument = gql`
    mutation DeleteEntryField($input: DeleteEntryFieldInput!) {
  deleteEntryField(input: $input)
}
    `;
export type DeleteEntryFieldMutationFn = Apollo.MutationFunction<DeleteEntryFieldMutation, DeleteEntryFieldMutationVariables>;

/**
 * __useDeleteEntryFieldMutation__
 *
 * To run a mutation, you first call `useDeleteEntryFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteEntryFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteEntryFieldMutation, { data, loading, error }] = useDeleteEntryFieldMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteEntryFieldMutation(baseOptions?: Apollo.MutationHookOptions<DeleteEntryFieldMutation, DeleteEntryFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteEntryFieldMutation, DeleteEntryFieldMutationVariables>(DeleteEntryFieldDocument, options);
      }
export type DeleteEntryFieldMutationHookResult = ReturnType<typeof useDeleteEntryFieldMutation>;
export type DeleteEntryFieldMutationResult = Apollo.MutationResult<DeleteEntryFieldMutation>;
export type DeleteEntryFieldMutationOptions = Apollo.BaseMutationOptions<DeleteEntryFieldMutation, DeleteEntryFieldMutationVariables>;
export const CreateEntryRecordDocument = gql`
    mutation CreateEntryRecord($input: CreateEntryRecordInput!) {
  createEntryRecord(input: $input) {
    ...EntryRecordFields
  }
}
    ${EntryRecordFieldsFragmentDoc}`;
export type CreateEntryRecordMutationFn = Apollo.MutationFunction<CreateEntryRecordMutation, CreateEntryRecordMutationVariables>;

/**
 * __useCreateEntryRecordMutation__
 *
 * To run a mutation, you first call `useCreateEntryRecordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateEntryRecordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createEntryRecordMutation, { data, loading, error }] = useCreateEntryRecordMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateEntryRecordMutation(baseOptions?: Apollo.MutationHookOptions<CreateEntryRecordMutation, CreateEntryRecordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateEntryRecordMutation, CreateEntryRecordMutationVariables>(CreateEntryRecordDocument, options);
      }
export type CreateEntryRecordMutationHookResult = ReturnType<typeof useCreateEntryRecordMutation>;
export type CreateEntryRecordMutationResult = Apollo.MutationResult<CreateEntryRecordMutation>;
export type CreateEntryRecordMutationOptions = Apollo.BaseMutationOptions<CreateEntryRecordMutation, CreateEntryRecordMutationVariables>;
export const UpdateEntryRecordDocument = gql`
    mutation UpdateEntryRecord($input: UpdateEntryRecordInput!) {
  updateEntryRecord(input: $input) {
    ...EntryRecordFields
  }
}
    ${EntryRecordFieldsFragmentDoc}`;
export type UpdateEntryRecordMutationFn = Apollo.MutationFunction<UpdateEntryRecordMutation, UpdateEntryRecordMutationVariables>;

/**
 * __useUpdateEntryRecordMutation__
 *
 * To run a mutation, you first call `useUpdateEntryRecordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEntryRecordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEntryRecordMutation, { data, loading, error }] = useUpdateEntryRecordMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateEntryRecordMutation(baseOptions?: Apollo.MutationHookOptions<UpdateEntryRecordMutation, UpdateEntryRecordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateEntryRecordMutation, UpdateEntryRecordMutationVariables>(UpdateEntryRecordDocument, options);
      }
export type UpdateEntryRecordMutationHookResult = ReturnType<typeof useUpdateEntryRecordMutation>;
export type UpdateEntryRecordMutationResult = Apollo.MutationResult<UpdateEntryRecordMutation>;
export type UpdateEntryRecordMutationOptions = Apollo.BaseMutationOptions<UpdateEntryRecordMutation, UpdateEntryRecordMutationVariables>;
export const DeleteEntryRecordDocument = gql`
    mutation DeleteEntryRecord($input: DeleteEntryRecordInput!) {
  deleteEntryRecord(input: $input)
}
    `;
export type DeleteEntryRecordMutationFn = Apollo.MutationFunction<DeleteEntryRecordMutation, DeleteEntryRecordMutationVariables>;

/**
 * __useDeleteEntryRecordMutation__
 *
 * To run a mutation, you first call `useDeleteEntryRecordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteEntryRecordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteEntryRecordMutation, { data, loading, error }] = useDeleteEntryRecordMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteEntryRecordMutation(baseOptions?: Apollo.MutationHookOptions<DeleteEntryRecordMutation, DeleteEntryRecordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteEntryRecordMutation, DeleteEntryRecordMutationVariables>(DeleteEntryRecordDocument, options);
      }
export type DeleteEntryRecordMutationHookResult = ReturnType<typeof useDeleteEntryRecordMutation>;
export type DeleteEntryRecordMutationResult = Apollo.MutationResult<DeleteEntryRecordMutation>;
export type DeleteEntryRecordMutationOptions = Apollo.BaseMutationOptions<DeleteEntryRecordMutation, DeleteEntryRecordMutationVariables>;
export const FlowTemplatesDocument = gql`
    query FlowTemplates {
  flowTemplates {
    ...FlowTemplateFields
  }
}
    ${FlowTemplateFieldsFragmentDoc}`;

/**
 * __useFlowTemplatesQuery__
 *
 * To run a query within a React component, call `useFlowTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFlowTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFlowTemplatesQuery({
 *   variables: {
 *   },
 * });
 */
export function useFlowTemplatesQuery(baseOptions?: Apollo.QueryHookOptions<FlowTemplatesQuery, FlowTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FlowTemplatesQuery, FlowTemplatesQueryVariables>(FlowTemplatesDocument, options);
      }
export function useFlowTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FlowTemplatesQuery, FlowTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FlowTemplatesQuery, FlowTemplatesQueryVariables>(FlowTemplatesDocument, options);
        }
// @ts-ignore
export function useFlowTemplatesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FlowTemplatesQuery, FlowTemplatesQueryVariables>): Apollo.UseSuspenseQueryResult<FlowTemplatesQuery, FlowTemplatesQueryVariables>;
export function useFlowTemplatesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowTemplatesQuery, FlowTemplatesQueryVariables>): Apollo.UseSuspenseQueryResult<FlowTemplatesQuery | undefined, FlowTemplatesQueryVariables>;
export function useFlowTemplatesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowTemplatesQuery, FlowTemplatesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FlowTemplatesQuery, FlowTemplatesQueryVariables>(FlowTemplatesDocument, options);
        }
export type FlowTemplatesQueryHookResult = ReturnType<typeof useFlowTemplatesQuery>;
export type FlowTemplatesLazyQueryHookResult = ReturnType<typeof useFlowTemplatesLazyQuery>;
export type FlowTemplatesSuspenseQueryHookResult = ReturnType<typeof useFlowTemplatesSuspenseQuery>;
export type FlowTemplatesQueryResult = Apollo.QueryResult<FlowTemplatesQuery, FlowTemplatesQueryVariables>;
export const FlowTemplateGridDocument = gql`
    query FlowTemplateGrid($templateId: Id!) {
  flowTemplate(templateId: $templateId) {
    ...FlowTemplateFields
    lines {
      ...FlowLineFields
    }
  }
}
    ${FlowTemplateFieldsFragmentDoc}
${FlowLineFieldsFragmentDoc}`;

/**
 * __useFlowTemplateGridQuery__
 *
 * To run a query within a React component, call `useFlowTemplateGridQuery` and pass it any options that fit your needs.
 * When your component renders, `useFlowTemplateGridQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFlowTemplateGridQuery({
 *   variables: {
 *      templateId: // value for 'templateId'
 *   },
 * });
 */
export function useFlowTemplateGridQuery(baseOptions: Apollo.QueryHookOptions<FlowTemplateGridQuery, FlowTemplateGridQueryVariables> & ({ variables: FlowTemplateGridQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>(FlowTemplateGridDocument, options);
      }
export function useFlowTemplateGridLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>(FlowTemplateGridDocument, options);
        }
// @ts-ignore
export function useFlowTemplateGridSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>): Apollo.UseSuspenseQueryResult<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>;
export function useFlowTemplateGridSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>): Apollo.UseSuspenseQueryResult<FlowTemplateGridQuery | undefined, FlowTemplateGridQueryVariables>;
export function useFlowTemplateGridSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>(FlowTemplateGridDocument, options);
        }
export type FlowTemplateGridQueryHookResult = ReturnType<typeof useFlowTemplateGridQuery>;
export type FlowTemplateGridLazyQueryHookResult = ReturnType<typeof useFlowTemplateGridLazyQuery>;
export type FlowTemplateGridSuspenseQueryHookResult = ReturnType<typeof useFlowTemplateGridSuspenseQuery>;
export type FlowTemplateGridQueryResult = Apollo.QueryResult<FlowTemplateGridQuery, FlowTemplateGridQueryVariables>;
export const FlowLinkableCategoriesDocument = gql`
    query FlowLinkableCategories {
  flowLinkableCategories {
    incomeCategories
    expenseCategories
  }
}
    `;

/**
 * __useFlowLinkableCategoriesQuery__
 *
 * To run a query within a React component, call `useFlowLinkableCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFlowLinkableCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFlowLinkableCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useFlowLinkableCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>(FlowLinkableCategoriesDocument, options);
      }
export function useFlowLinkableCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>(FlowLinkableCategoriesDocument, options);
        }
// @ts-ignore
export function useFlowLinkableCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>;
export function useFlowLinkableCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<FlowLinkableCategoriesQuery | undefined, FlowLinkableCategoriesQueryVariables>;
export function useFlowLinkableCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>(FlowLinkableCategoriesDocument, options);
        }
export type FlowLinkableCategoriesQueryHookResult = ReturnType<typeof useFlowLinkableCategoriesQuery>;
export type FlowLinkableCategoriesLazyQueryHookResult = ReturnType<typeof useFlowLinkableCategoriesLazyQuery>;
export type FlowLinkableCategoriesSuspenseQueryHookResult = ReturnType<typeof useFlowLinkableCategoriesSuspenseQuery>;
export type FlowLinkableCategoriesQueryResult = Apollo.QueryResult<FlowLinkableCategoriesQuery, FlowLinkableCategoriesQueryVariables>;
export const MyBooksConnectionDocument = gql`
    query MyBooksConnection {
  myBooksConnection {
    ...QuickBooksConnectionFields
  }
}
    ${QuickBooksConnectionFieldsFragmentDoc}`;

/**
 * __useMyBooksConnectionQuery__
 *
 * To run a query within a React component, call `useMyBooksConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyBooksConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyBooksConnectionQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyBooksConnectionQuery(baseOptions?: Apollo.QueryHookOptions<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>(MyBooksConnectionDocument, options);
      }
export function useMyBooksConnectionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>(MyBooksConnectionDocument, options);
        }
// @ts-ignore
export function useMyBooksConnectionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>): Apollo.UseSuspenseQueryResult<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>;
export function useMyBooksConnectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>): Apollo.UseSuspenseQueryResult<MyBooksConnectionQuery | undefined, MyBooksConnectionQueryVariables>;
export function useMyBooksConnectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>(MyBooksConnectionDocument, options);
        }
export type MyBooksConnectionQueryHookResult = ReturnType<typeof useMyBooksConnectionQuery>;
export type MyBooksConnectionLazyQueryHookResult = ReturnType<typeof useMyBooksConnectionLazyQuery>;
export type MyBooksConnectionSuspenseQueryHookResult = ReturnType<typeof useMyBooksConnectionSuspenseQuery>;
export type MyBooksConnectionQueryResult = Apollo.QueryResult<MyBooksConnectionQuery, MyBooksConnectionQueryVariables>;
export const ConnectMyBooksDocument = gql`
    mutation ConnectMyBooks($input: ConnectQuickBooksInput!) {
  connectMyBooks(input: $input) {
    ...QuickBooksConnectionFields
  }
}
    ${QuickBooksConnectionFieldsFragmentDoc}`;
export type ConnectMyBooksMutationFn = Apollo.MutationFunction<ConnectMyBooksMutation, ConnectMyBooksMutationVariables>;

/**
 * __useConnectMyBooksMutation__
 *
 * To run a mutation, you first call `useConnectMyBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConnectMyBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [connectMyBooksMutation, { data, loading, error }] = useConnectMyBooksMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConnectMyBooksMutation(baseOptions?: Apollo.MutationHookOptions<ConnectMyBooksMutation, ConnectMyBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ConnectMyBooksMutation, ConnectMyBooksMutationVariables>(ConnectMyBooksDocument, options);
      }
export type ConnectMyBooksMutationHookResult = ReturnType<typeof useConnectMyBooksMutation>;
export type ConnectMyBooksMutationResult = Apollo.MutationResult<ConnectMyBooksMutation>;
export type ConnectMyBooksMutationOptions = Apollo.BaseMutationOptions<ConnectMyBooksMutation, ConnectMyBooksMutationVariables>;
export const DisconnectMyBooksDocument = gql`
    mutation DisconnectMyBooks {
  disconnectMyBooks
}
    `;
export type DisconnectMyBooksMutationFn = Apollo.MutationFunction<DisconnectMyBooksMutation, DisconnectMyBooksMutationVariables>;

/**
 * __useDisconnectMyBooksMutation__
 *
 * To run a mutation, you first call `useDisconnectMyBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisconnectMyBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disconnectMyBooksMutation, { data, loading, error }] = useDisconnectMyBooksMutation({
 *   variables: {
 *   },
 * });
 */
export function useDisconnectMyBooksMutation(baseOptions?: Apollo.MutationHookOptions<DisconnectMyBooksMutation, DisconnectMyBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DisconnectMyBooksMutation, DisconnectMyBooksMutationVariables>(DisconnectMyBooksDocument, options);
      }
export type DisconnectMyBooksMutationHookResult = ReturnType<typeof useDisconnectMyBooksMutation>;
export type DisconnectMyBooksMutationResult = Apollo.MutationResult<DisconnectMyBooksMutation>;
export type DisconnectMyBooksMutationOptions = Apollo.BaseMutationOptions<DisconnectMyBooksMutation, DisconnectMyBooksMutationVariables>;
export const FlowCreateTemplateDocument = gql`
    mutation FlowCreateTemplate($input: FlowCreateTemplateInput!) {
  flowCreateTemplate(input: $input) {
    ...FlowTemplateFields
  }
}
    ${FlowTemplateFieldsFragmentDoc}`;
export type FlowCreateTemplateMutationFn = Apollo.MutationFunction<FlowCreateTemplateMutation, FlowCreateTemplateMutationVariables>;

/**
 * __useFlowCreateTemplateMutation__
 *
 * To run a mutation, you first call `useFlowCreateTemplateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowCreateTemplateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowCreateTemplateMutation, { data, loading, error }] = useFlowCreateTemplateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowCreateTemplateMutation(baseOptions?: Apollo.MutationHookOptions<FlowCreateTemplateMutation, FlowCreateTemplateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowCreateTemplateMutation, FlowCreateTemplateMutationVariables>(FlowCreateTemplateDocument, options);
      }
export type FlowCreateTemplateMutationHookResult = ReturnType<typeof useFlowCreateTemplateMutation>;
export type FlowCreateTemplateMutationResult = Apollo.MutationResult<FlowCreateTemplateMutation>;
export type FlowCreateTemplateMutationOptions = Apollo.BaseMutationOptions<FlowCreateTemplateMutation, FlowCreateTemplateMutationVariables>;
export const FlowRenameTemplateDocument = gql`
    mutation FlowRenameTemplate($input: FlowRenameTemplateInput!) {
  flowRenameTemplate(input: $input) {
    ...FlowTemplateFields
  }
}
    ${FlowTemplateFieldsFragmentDoc}`;
export type FlowRenameTemplateMutationFn = Apollo.MutationFunction<FlowRenameTemplateMutation, FlowRenameTemplateMutationVariables>;

/**
 * __useFlowRenameTemplateMutation__
 *
 * To run a mutation, you first call `useFlowRenameTemplateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowRenameTemplateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowRenameTemplateMutation, { data, loading, error }] = useFlowRenameTemplateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowRenameTemplateMutation(baseOptions?: Apollo.MutationHookOptions<FlowRenameTemplateMutation, FlowRenameTemplateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowRenameTemplateMutation, FlowRenameTemplateMutationVariables>(FlowRenameTemplateDocument, options);
      }
export type FlowRenameTemplateMutationHookResult = ReturnType<typeof useFlowRenameTemplateMutation>;
export type FlowRenameTemplateMutationResult = Apollo.MutationResult<FlowRenameTemplateMutation>;
export type FlowRenameTemplateMutationOptions = Apollo.BaseMutationOptions<FlowRenameTemplateMutation, FlowRenameTemplateMutationVariables>;
export const FlowDeleteTemplateDocument = gql`
    mutation FlowDeleteTemplate($input: FlowDeleteTemplateInput!) {
  flowDeleteTemplate(input: $input)
}
    `;
export type FlowDeleteTemplateMutationFn = Apollo.MutationFunction<FlowDeleteTemplateMutation, FlowDeleteTemplateMutationVariables>;

/**
 * __useFlowDeleteTemplateMutation__
 *
 * To run a mutation, you first call `useFlowDeleteTemplateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowDeleteTemplateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowDeleteTemplateMutation, { data, loading, error }] = useFlowDeleteTemplateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowDeleteTemplateMutation(baseOptions?: Apollo.MutationHookOptions<FlowDeleteTemplateMutation, FlowDeleteTemplateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowDeleteTemplateMutation, FlowDeleteTemplateMutationVariables>(FlowDeleteTemplateDocument, options);
      }
export type FlowDeleteTemplateMutationHookResult = ReturnType<typeof useFlowDeleteTemplateMutation>;
export type FlowDeleteTemplateMutationResult = Apollo.MutationResult<FlowDeleteTemplateMutation>;
export type FlowDeleteTemplateMutationOptions = Apollo.BaseMutationOptions<FlowDeleteTemplateMutation, FlowDeleteTemplateMutationVariables>;
export const FlowAddLineDocument = gql`
    mutation FlowAddLine($input: FlowAddLineInput!) {
  flowAddLine(input: $input) {
    ...FlowLineFields
  }
}
    ${FlowLineFieldsFragmentDoc}`;
export type FlowAddLineMutationFn = Apollo.MutationFunction<FlowAddLineMutation, FlowAddLineMutationVariables>;

/**
 * __useFlowAddLineMutation__
 *
 * To run a mutation, you first call `useFlowAddLineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowAddLineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowAddLineMutation, { data, loading, error }] = useFlowAddLineMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowAddLineMutation(baseOptions?: Apollo.MutationHookOptions<FlowAddLineMutation, FlowAddLineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowAddLineMutation, FlowAddLineMutationVariables>(FlowAddLineDocument, options);
      }
export type FlowAddLineMutationHookResult = ReturnType<typeof useFlowAddLineMutation>;
export type FlowAddLineMutationResult = Apollo.MutationResult<FlowAddLineMutation>;
export type FlowAddLineMutationOptions = Apollo.BaseMutationOptions<FlowAddLineMutation, FlowAddLineMutationVariables>;
export const FlowUpdateLineDocument = gql`
    mutation FlowUpdateLine($input: FlowUpdateLineInput!) {
  flowUpdateLine(input: $input) {
    ...FlowLineFields
  }
}
    ${FlowLineFieldsFragmentDoc}`;
export type FlowUpdateLineMutationFn = Apollo.MutationFunction<FlowUpdateLineMutation, FlowUpdateLineMutationVariables>;

/**
 * __useFlowUpdateLineMutation__
 *
 * To run a mutation, you first call `useFlowUpdateLineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowUpdateLineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowUpdateLineMutation, { data, loading, error }] = useFlowUpdateLineMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowUpdateLineMutation(baseOptions?: Apollo.MutationHookOptions<FlowUpdateLineMutation, FlowUpdateLineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowUpdateLineMutation, FlowUpdateLineMutationVariables>(FlowUpdateLineDocument, options);
      }
export type FlowUpdateLineMutationHookResult = ReturnType<typeof useFlowUpdateLineMutation>;
export type FlowUpdateLineMutationResult = Apollo.MutationResult<FlowUpdateLineMutation>;
export type FlowUpdateLineMutationOptions = Apollo.BaseMutationOptions<FlowUpdateLineMutation, FlowUpdateLineMutationVariables>;
export const FlowRemoveLineDocument = gql`
    mutation FlowRemoveLine($input: FlowRemoveLineInput!) {
  flowRemoveLine(input: $input)
}
    `;
export type FlowRemoveLineMutationFn = Apollo.MutationFunction<FlowRemoveLineMutation, FlowRemoveLineMutationVariables>;

/**
 * __useFlowRemoveLineMutation__
 *
 * To run a mutation, you first call `useFlowRemoveLineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowRemoveLineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowRemoveLineMutation, { data, loading, error }] = useFlowRemoveLineMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowRemoveLineMutation(baseOptions?: Apollo.MutationHookOptions<FlowRemoveLineMutation, FlowRemoveLineMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowRemoveLineMutation, FlowRemoveLineMutationVariables>(FlowRemoveLineDocument, options);
      }
export type FlowRemoveLineMutationHookResult = ReturnType<typeof useFlowRemoveLineMutation>;
export type FlowRemoveLineMutationResult = Apollo.MutationResult<FlowRemoveLineMutation>;
export type FlowRemoveLineMutationOptions = Apollo.BaseMutationOptions<FlowRemoveLineMutation, FlowRemoveLineMutationVariables>;
export const FlowExportTemplateXlsxDocument = gql`
    mutation FlowExportTemplateXlsx($input: FlowExportTemplateXlsxInput!) {
  flowExportTemplateXlsx(input: $input) {
    id
    fileName
  }
}
    `;
export type FlowExportTemplateXlsxMutationFn = Apollo.MutationFunction<FlowExportTemplateXlsxMutation, FlowExportTemplateXlsxMutationVariables>;

/**
 * __useFlowExportTemplateXlsxMutation__
 *
 * To run a mutation, you first call `useFlowExportTemplateXlsxMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowExportTemplateXlsxMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowExportTemplateXlsxMutation, { data, loading, error }] = useFlowExportTemplateXlsxMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowExportTemplateXlsxMutation(baseOptions?: Apollo.MutationHookOptions<FlowExportTemplateXlsxMutation, FlowExportTemplateXlsxMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowExportTemplateXlsxMutation, FlowExportTemplateXlsxMutationVariables>(FlowExportTemplateXlsxDocument, options);
      }
export type FlowExportTemplateXlsxMutationHookResult = ReturnType<typeof useFlowExportTemplateXlsxMutation>;
export type FlowExportTemplateXlsxMutationResult = Apollo.MutationResult<FlowExportTemplateXlsxMutation>;
export type FlowExportTemplateXlsxMutationOptions = Apollo.BaseMutationOptions<FlowExportTemplateXlsxMutation, FlowExportTemplateXlsxMutationVariables>;
export const FlowImportTemplateXlsxDocument = gql`
    mutation FlowImportTemplateXlsx($input: FlowImportTemplateXlsxInput!) {
  flowImportTemplateXlsx(input: $input) {
    ...FlowTemplateFields
  }
}
    ${FlowTemplateFieldsFragmentDoc}`;
export type FlowImportTemplateXlsxMutationFn = Apollo.MutationFunction<FlowImportTemplateXlsxMutation, FlowImportTemplateXlsxMutationVariables>;

/**
 * __useFlowImportTemplateXlsxMutation__
 *
 * To run a mutation, you first call `useFlowImportTemplateXlsxMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFlowImportTemplateXlsxMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [flowImportTemplateXlsxMutation, { data, loading, error }] = useFlowImportTemplateXlsxMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFlowImportTemplateXlsxMutation(baseOptions?: Apollo.MutationHookOptions<FlowImportTemplateXlsxMutation, FlowImportTemplateXlsxMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FlowImportTemplateXlsxMutation, FlowImportTemplateXlsxMutationVariables>(FlowImportTemplateXlsxDocument, options);
      }
export type FlowImportTemplateXlsxMutationHookResult = ReturnType<typeof useFlowImportTemplateXlsxMutation>;
export type FlowImportTemplateXlsxMutationResult = Apollo.MutationResult<FlowImportTemplateXlsxMutation>;
export type FlowImportTemplateXlsxMutationOptions = Apollo.BaseMutationOptions<FlowImportTemplateXlsxMutation, FlowImportTemplateXlsxMutationVariables>;
export const UserCreateFormSchemaDocument = gql`
    query UserCreateFormSchema {
  schema: userCreateFormSchema {
    ...SchemaFormFields
  }
}
    ${SchemaFormFieldsFragmentDoc}`;

/**
 * __useUserCreateFormSchemaQuery__
 *
 * To run a query within a React component, call `useUserCreateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserCreateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserCreateFormSchemaQuery({
 *   variables: {
 *   },
 * });
 */
export function useUserCreateFormSchemaQuery(baseOptions?: Apollo.QueryHookOptions<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>(UserCreateFormSchemaDocument, options);
      }
export function useUserCreateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>(UserCreateFormSchemaDocument, options);
        }
// @ts-ignore
export function useUserCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>;
export function useUserCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<UserCreateFormSchemaQuery | undefined, UserCreateFormSchemaQueryVariables>;
export function useUserCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>(UserCreateFormSchemaDocument, options);
        }
export type UserCreateFormSchemaQueryHookResult = ReturnType<typeof useUserCreateFormSchemaQuery>;
export type UserCreateFormSchemaLazyQueryHookResult = ReturnType<typeof useUserCreateFormSchemaLazyQuery>;
export type UserCreateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useUserCreateFormSchemaSuspenseQuery>;
export type UserCreateFormSchemaQueryResult = Apollo.QueryResult<UserCreateFormSchemaQuery, UserCreateFormSchemaQueryVariables>;
export const UserUpdateFormSchemaDocument = gql`
    query UserUpdateFormSchema($input: SchemaFormUpdateInput!) {
  schema: userUpdateFormSchema(input: $input) {
    ...SchemaFormFields
  }
}
    ${SchemaFormFieldsFragmentDoc}`;

/**
 * __useUserUpdateFormSchemaQuery__
 *
 * To run a query within a React component, call `useUserUpdateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserUpdateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserUpdateFormSchemaQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUserUpdateFormSchemaQuery(baseOptions: Apollo.QueryHookOptions<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables> & ({ variables: UserUpdateFormSchemaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>(UserUpdateFormSchemaDocument, options);
      }
export function useUserUpdateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>(UserUpdateFormSchemaDocument, options);
        }
// @ts-ignore
export function useUserUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>;
export function useUserUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<UserUpdateFormSchemaQuery | undefined, UserUpdateFormSchemaQueryVariables>;
export function useUserUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>(UserUpdateFormSchemaDocument, options);
        }
export type UserUpdateFormSchemaQueryHookResult = ReturnType<typeof useUserUpdateFormSchemaQuery>;
export type UserUpdateFormSchemaLazyQueryHookResult = ReturnType<typeof useUserUpdateFormSchemaLazyQuery>;
export type UserUpdateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useUserUpdateFormSchemaSuspenseQuery>;
export type UserUpdateFormSchemaQueryResult = Apollo.QueryResult<UserUpdateFormSchemaQuery, UserUpdateFormSchemaQueryVariables>;
export const ProjectCreateFormSchemaDocument = gql`
    query ProjectCreateFormSchema {
  schema: projectCreateFormSchema {
    ...SchemaFormFields
  }
}
    ${SchemaFormFieldsFragmentDoc}`;

/**
 * __useProjectCreateFormSchemaQuery__
 *
 * To run a query within a React component, call `useProjectCreateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectCreateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectCreateFormSchemaQuery({
 *   variables: {
 *   },
 * });
 */
export function useProjectCreateFormSchemaQuery(baseOptions?: Apollo.QueryHookOptions<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>(ProjectCreateFormSchemaDocument, options);
      }
export function useProjectCreateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>(ProjectCreateFormSchemaDocument, options);
        }
// @ts-ignore
export function useProjectCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>;
export function useProjectCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectCreateFormSchemaQuery | undefined, ProjectCreateFormSchemaQueryVariables>;
export function useProjectCreateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>(ProjectCreateFormSchemaDocument, options);
        }
export type ProjectCreateFormSchemaQueryHookResult = ReturnType<typeof useProjectCreateFormSchemaQuery>;
export type ProjectCreateFormSchemaLazyQueryHookResult = ReturnType<typeof useProjectCreateFormSchemaLazyQuery>;
export type ProjectCreateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useProjectCreateFormSchemaSuspenseQuery>;
export type ProjectCreateFormSchemaQueryResult = Apollo.QueryResult<ProjectCreateFormSchemaQuery, ProjectCreateFormSchemaQueryVariables>;
export const ProjectUpdateFormSchemaDocument = gql`
    query ProjectUpdateFormSchema($input: SchemaFormUpdateInput!) {
  schema: projectUpdateFormSchema(input: $input) {
    ...SchemaFormFields
  }
}
    ${SchemaFormFieldsFragmentDoc}`;

/**
 * __useProjectUpdateFormSchemaQuery__
 *
 * To run a query within a React component, call `useProjectUpdateFormSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectUpdateFormSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectUpdateFormSchemaQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useProjectUpdateFormSchemaQuery(baseOptions: Apollo.QueryHookOptions<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables> & ({ variables: ProjectUpdateFormSchemaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>(ProjectUpdateFormSchemaDocument, options);
      }
export function useProjectUpdateFormSchemaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>(ProjectUpdateFormSchemaDocument, options);
        }
// @ts-ignore
export function useProjectUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>;
export function useProjectUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectUpdateFormSchemaQuery | undefined, ProjectUpdateFormSchemaQueryVariables>;
export function useProjectUpdateFormSchemaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>(ProjectUpdateFormSchemaDocument, options);
        }
export type ProjectUpdateFormSchemaQueryHookResult = ReturnType<typeof useProjectUpdateFormSchemaQuery>;
export type ProjectUpdateFormSchemaLazyQueryHookResult = ReturnType<typeof useProjectUpdateFormSchemaLazyQuery>;
export type ProjectUpdateFormSchemaSuspenseQueryHookResult = ReturnType<typeof useProjectUpdateFormSchemaSuspenseQuery>;
export type ProjectUpdateFormSchemaQueryResult = Apollo.QueryResult<ProjectUpdateFormSchemaQuery, ProjectUpdateFormSchemaQueryVariables>;
export const CurrentUserDocument = gql`
    query CurrentUser {
  currentUser {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
// @ts-ignore
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<CurrentUserQuery | undefined, CurrentUserQueryVariables>;
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const UsersDocument = gql`
    query Users($input: UserConnectionInput!) {
  users(input: $input) {
    nodes {
      ...UserFields
    }
    pageInfo {
      ...PageInfoFields
    }
  }
}
    ${UserFieldsFragmentDoc}
${PageInfoFieldsFragmentDoc}`;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUsersQuery(baseOptions: Apollo.QueryHookOptions<UsersQuery, UsersQueryVariables> & ({ variables: UsersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
      }
export function useUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UsersQuery, UsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
        }
// @ts-ignore
export function useUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>): Apollo.UseSuspenseQueryResult<UsersQuery, UsersQueryVariables>;
export function useUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>): Apollo.UseSuspenseQueryResult<UsersQuery | undefined, UsersQueryVariables>;
export function useUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
        }
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersSuspenseQueryHookResult = ReturnType<typeof useUsersSuspenseQuery>;
export type UsersQueryResult = Apollo.QueryResult<UsersQuery, UsersQueryVariables>;
export const CreateUserDocument = gql`
    mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const InterpretDocumentDocument = gql`
    mutation InterpretDocument($input: InterpretDocumentInput!) {
  interpretDocument(input: $input) {
    documentType
    title
    summary
    keyPoints
    fields {
      label
      value
    }
    pageCount
  }
}
    `;
export type InterpretDocumentMutationFn = Apollo.MutationFunction<InterpretDocumentMutation, InterpretDocumentMutationVariables>;

/**
 * __useInterpretDocumentMutation__
 *
 * To run a mutation, you first call `useInterpretDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInterpretDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [interpretDocumentMutation, { data, loading, error }] = useInterpretDocumentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useInterpretDocumentMutation(baseOptions?: Apollo.MutationHookOptions<InterpretDocumentMutation, InterpretDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InterpretDocumentMutation, InterpretDocumentMutationVariables>(InterpretDocumentDocument, options);
      }
export type InterpretDocumentMutationHookResult = ReturnType<typeof useInterpretDocumentMutation>;
export type InterpretDocumentMutationResult = Apollo.MutationResult<InterpretDocumentMutation>;
export type InterpretDocumentMutationOptions = Apollo.BaseMutationOptions<InterpretDocumentMutation, InterpretDocumentMutationVariables>;
export const MySubscriptionDocument = gql`
    query MySubscription($productKey: String) {
  mySubscription(productKey: $productKey) {
    ...PaymentSubscriptionFields
  }
}
    ${PaymentSubscriptionFieldsFragmentDoc}`;

/**
 * __useMySubscriptionQuery__
 *
 * To run a query within a React component, call `useMySubscriptionQuery` and pass it any options that fit your needs.
 * When your component renders, `useMySubscriptionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMySubscriptionQuery({
 *   variables: {
 *      productKey: // value for 'productKey'
 *   },
 * });
 */
export function useMySubscriptionQuery(baseOptions?: Apollo.QueryHookOptions<MySubscriptionQuery, MySubscriptionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MySubscriptionQuery, MySubscriptionQueryVariables>(MySubscriptionDocument, options);
      }
export function useMySubscriptionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MySubscriptionQuery, MySubscriptionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MySubscriptionQuery, MySubscriptionQueryVariables>(MySubscriptionDocument, options);
        }
// @ts-ignore
export function useMySubscriptionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MySubscriptionQuery, MySubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<MySubscriptionQuery, MySubscriptionQueryVariables>;
export function useMySubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySubscriptionQuery, MySubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<MySubscriptionQuery | undefined, MySubscriptionQueryVariables>;
export function useMySubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MySubscriptionQuery, MySubscriptionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MySubscriptionQuery, MySubscriptionQueryVariables>(MySubscriptionDocument, options);
        }
export type MySubscriptionQueryHookResult = ReturnType<typeof useMySubscriptionQuery>;
export type MySubscriptionLazyQueryHookResult = ReturnType<typeof useMySubscriptionLazyQuery>;
export type MySubscriptionSuspenseQueryHookResult = ReturnType<typeof useMySubscriptionSuspenseQuery>;
export type MySubscriptionQueryResult = Apollo.QueryResult<MySubscriptionQuery, MySubscriptionQueryVariables>;
export const CreateBillingPortalSessionDocument = gql`
    mutation CreateBillingPortalSession($input: CreateBillingPortalSessionInput!) {
  createBillingPortalSession(input: $input) {
    url
  }
}
    `;
export type CreateBillingPortalSessionMutationFn = Apollo.MutationFunction<CreateBillingPortalSessionMutation, CreateBillingPortalSessionMutationVariables>;

/**
 * __useCreateBillingPortalSessionMutation__
 *
 * To run a mutation, you first call `useCreateBillingPortalSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBillingPortalSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBillingPortalSessionMutation, { data, loading, error }] = useCreateBillingPortalSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBillingPortalSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateBillingPortalSessionMutation, CreateBillingPortalSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateBillingPortalSessionMutation, CreateBillingPortalSessionMutationVariables>(CreateBillingPortalSessionDocument, options);
      }
export type CreateBillingPortalSessionMutationHookResult = ReturnType<typeof useCreateBillingPortalSessionMutation>;
export type CreateBillingPortalSessionMutationResult = Apollo.MutationResult<CreateBillingPortalSessionMutation>;
export type CreateBillingPortalSessionMutationOptions = Apollo.BaseMutationOptions<CreateBillingPortalSessionMutation, CreateBillingPortalSessionMutationVariables>;
export const CancelTestSubscriptionDocument = gql`
    mutation CancelTestSubscription {
  cancelTestSubscription {
    ...PaymentSubscriptionFields
  }
}
    ${PaymentSubscriptionFieldsFragmentDoc}`;
export type CancelTestSubscriptionMutationFn = Apollo.MutationFunction<CancelTestSubscriptionMutation, CancelTestSubscriptionMutationVariables>;

/**
 * __useCancelTestSubscriptionMutation__
 *
 * To run a mutation, you first call `useCancelTestSubscriptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelTestSubscriptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelTestSubscriptionMutation, { data, loading, error }] = useCancelTestSubscriptionMutation({
 *   variables: {
 *   },
 * });
 */
export function useCancelTestSubscriptionMutation(baseOptions?: Apollo.MutationHookOptions<CancelTestSubscriptionMutation, CancelTestSubscriptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelTestSubscriptionMutation, CancelTestSubscriptionMutationVariables>(CancelTestSubscriptionDocument, options);
      }
export type CancelTestSubscriptionMutationHookResult = ReturnType<typeof useCancelTestSubscriptionMutation>;
export type CancelTestSubscriptionMutationResult = Apollo.MutationResult<CancelTestSubscriptionMutation>;
export type CancelTestSubscriptionMutationOptions = Apollo.BaseMutationOptions<CancelTestSubscriptionMutation, CancelTestSubscriptionMutationVariables>;
export const PitchDecksDocument = gql`
    query PitchDecks {
  pitchDecks {
    ...PitchDeckFields
  }
}
    ${PitchDeckFieldsFragmentDoc}`;

/**
 * __usePitchDecksQuery__
 *
 * To run a query within a React component, call `usePitchDecksQuery` and pass it any options that fit your needs.
 * When your component renders, `usePitchDecksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePitchDecksQuery({
 *   variables: {
 *   },
 * });
 */
export function usePitchDecksQuery(baseOptions?: Apollo.QueryHookOptions<PitchDecksQuery, PitchDecksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PitchDecksQuery, PitchDecksQueryVariables>(PitchDecksDocument, options);
      }
export function usePitchDecksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PitchDecksQuery, PitchDecksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PitchDecksQuery, PitchDecksQueryVariables>(PitchDecksDocument, options);
        }
// @ts-ignore
export function usePitchDecksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PitchDecksQuery, PitchDecksQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDecksQuery, PitchDecksQueryVariables>;
export function usePitchDecksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDecksQuery, PitchDecksQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDecksQuery | undefined, PitchDecksQueryVariables>;
export function usePitchDecksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDecksQuery, PitchDecksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PitchDecksQuery, PitchDecksQueryVariables>(PitchDecksDocument, options);
        }
export type PitchDecksQueryHookResult = ReturnType<typeof usePitchDecksQuery>;
export type PitchDecksLazyQueryHookResult = ReturnType<typeof usePitchDecksLazyQuery>;
export type PitchDecksSuspenseQueryHookResult = ReturnType<typeof usePitchDecksSuspenseQuery>;
export type PitchDecksQueryResult = Apollo.QueryResult<PitchDecksQuery, PitchDecksQueryVariables>;
export const PitchDeckOutlineDocument = gql`
    query PitchDeckOutline($deckId: Id!) {
  pitchDeck(deckId: $deckId) {
    ...PitchDeckFields
    slides {
      ...PitchSlideFields
    }
  }
}
    ${PitchDeckFieldsFragmentDoc}
${PitchSlideFieldsFragmentDoc}`;

/**
 * __usePitchDeckOutlineQuery__
 *
 * To run a query within a React component, call `usePitchDeckOutlineQuery` and pass it any options that fit your needs.
 * When your component renders, `usePitchDeckOutlineQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePitchDeckOutlineQuery({
 *   variables: {
 *      deckId: // value for 'deckId'
 *   },
 * });
 */
export function usePitchDeckOutlineQuery(baseOptions: Apollo.QueryHookOptions<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables> & ({ variables: PitchDeckOutlineQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>(PitchDeckOutlineDocument, options);
      }
export function usePitchDeckOutlineLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>(PitchDeckOutlineDocument, options);
        }
// @ts-ignore
export function usePitchDeckOutlineSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>;
export function usePitchDeckOutlineSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDeckOutlineQuery | undefined, PitchDeckOutlineQueryVariables>;
export function usePitchDeckOutlineSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>(PitchDeckOutlineDocument, options);
        }
export type PitchDeckOutlineQueryHookResult = ReturnType<typeof usePitchDeckOutlineQuery>;
export type PitchDeckOutlineLazyQueryHookResult = ReturnType<typeof usePitchDeckOutlineLazyQuery>;
export type PitchDeckOutlineSuspenseQueryHookResult = ReturnType<typeof usePitchDeckOutlineSuspenseQuery>;
export type PitchDeckOutlineQueryResult = Apollo.QueryResult<PitchDeckOutlineQuery, PitchDeckOutlineQueryVariables>;
export const PitchDeckDataDocument = gql`
    query PitchDeckData {
  pitchDeckData {
    companyName
    currency
    revenueSeries {
      ...PitchSeriesPointFields
    }
    expenseSeries {
      ...PitchSeriesPointFields
    }
    netIncomeSeries {
      ...PitchSeriesPointFields
    }
    cashSeries {
      ...PitchSeriesPointFields
    }
    revenueGrowthPercent
    netMarginPercent
    averageNetIncomeMinorUnits
    latestCashMinorUnits
    runwayMonths
    trailingTwelveMonthRevenueMinorUnits
    customerCount
    paidInvoiceCount
  }
}
    ${PitchSeriesPointFieldsFragmentDoc}`;

/**
 * __usePitchDeckDataQuery__
 *
 * To run a query within a React component, call `usePitchDeckDataQuery` and pass it any options that fit your needs.
 * When your component renders, `usePitchDeckDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePitchDeckDataQuery({
 *   variables: {
 *   },
 * });
 */
export function usePitchDeckDataQuery(baseOptions?: Apollo.QueryHookOptions<PitchDeckDataQuery, PitchDeckDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PitchDeckDataQuery, PitchDeckDataQueryVariables>(PitchDeckDataDocument, options);
      }
export function usePitchDeckDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PitchDeckDataQuery, PitchDeckDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PitchDeckDataQuery, PitchDeckDataQueryVariables>(PitchDeckDataDocument, options);
        }
// @ts-ignore
export function usePitchDeckDataSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PitchDeckDataQuery, PitchDeckDataQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDeckDataQuery, PitchDeckDataQueryVariables>;
export function usePitchDeckDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDeckDataQuery, PitchDeckDataQueryVariables>): Apollo.UseSuspenseQueryResult<PitchDeckDataQuery | undefined, PitchDeckDataQueryVariables>;
export function usePitchDeckDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PitchDeckDataQuery, PitchDeckDataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PitchDeckDataQuery, PitchDeckDataQueryVariables>(PitchDeckDataDocument, options);
        }
export type PitchDeckDataQueryHookResult = ReturnType<typeof usePitchDeckDataQuery>;
export type PitchDeckDataLazyQueryHookResult = ReturnType<typeof usePitchDeckDataLazyQuery>;
export type PitchDeckDataSuspenseQueryHookResult = ReturnType<typeof usePitchDeckDataSuspenseQuery>;
export type PitchDeckDataQueryResult = Apollo.QueryResult<PitchDeckDataQuery, PitchDeckDataQueryVariables>;
export const PitchCreateDeckDocument = gql`
    mutation PitchCreateDeck($input: PitchCreateDeckInput!) {
  pitchCreateDeck(input: $input) {
    ...PitchDeckFields
  }
}
    ${PitchDeckFieldsFragmentDoc}`;
export type PitchCreateDeckMutationFn = Apollo.MutationFunction<PitchCreateDeckMutation, PitchCreateDeckMutationVariables>;

/**
 * __usePitchCreateDeckMutation__
 *
 * To run a mutation, you first call `usePitchCreateDeckMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePitchCreateDeckMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pitchCreateDeckMutation, { data, loading, error }] = usePitchCreateDeckMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePitchCreateDeckMutation(baseOptions?: Apollo.MutationHookOptions<PitchCreateDeckMutation, PitchCreateDeckMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PitchCreateDeckMutation, PitchCreateDeckMutationVariables>(PitchCreateDeckDocument, options);
      }
export type PitchCreateDeckMutationHookResult = ReturnType<typeof usePitchCreateDeckMutation>;
export type PitchCreateDeckMutationResult = Apollo.MutationResult<PitchCreateDeckMutation>;
export type PitchCreateDeckMutationOptions = Apollo.BaseMutationOptions<PitchCreateDeckMutation, PitchCreateDeckMutationVariables>;
export const PitchUpdateDeckDocument = gql`
    mutation PitchUpdateDeck($input: PitchUpdateDeckInput!) {
  pitchUpdateDeck(input: $input) {
    ...PitchDeckFields
  }
}
    ${PitchDeckFieldsFragmentDoc}`;
export type PitchUpdateDeckMutationFn = Apollo.MutationFunction<PitchUpdateDeckMutation, PitchUpdateDeckMutationVariables>;

/**
 * __usePitchUpdateDeckMutation__
 *
 * To run a mutation, you first call `usePitchUpdateDeckMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePitchUpdateDeckMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pitchUpdateDeckMutation, { data, loading, error }] = usePitchUpdateDeckMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePitchUpdateDeckMutation(baseOptions?: Apollo.MutationHookOptions<PitchUpdateDeckMutation, PitchUpdateDeckMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PitchUpdateDeckMutation, PitchUpdateDeckMutationVariables>(PitchUpdateDeckDocument, options);
      }
export type PitchUpdateDeckMutationHookResult = ReturnType<typeof usePitchUpdateDeckMutation>;
export type PitchUpdateDeckMutationResult = Apollo.MutationResult<PitchUpdateDeckMutation>;
export type PitchUpdateDeckMutationOptions = Apollo.BaseMutationOptions<PitchUpdateDeckMutation, PitchUpdateDeckMutationVariables>;
export const PitchDeleteDeckDocument = gql`
    mutation PitchDeleteDeck($input: PitchDeleteDeckInput!) {
  pitchDeleteDeck(input: $input)
}
    `;
export type PitchDeleteDeckMutationFn = Apollo.MutationFunction<PitchDeleteDeckMutation, PitchDeleteDeckMutationVariables>;

/**
 * __usePitchDeleteDeckMutation__
 *
 * To run a mutation, you first call `usePitchDeleteDeckMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePitchDeleteDeckMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pitchDeleteDeckMutation, { data, loading, error }] = usePitchDeleteDeckMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePitchDeleteDeckMutation(baseOptions?: Apollo.MutationHookOptions<PitchDeleteDeckMutation, PitchDeleteDeckMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PitchDeleteDeckMutation, PitchDeleteDeckMutationVariables>(PitchDeleteDeckDocument, options);
      }
export type PitchDeleteDeckMutationHookResult = ReturnType<typeof usePitchDeleteDeckMutation>;
export type PitchDeleteDeckMutationResult = Apollo.MutationResult<PitchDeleteDeckMutation>;
export type PitchDeleteDeckMutationOptions = Apollo.BaseMutationOptions<PitchDeleteDeckMutation, PitchDeleteDeckMutationVariables>;
export const PitchUpdateSlideDocument = gql`
    mutation PitchUpdateSlide($input: PitchUpdateSlideInput!) {
  pitchUpdateSlide(input: $input) {
    ...PitchSlideFields
  }
}
    ${PitchSlideFieldsFragmentDoc}`;
export type PitchUpdateSlideMutationFn = Apollo.MutationFunction<PitchUpdateSlideMutation, PitchUpdateSlideMutationVariables>;

/**
 * __usePitchUpdateSlideMutation__
 *
 * To run a mutation, you first call `usePitchUpdateSlideMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePitchUpdateSlideMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pitchUpdateSlideMutation, { data, loading, error }] = usePitchUpdateSlideMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePitchUpdateSlideMutation(baseOptions?: Apollo.MutationHookOptions<PitchUpdateSlideMutation, PitchUpdateSlideMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PitchUpdateSlideMutation, PitchUpdateSlideMutationVariables>(PitchUpdateSlideDocument, options);
      }
export type PitchUpdateSlideMutationHookResult = ReturnType<typeof usePitchUpdateSlideMutation>;
export type PitchUpdateSlideMutationResult = Apollo.MutationResult<PitchUpdateSlideMutation>;
export type PitchUpdateSlideMutationOptions = Apollo.BaseMutationOptions<PitchUpdateSlideMutation, PitchUpdateSlideMutationVariables>;
export const PitchExportDeckPdfDocument = gql`
    mutation PitchExportDeckPdf($input: PitchExportDeckPdfInput!) {
  pitchExportDeckPdf(input: $input) {
    id
    fileName
  }
}
    `;
export type PitchExportDeckPdfMutationFn = Apollo.MutationFunction<PitchExportDeckPdfMutation, PitchExportDeckPdfMutationVariables>;

/**
 * __usePitchExportDeckPdfMutation__
 *
 * To run a mutation, you first call `usePitchExportDeckPdfMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePitchExportDeckPdfMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pitchExportDeckPdfMutation, { data, loading, error }] = usePitchExportDeckPdfMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePitchExportDeckPdfMutation(baseOptions?: Apollo.MutationHookOptions<PitchExportDeckPdfMutation, PitchExportDeckPdfMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PitchExportDeckPdfMutation, PitchExportDeckPdfMutationVariables>(PitchExportDeckPdfDocument, options);
      }
export type PitchExportDeckPdfMutationHookResult = ReturnType<typeof usePitchExportDeckPdfMutation>;
export type PitchExportDeckPdfMutationResult = Apollo.MutationResult<PitchExportDeckPdfMutation>;
export type PitchExportDeckPdfMutationOptions = Apollo.BaseMutationOptions<PitchExportDeckPdfMutation, PitchExportDeckPdfMutationVariables>;
export const ProjectsDocument = gql`
    query Projects($input: ProjectConnectionInput!) {
  projects(input: $input) {
    nodes {
      ...ProjectFields
    }
    pageInfo {
      ...PageInfoFields
    }
  }
}
    ${ProjectFieldsFragmentDoc}
${PageInfoFieldsFragmentDoc}`;

/**
 * __useProjectsQuery__
 *
 * To run a query within a React component, call `useProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useProjectsQuery(baseOptions: Apollo.QueryHookOptions<ProjectsQuery, ProjectsQueryVariables> & ({ variables: ProjectsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectsQuery, ProjectsQueryVariables>(ProjectsDocument, options);
      }
export function useProjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectsQuery, ProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectsQuery, ProjectsQueryVariables>(ProjectsDocument, options);
        }
// @ts-ignore
export function useProjectsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProjectsQuery, ProjectsQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectsQuery, ProjectsQueryVariables>;
export function useProjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectsQuery, ProjectsQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectsQuery | undefined, ProjectsQueryVariables>;
export function useProjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectsQuery, ProjectsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProjectsQuery, ProjectsQueryVariables>(ProjectsDocument, options);
        }
export type ProjectsQueryHookResult = ReturnType<typeof useProjectsQuery>;
export type ProjectsLazyQueryHookResult = ReturnType<typeof useProjectsLazyQuery>;
export type ProjectsSuspenseQueryHookResult = ReturnType<typeof useProjectsSuspenseQuery>;
export type ProjectsQueryResult = Apollo.QueryResult<ProjectsQuery, ProjectsQueryVariables>;
export const CreateProjectDocument = gql`
    mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    ...ProjectFields
  }
}
    ${ProjectFieldsFragmentDoc}`;
export type CreateProjectMutationFn = Apollo.MutationFunction<CreateProjectMutation, CreateProjectMutationVariables>;

/**
 * __useCreateProjectMutation__
 *
 * To run a mutation, you first call `useCreateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProjectMutation, { data, loading, error }] = useCreateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProjectMutation(baseOptions?: Apollo.MutationHookOptions<CreateProjectMutation, CreateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, options);
      }
export type CreateProjectMutationHookResult = ReturnType<typeof useCreateProjectMutation>;
export type CreateProjectMutationResult = Apollo.MutationResult<CreateProjectMutation>;
export type CreateProjectMutationOptions = Apollo.BaseMutationOptions<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = gql`
    mutation UpdateProject($input: UpdateProjectInput!) {
  updateProject(input: $input) {
    ...ProjectFields
  }
}
    ${ProjectFieldsFragmentDoc}`;
export type UpdateProjectMutationFn = Apollo.MutationFunction<UpdateProjectMutation, UpdateProjectMutationVariables>;

/**
 * __useUpdateProjectMutation__
 *
 * To run a mutation, you first call `useUpdateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProjectMutation, { data, loading, error }] = useUpdateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProjectMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProjectMutation, UpdateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProjectMutation, UpdateProjectMutationVariables>(UpdateProjectDocument, options);
      }
export type UpdateProjectMutationHookResult = ReturnType<typeof useUpdateProjectMutation>;
export type UpdateProjectMutationResult = Apollo.MutationResult<UpdateProjectMutation>;
export type UpdateProjectMutationOptions = Apollo.BaseMutationOptions<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const ProjectMembersDocument = gql`
    query ProjectMembers($id: Id!) {
  project(id: $id) {
    id
    name
    memberships {
      ...ProjectMembershipFields
    }
  }
}
    ${ProjectMembershipFieldsFragmentDoc}`;

/**
 * __useProjectMembersQuery__
 *
 * To run a query within a React component, call `useProjectMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectMembersQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useProjectMembersQuery(baseOptions: Apollo.QueryHookOptions<ProjectMembersQuery, ProjectMembersQueryVariables> & ({ variables: ProjectMembersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectMembersQuery, ProjectMembersQueryVariables>(ProjectMembersDocument, options);
      }
export function useProjectMembersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectMembersQuery, ProjectMembersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectMembersQuery, ProjectMembersQueryVariables>(ProjectMembersDocument, options);
        }
// @ts-ignore
export function useProjectMembersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProjectMembersQuery, ProjectMembersQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectMembersQuery, ProjectMembersQueryVariables>;
export function useProjectMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectMembersQuery, ProjectMembersQueryVariables>): Apollo.UseSuspenseQueryResult<ProjectMembersQuery | undefined, ProjectMembersQueryVariables>;
export function useProjectMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProjectMembersQuery, ProjectMembersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProjectMembersQuery, ProjectMembersQueryVariables>(ProjectMembersDocument, options);
        }
export type ProjectMembersQueryHookResult = ReturnType<typeof useProjectMembersQuery>;
export type ProjectMembersLazyQueryHookResult = ReturnType<typeof useProjectMembersLazyQuery>;
export type ProjectMembersSuspenseQueryHookResult = ReturnType<typeof useProjectMembersSuspenseQuery>;
export type ProjectMembersQueryResult = Apollo.QueryResult<ProjectMembersQuery, ProjectMembersQueryVariables>;
export const AddProjectMemberDocument = gql`
    mutation AddProjectMember($input: AddProjectMemberInput!) {
  addProjectMember(input: $input) {
    ...ProjectMembershipFields
  }
}
    ${ProjectMembershipFieldsFragmentDoc}`;
export type AddProjectMemberMutationFn = Apollo.MutationFunction<AddProjectMemberMutation, AddProjectMemberMutationVariables>;

/**
 * __useAddProjectMemberMutation__
 *
 * To run a mutation, you first call `useAddProjectMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddProjectMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addProjectMemberMutation, { data, loading, error }] = useAddProjectMemberMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddProjectMemberMutation(baseOptions?: Apollo.MutationHookOptions<AddProjectMemberMutation, AddProjectMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddProjectMemberMutation, AddProjectMemberMutationVariables>(AddProjectMemberDocument, options);
      }
export type AddProjectMemberMutationHookResult = ReturnType<typeof useAddProjectMemberMutation>;
export type AddProjectMemberMutationResult = Apollo.MutationResult<AddProjectMemberMutation>;
export type AddProjectMemberMutationOptions = Apollo.BaseMutationOptions<AddProjectMemberMutation, AddProjectMemberMutationVariables>;
export const UpdateProjectMemberDocument = gql`
    mutation UpdateProjectMember($input: UpdateProjectMemberInput!) {
  updateProjectMember(input: $input) {
    ...ProjectMembershipFields
  }
}
    ${ProjectMembershipFieldsFragmentDoc}`;
export type UpdateProjectMemberMutationFn = Apollo.MutationFunction<UpdateProjectMemberMutation, UpdateProjectMemberMutationVariables>;

/**
 * __useUpdateProjectMemberMutation__
 *
 * To run a mutation, you first call `useUpdateProjectMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProjectMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProjectMemberMutation, { data, loading, error }] = useUpdateProjectMemberMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProjectMemberMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProjectMemberMutation, UpdateProjectMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProjectMemberMutation, UpdateProjectMemberMutationVariables>(UpdateProjectMemberDocument, options);
      }
export type UpdateProjectMemberMutationHookResult = ReturnType<typeof useUpdateProjectMemberMutation>;
export type UpdateProjectMemberMutationResult = Apollo.MutationResult<UpdateProjectMemberMutation>;
export type UpdateProjectMemberMutationOptions = Apollo.BaseMutationOptions<UpdateProjectMemberMutation, UpdateProjectMemberMutationVariables>;
export const RemoveProjectMemberDocument = gql`
    mutation RemoveProjectMember($input: RemoveProjectMemberInput!) {
  removeProjectMember(input: $input)
}
    `;
export type RemoveProjectMemberMutationFn = Apollo.MutationFunction<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>;

/**
 * __useRemoveProjectMemberMutation__
 *
 * To run a mutation, you first call `useRemoveProjectMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveProjectMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeProjectMemberMutation, { data, loading, error }] = useRemoveProjectMemberMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRemoveProjectMemberMutation(baseOptions?: Apollo.MutationHookOptions<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>(RemoveProjectMemberDocument, options);
      }
export type RemoveProjectMemberMutationHookResult = ReturnType<typeof useRemoveProjectMemberMutation>;
export type RemoveProjectMemberMutationResult = Apollo.MutationResult<RemoveProjectMemberMutation>;
export type RemoveProjectMemberMutationOptions = Apollo.BaseMutationOptions<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>;
export const RegisterPushDeviceDocument = gql`
    mutation RegisterPushDevice($input: RegisterPushDeviceInput!) {
  registerPushDevice(input: $input) {
    id
    platform
    endpoint
    createdTime
    rotatedTime
  }
}
    `;
export type RegisterPushDeviceMutationFn = Apollo.MutationFunction<RegisterPushDeviceMutation, RegisterPushDeviceMutationVariables>;

/**
 * __useRegisterPushDeviceMutation__
 *
 * To run a mutation, you first call `useRegisterPushDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterPushDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerPushDeviceMutation, { data, loading, error }] = useRegisterPushDeviceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterPushDeviceMutation(baseOptions?: Apollo.MutationHookOptions<RegisterPushDeviceMutation, RegisterPushDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterPushDeviceMutation, RegisterPushDeviceMutationVariables>(RegisterPushDeviceDocument, options);
      }
export type RegisterPushDeviceMutationHookResult = ReturnType<typeof useRegisterPushDeviceMutation>;
export type RegisterPushDeviceMutationResult = Apollo.MutationResult<RegisterPushDeviceMutation>;
export type RegisterPushDeviceMutationOptions = Apollo.BaseMutationOptions<RegisterPushDeviceMutation, RegisterPushDeviceMutationVariables>;
export const UnregisterPushDeviceDocument = gql`
    mutation UnregisterPushDevice($input: UnregisterPushDeviceInput!) {
  unregisterPushDevice(input: $input)
}
    `;
export type UnregisterPushDeviceMutationFn = Apollo.MutationFunction<UnregisterPushDeviceMutation, UnregisterPushDeviceMutationVariables>;

/**
 * __useUnregisterPushDeviceMutation__
 *
 * To run a mutation, you first call `useUnregisterPushDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnregisterPushDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unregisterPushDeviceMutation, { data, loading, error }] = useUnregisterPushDeviceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUnregisterPushDeviceMutation(baseOptions?: Apollo.MutationHookOptions<UnregisterPushDeviceMutation, UnregisterPushDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UnregisterPushDeviceMutation, UnregisterPushDeviceMutationVariables>(UnregisterPushDeviceDocument, options);
      }
export type UnregisterPushDeviceMutationHookResult = ReturnType<typeof useUnregisterPushDeviceMutation>;
export type UnregisterPushDeviceMutationResult = Apollo.MutationResult<UnregisterPushDeviceMutation>;
export type UnregisterPushDeviceMutationOptions = Apollo.BaseMutationOptions<UnregisterPushDeviceMutation, UnregisterPushDeviceMutationVariables>;
export const QuickBooksStatusDocument = gql`
    query QuickBooksStatus {
  quickBooksStatus {
    connected
    mode
    connection {
      ...QuickBooksConnectionFields
    }
  }
}
    ${QuickBooksConnectionFieldsFragmentDoc}`;

/**
 * __useQuickBooksStatusQuery__
 *
 * To run a query within a React component, call `useQuickBooksStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuickBooksStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuickBooksStatusQuery({
 *   variables: {
 *   },
 * });
 */
export function useQuickBooksStatusQuery(baseOptions?: Apollo.QueryHookOptions<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>(QuickBooksStatusDocument, options);
      }
export function useQuickBooksStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>(QuickBooksStatusDocument, options);
        }
// @ts-ignore
export function useQuickBooksStatusSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>;
export function useQuickBooksStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksStatusQuery | undefined, QuickBooksStatusQueryVariables>;
export function useQuickBooksStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>(QuickBooksStatusDocument, options);
        }
export type QuickBooksStatusQueryHookResult = ReturnType<typeof useQuickBooksStatusQuery>;
export type QuickBooksStatusLazyQueryHookResult = ReturnType<typeof useQuickBooksStatusLazyQuery>;
export type QuickBooksStatusSuspenseQueryHookResult = ReturnType<typeof useQuickBooksStatusSuspenseQuery>;
export type QuickBooksStatusQueryResult = Apollo.QueryResult<QuickBooksStatusQuery, QuickBooksStatusQueryVariables>;
export const QuickBooksCompanySnapshotDocument = gql`
    query QuickBooksCompanySnapshot {
  quickBooksCompanySnapshot {
    companyName
    currency
    revenueMinorUnits
    outstandingMinorUnits
    overdueMinorUnits
    paidInvoiceCount
    openInvoiceCount
    overdueInvoiceCount
    customerCount
  }
}
    `;

/**
 * __useQuickBooksCompanySnapshotQuery__
 *
 * To run a query within a React component, call `useQuickBooksCompanySnapshotQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuickBooksCompanySnapshotQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuickBooksCompanySnapshotQuery({
 *   variables: {
 *   },
 * });
 */
export function useQuickBooksCompanySnapshotQuery(baseOptions?: Apollo.QueryHookOptions<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>(QuickBooksCompanySnapshotDocument, options);
      }
export function useQuickBooksCompanySnapshotLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>(QuickBooksCompanySnapshotDocument, options);
        }
// @ts-ignore
export function useQuickBooksCompanySnapshotSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>;
export function useQuickBooksCompanySnapshotSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksCompanySnapshotQuery | undefined, QuickBooksCompanySnapshotQueryVariables>;
export function useQuickBooksCompanySnapshotSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>(QuickBooksCompanySnapshotDocument, options);
        }
export type QuickBooksCompanySnapshotQueryHookResult = ReturnType<typeof useQuickBooksCompanySnapshotQuery>;
export type QuickBooksCompanySnapshotLazyQueryHookResult = ReturnType<typeof useQuickBooksCompanySnapshotLazyQuery>;
export type QuickBooksCompanySnapshotSuspenseQueryHookResult = ReturnType<typeof useQuickBooksCompanySnapshotSuspenseQuery>;
export type QuickBooksCompanySnapshotQueryResult = Apollo.QueryResult<QuickBooksCompanySnapshotQuery, QuickBooksCompanySnapshotQueryVariables>;
export const QuickBooksCustomersDocument = gql`
    query QuickBooksCustomers {
  quickBooksCustomers {
    id
    displayName
    companyName
    email
    city
    state
    customerSince
    openBalanceMinorUnits
  }
}
    `;

/**
 * __useQuickBooksCustomersQuery__
 *
 * To run a query within a React component, call `useQuickBooksCustomersQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuickBooksCustomersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuickBooksCustomersQuery({
 *   variables: {
 *   },
 * });
 */
export function useQuickBooksCustomersQuery(baseOptions?: Apollo.QueryHookOptions<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>(QuickBooksCustomersDocument, options);
      }
export function useQuickBooksCustomersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>(QuickBooksCustomersDocument, options);
        }
// @ts-ignore
export function useQuickBooksCustomersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>;
export function useQuickBooksCustomersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksCustomersQuery | undefined, QuickBooksCustomersQueryVariables>;
export function useQuickBooksCustomersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>(QuickBooksCustomersDocument, options);
        }
export type QuickBooksCustomersQueryHookResult = ReturnType<typeof useQuickBooksCustomersQuery>;
export type QuickBooksCustomersLazyQueryHookResult = ReturnType<typeof useQuickBooksCustomersLazyQuery>;
export type QuickBooksCustomersSuspenseQueryHookResult = ReturnType<typeof useQuickBooksCustomersSuspenseQuery>;
export type QuickBooksCustomersQueryResult = Apollo.QueryResult<QuickBooksCustomersQuery, QuickBooksCustomersQueryVariables>;
export const QuickBooksInvoicesDocument = gql`
    query QuickBooksInvoices($input: QuickBooksInvoicesInput) {
  quickBooksInvoices(input: $input) {
    id
    docNumber
    customerId
    customerName
    status
    issueDate
    dueDate
    totalMinorUnits
    balanceMinorUnits
  }
}
    `;

/**
 * __useQuickBooksInvoicesQuery__
 *
 * To run a query within a React component, call `useQuickBooksInvoicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuickBooksInvoicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuickBooksInvoicesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useQuickBooksInvoicesQuery(baseOptions?: Apollo.QueryHookOptions<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>(QuickBooksInvoicesDocument, options);
      }
export function useQuickBooksInvoicesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>(QuickBooksInvoicesDocument, options);
        }
// @ts-ignore
export function useQuickBooksInvoicesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>;
export function useQuickBooksInvoicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>): Apollo.UseSuspenseQueryResult<QuickBooksInvoicesQuery | undefined, QuickBooksInvoicesQueryVariables>;
export function useQuickBooksInvoicesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>(QuickBooksInvoicesDocument, options);
        }
export type QuickBooksInvoicesQueryHookResult = ReturnType<typeof useQuickBooksInvoicesQuery>;
export type QuickBooksInvoicesLazyQueryHookResult = ReturnType<typeof useQuickBooksInvoicesLazyQuery>;
export type QuickBooksInvoicesSuspenseQueryHookResult = ReturnType<typeof useQuickBooksInvoicesSuspenseQuery>;
export type QuickBooksInvoicesQueryResult = Apollo.QueryResult<QuickBooksInvoicesQuery, QuickBooksInvoicesQueryVariables>;
export const ConnectQuickBooksDocument = gql`
    mutation ConnectQuickBooks($input: ConnectQuickBooksInput!) {
  connectQuickBooks(input: $input) {
    ...QuickBooksConnectionFields
  }
}
    ${QuickBooksConnectionFieldsFragmentDoc}`;
export type ConnectQuickBooksMutationFn = Apollo.MutationFunction<ConnectQuickBooksMutation, ConnectQuickBooksMutationVariables>;

/**
 * __useConnectQuickBooksMutation__
 *
 * To run a mutation, you first call `useConnectQuickBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConnectQuickBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [connectQuickBooksMutation, { data, loading, error }] = useConnectQuickBooksMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConnectQuickBooksMutation(baseOptions?: Apollo.MutationHookOptions<ConnectQuickBooksMutation, ConnectQuickBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ConnectQuickBooksMutation, ConnectQuickBooksMutationVariables>(ConnectQuickBooksDocument, options);
      }
export type ConnectQuickBooksMutationHookResult = ReturnType<typeof useConnectQuickBooksMutation>;
export type ConnectQuickBooksMutationResult = Apollo.MutationResult<ConnectQuickBooksMutation>;
export type ConnectQuickBooksMutationOptions = Apollo.BaseMutationOptions<ConnectQuickBooksMutation, ConnectQuickBooksMutationVariables>;
export const DisconnectQuickBooksDocument = gql`
    mutation DisconnectQuickBooks {
  disconnectQuickBooks
}
    `;
export type DisconnectQuickBooksMutationFn = Apollo.MutationFunction<DisconnectQuickBooksMutation, DisconnectQuickBooksMutationVariables>;

/**
 * __useDisconnectQuickBooksMutation__
 *
 * To run a mutation, you first call `useDisconnectQuickBooksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisconnectQuickBooksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disconnectQuickBooksMutation, { data, loading, error }] = useDisconnectQuickBooksMutation({
 *   variables: {
 *   },
 * });
 */
export function useDisconnectQuickBooksMutation(baseOptions?: Apollo.MutationHookOptions<DisconnectQuickBooksMutation, DisconnectQuickBooksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DisconnectQuickBooksMutation, DisconnectQuickBooksMutationVariables>(DisconnectQuickBooksDocument, options);
      }
export type DisconnectQuickBooksMutationHookResult = ReturnType<typeof useDisconnectQuickBooksMutation>;
export type DisconnectQuickBooksMutationResult = Apollo.MutationResult<DisconnectQuickBooksMutation>;
export type DisconnectQuickBooksMutationOptions = Apollo.BaseMutationOptions<DisconnectQuickBooksMutation, DisconnectQuickBooksMutationVariables>;
export const BeginQuickBooksAuthorizationDocument = gql`
    mutation BeginQuickBooksAuthorization($input: BeginQuickBooksAuthorizationInput!) {
  beginQuickBooksAuthorization(input: $input) {
    authorizationUrl
  }
}
    `;
export type BeginQuickBooksAuthorizationMutationFn = Apollo.MutationFunction<BeginQuickBooksAuthorizationMutation, BeginQuickBooksAuthorizationMutationVariables>;

/**
 * __useBeginQuickBooksAuthorizationMutation__
 *
 * To run a mutation, you first call `useBeginQuickBooksAuthorizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBeginQuickBooksAuthorizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [beginQuickBooksAuthorizationMutation, { data, loading, error }] = useBeginQuickBooksAuthorizationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBeginQuickBooksAuthorizationMutation(baseOptions?: Apollo.MutationHookOptions<BeginQuickBooksAuthorizationMutation, BeginQuickBooksAuthorizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BeginQuickBooksAuthorizationMutation, BeginQuickBooksAuthorizationMutationVariables>(BeginQuickBooksAuthorizationDocument, options);
      }
export type BeginQuickBooksAuthorizationMutationHookResult = ReturnType<typeof useBeginQuickBooksAuthorizationMutation>;
export type BeginQuickBooksAuthorizationMutationResult = Apollo.MutationResult<BeginQuickBooksAuthorizationMutation>;
export type BeginQuickBooksAuthorizationMutationOptions = Apollo.BaseMutationOptions<BeginQuickBooksAuthorizationMutation, BeginQuickBooksAuthorizationMutationVariables>;
export const CompleteQuickBooksAuthorizationDocument = gql`
    mutation CompleteQuickBooksAuthorization($input: CompleteQuickBooksAuthorizationInput!) {
  completeQuickBooksAuthorization(input: $input) {
    ...QuickBooksConnectionFields
  }
}
    ${QuickBooksConnectionFieldsFragmentDoc}`;
export type CompleteQuickBooksAuthorizationMutationFn = Apollo.MutationFunction<CompleteQuickBooksAuthorizationMutation, CompleteQuickBooksAuthorizationMutationVariables>;

/**
 * __useCompleteQuickBooksAuthorizationMutation__
 *
 * To run a mutation, you first call `useCompleteQuickBooksAuthorizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteQuickBooksAuthorizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeQuickBooksAuthorizationMutation, { data, loading, error }] = useCompleteQuickBooksAuthorizationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCompleteQuickBooksAuthorizationMutation(baseOptions?: Apollo.MutationHookOptions<CompleteQuickBooksAuthorizationMutation, CompleteQuickBooksAuthorizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CompleteQuickBooksAuthorizationMutation, CompleteQuickBooksAuthorizationMutationVariables>(CompleteQuickBooksAuthorizationDocument, options);
      }
export type CompleteQuickBooksAuthorizationMutationHookResult = ReturnType<typeof useCompleteQuickBooksAuthorizationMutation>;
export type CompleteQuickBooksAuthorizationMutationResult = Apollo.MutationResult<CompleteQuickBooksAuthorizationMutation>;
export type CompleteQuickBooksAuthorizationMutationOptions = Apollo.BaseMutationOptions<CompleteQuickBooksAuthorizationMutation, CompleteQuickBooksAuthorizationMutationVariables>;
export const CreateSubscriptionCheckoutSessionDocument = gql`
    mutation CreateSubscriptionCheckoutSession($input: CreateSubscriptionCheckoutSessionInput!) {
  createSubscriptionCheckoutSession(input: $input) {
    ...CheckoutSessionFields
  }
}
    ${CheckoutSessionFieldsFragmentDoc}`;
export type CreateSubscriptionCheckoutSessionMutationFn = Apollo.MutationFunction<CreateSubscriptionCheckoutSessionMutation, CreateSubscriptionCheckoutSessionMutationVariables>;

/**
 * __useCreateSubscriptionCheckoutSessionMutation__
 *
 * To run a mutation, you first call `useCreateSubscriptionCheckoutSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubscriptionCheckoutSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubscriptionCheckoutSessionMutation, { data, loading, error }] = useCreateSubscriptionCheckoutSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSubscriptionCheckoutSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateSubscriptionCheckoutSessionMutation, CreateSubscriptionCheckoutSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSubscriptionCheckoutSessionMutation, CreateSubscriptionCheckoutSessionMutationVariables>(CreateSubscriptionCheckoutSessionDocument, options);
      }
export type CreateSubscriptionCheckoutSessionMutationHookResult = ReturnType<typeof useCreateSubscriptionCheckoutSessionMutation>;
export type CreateSubscriptionCheckoutSessionMutationResult = Apollo.MutationResult<CreateSubscriptionCheckoutSessionMutation>;
export type CreateSubscriptionCheckoutSessionMutationOptions = Apollo.BaseMutationOptions<CreateSubscriptionCheckoutSessionMutation, CreateSubscriptionCheckoutSessionMutationVariables>;
export const ShopProductDocument = gql`
    query ShopProduct {
  shopProduct {
    key
    name
    tagline
    priceMinorUnits
    currency
  }
}
    `;

/**
 * __useShopProductQuery__
 *
 * To run a query within a React component, call `useShopProductQuery` and pass it any options that fit your needs.
 * When your component renders, `useShopProductQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useShopProductQuery({
 *   variables: {
 *   },
 * });
 */
export function useShopProductQuery(baseOptions?: Apollo.QueryHookOptions<ShopProductQuery, ShopProductQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ShopProductQuery, ShopProductQueryVariables>(ShopProductDocument, options);
      }
export function useShopProductLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ShopProductQuery, ShopProductQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ShopProductQuery, ShopProductQueryVariables>(ShopProductDocument, options);
        }
// @ts-ignore
export function useShopProductSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ShopProductQuery, ShopProductQueryVariables>): Apollo.UseSuspenseQueryResult<ShopProductQuery, ShopProductQueryVariables>;
export function useShopProductSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ShopProductQuery, ShopProductQueryVariables>): Apollo.UseSuspenseQueryResult<ShopProductQuery | undefined, ShopProductQueryVariables>;
export function useShopProductSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ShopProductQuery, ShopProductQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ShopProductQuery, ShopProductQueryVariables>(ShopProductDocument, options);
        }
export type ShopProductQueryHookResult = ReturnType<typeof useShopProductQuery>;
export type ShopProductLazyQueryHookResult = ReturnType<typeof useShopProductLazyQuery>;
export type ShopProductSuspenseQueryHookResult = ReturnType<typeof useShopProductSuspenseQuery>;
export type ShopProductQueryResult = Apollo.QueryResult<ShopProductQuery, ShopProductQueryVariables>;
export const ShopProductsDocument = gql`
    query ShopProducts {
  shopProducts {
    key
    name
    tagline
    priceMinorUnits
    currency
  }
}
    `;

/**
 * __useShopProductsQuery__
 *
 * To run a query within a React component, call `useShopProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useShopProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useShopProductsQuery({
 *   variables: {
 *   },
 * });
 */
export function useShopProductsQuery(baseOptions?: Apollo.QueryHookOptions<ShopProductsQuery, ShopProductsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ShopProductsQuery, ShopProductsQueryVariables>(ShopProductsDocument, options);
      }
export function useShopProductsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ShopProductsQuery, ShopProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ShopProductsQuery, ShopProductsQueryVariables>(ShopProductsDocument, options);
        }
// @ts-ignore
export function useShopProductsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ShopProductsQuery, ShopProductsQueryVariables>): Apollo.UseSuspenseQueryResult<ShopProductsQuery, ShopProductsQueryVariables>;
export function useShopProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ShopProductsQuery, ShopProductsQueryVariables>): Apollo.UseSuspenseQueryResult<ShopProductsQuery | undefined, ShopProductsQueryVariables>;
export function useShopProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ShopProductsQuery, ShopProductsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ShopProductsQuery, ShopProductsQueryVariables>(ShopProductsDocument, options);
        }
export type ShopProductsQueryHookResult = ReturnType<typeof useShopProductsQuery>;
export type ShopProductsLazyQueryHookResult = ReturnType<typeof useShopProductsLazyQuery>;
export type ShopProductsSuspenseQueryHookResult = ReturnType<typeof useShopProductsSuspenseQuery>;
export type ShopProductsQueryResult = Apollo.QueryResult<ShopProductsQuery, ShopProductsQueryVariables>;
export const CheckoutSessionDocument = gql`
    query CheckoutSession($id: Id!) {
  checkoutSession(id: $id) {
    ...CheckoutSessionFields
  }
}
    ${CheckoutSessionFieldsFragmentDoc}`;

/**
 * __useCheckoutSessionQuery__
 *
 * To run a query within a React component, call `useCheckoutSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useCheckoutSessionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckoutSessionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCheckoutSessionQuery(baseOptions: Apollo.QueryHookOptions<CheckoutSessionQuery, CheckoutSessionQueryVariables> & ({ variables: CheckoutSessionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CheckoutSessionQuery, CheckoutSessionQueryVariables>(CheckoutSessionDocument, options);
      }
export function useCheckoutSessionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CheckoutSessionQuery, CheckoutSessionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CheckoutSessionQuery, CheckoutSessionQueryVariables>(CheckoutSessionDocument, options);
        }
// @ts-ignore
export function useCheckoutSessionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CheckoutSessionQuery, CheckoutSessionQueryVariables>): Apollo.UseSuspenseQueryResult<CheckoutSessionQuery, CheckoutSessionQueryVariables>;
export function useCheckoutSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CheckoutSessionQuery, CheckoutSessionQueryVariables>): Apollo.UseSuspenseQueryResult<CheckoutSessionQuery | undefined, CheckoutSessionQueryVariables>;
export function useCheckoutSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CheckoutSessionQuery, CheckoutSessionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CheckoutSessionQuery, CheckoutSessionQueryVariables>(CheckoutSessionDocument, options);
        }
export type CheckoutSessionQueryHookResult = ReturnType<typeof useCheckoutSessionQuery>;
export type CheckoutSessionLazyQueryHookResult = ReturnType<typeof useCheckoutSessionLazyQuery>;
export type CheckoutSessionSuspenseQueryHookResult = ReturnType<typeof useCheckoutSessionSuspenseQuery>;
export type CheckoutSessionQueryResult = Apollo.QueryResult<CheckoutSessionQuery, CheckoutSessionQueryVariables>;
export const CreateCheckoutSessionDocument = gql`
    mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
  createCheckoutSession(input: $input) {
    ...CheckoutSessionFields
  }
}
    ${CheckoutSessionFieldsFragmentDoc}`;
export type CreateCheckoutSessionMutationFn = Apollo.MutationFunction<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;

/**
 * __useCreateCheckoutSessionMutation__
 *
 * To run a mutation, you first call `useCreateCheckoutSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCheckoutSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCheckoutSessionMutation, { data, loading, error }] = useCreateCheckoutSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCheckoutSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>(CreateCheckoutSessionDocument, options);
      }
export type CreateCheckoutSessionMutationHookResult = ReturnType<typeof useCreateCheckoutSessionMutation>;
export type CreateCheckoutSessionMutationResult = Apollo.MutationResult<CreateCheckoutSessionMutation>;
export type CreateCheckoutSessionMutationOptions = Apollo.BaseMutationOptions<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;
export const CompleteTestCheckoutSessionDocument = gql`
    mutation CompleteTestCheckoutSession($input: CompleteTestCheckoutSessionInput!) {
  completeTestCheckoutSession(input: $input) {
    ...CheckoutSessionFields
  }
}
    ${CheckoutSessionFieldsFragmentDoc}`;
export type CompleteTestCheckoutSessionMutationFn = Apollo.MutationFunction<CompleteTestCheckoutSessionMutation, CompleteTestCheckoutSessionMutationVariables>;

/**
 * __useCompleteTestCheckoutSessionMutation__
 *
 * To run a mutation, you first call `useCompleteTestCheckoutSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteTestCheckoutSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeTestCheckoutSessionMutation, { data, loading, error }] = useCompleteTestCheckoutSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCompleteTestCheckoutSessionMutation(baseOptions?: Apollo.MutationHookOptions<CompleteTestCheckoutSessionMutation, CompleteTestCheckoutSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CompleteTestCheckoutSessionMutation, CompleteTestCheckoutSessionMutationVariables>(CompleteTestCheckoutSessionDocument, options);
      }
export type CompleteTestCheckoutSessionMutationHookResult = ReturnType<typeof useCompleteTestCheckoutSessionMutation>;
export type CompleteTestCheckoutSessionMutationResult = Apollo.MutationResult<CompleteTestCheckoutSessionMutation>;
export type CompleteTestCheckoutSessionMutationOptions = Apollo.BaseMutationOptions<CompleteTestCheckoutSessionMutation, CompleteTestCheckoutSessionMutationVariables>;
export const SongsDocument = gql`
    query Songs($input: SongConnectionInput!) {
  songs(input: $input) {
    nodes {
      ...SongFields
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
  }
}
    ${SongFieldsFragmentDoc}`;

/**
 * __useSongsQuery__
 *
 * To run a query within a React component, call `useSongsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSongsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSongsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSongsQuery(baseOptions: Apollo.QueryHookOptions<SongsQuery, SongsQueryVariables> & ({ variables: SongsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SongsQuery, SongsQueryVariables>(SongsDocument, options);
      }
export function useSongsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SongsQuery, SongsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SongsQuery, SongsQueryVariables>(SongsDocument, options);
        }
// @ts-ignore
export function useSongsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SongsQuery, SongsQueryVariables>): Apollo.UseSuspenseQueryResult<SongsQuery, SongsQueryVariables>;
export function useSongsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SongsQuery, SongsQueryVariables>): Apollo.UseSuspenseQueryResult<SongsQuery | undefined, SongsQueryVariables>;
export function useSongsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SongsQuery, SongsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SongsQuery, SongsQueryVariables>(SongsDocument, options);
        }
export type SongsQueryHookResult = ReturnType<typeof useSongsQuery>;
export type SongsLazyQueryHookResult = ReturnType<typeof useSongsLazyQuery>;
export type SongsSuspenseQueryHookResult = ReturnType<typeof useSongsSuspenseQuery>;
export type SongsQueryResult = Apollo.QueryResult<SongsQuery, SongsQueryVariables>;
export const CreateSongDocument = gql`
    mutation CreateSong($input: CreateSongInput!) {
  createSong(input: $input) {
    ...SongFields
  }
}
    ${SongFieldsFragmentDoc}`;
export type CreateSongMutationFn = Apollo.MutationFunction<CreateSongMutation, CreateSongMutationVariables>;

/**
 * __useCreateSongMutation__
 *
 * To run a mutation, you first call `useCreateSongMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSongMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSongMutation, { data, loading, error }] = useCreateSongMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSongMutation(baseOptions?: Apollo.MutationHookOptions<CreateSongMutation, CreateSongMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSongMutation, CreateSongMutationVariables>(CreateSongDocument, options);
      }
export type CreateSongMutationHookResult = ReturnType<typeof useCreateSongMutation>;
export type CreateSongMutationResult = Apollo.MutationResult<CreateSongMutation>;
export type CreateSongMutationOptions = Apollo.BaseMutationOptions<CreateSongMutation, CreateSongMutationVariables>;
export const UpdateSongDocument = gql`
    mutation UpdateSong($input: UpdateSongInput!) {
  updateSong(input: $input) {
    ...SongFields
  }
}
    ${SongFieldsFragmentDoc}`;
export type UpdateSongMutationFn = Apollo.MutationFunction<UpdateSongMutation, UpdateSongMutationVariables>;

/**
 * __useUpdateSongMutation__
 *
 * To run a mutation, you first call `useUpdateSongMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSongMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSongMutation, { data, loading, error }] = useUpdateSongMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSongMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSongMutation, UpdateSongMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSongMutation, UpdateSongMutationVariables>(UpdateSongDocument, options);
      }
export type UpdateSongMutationHookResult = ReturnType<typeof useUpdateSongMutation>;
export type UpdateSongMutationResult = Apollo.MutationResult<UpdateSongMutation>;
export type UpdateSongMutationOptions = Apollo.BaseMutationOptions<UpdateSongMutation, UpdateSongMutationVariables>;
export const DeleteSongDocument = gql`
    mutation DeleteSong($input: DeleteSongInput!) {
  deleteSong(input: $input)
}
    `;
export type DeleteSongMutationFn = Apollo.MutationFunction<DeleteSongMutation, DeleteSongMutationVariables>;

/**
 * __useDeleteSongMutation__
 *
 * To run a mutation, you first call `useDeleteSongMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSongMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSongMutation, { data, loading, error }] = useDeleteSongMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteSongMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSongMutation, DeleteSongMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteSongMutation, DeleteSongMutationVariables>(DeleteSongDocument, options);
      }
export type DeleteSongMutationHookResult = ReturnType<typeof useDeleteSongMutation>;
export type DeleteSongMutationResult = Apollo.MutationResult<DeleteSongMutation>;
export type DeleteSongMutationOptions = Apollo.BaseMutationOptions<DeleteSongMutation, DeleteSongMutationVariables>;
export const CreateUploadDocument = gql`
    mutation CreateUpload($input: CreateUploadInput!) {
  createUpload(input: $input) {
    uploadId
    uploadUrl
    headersJson
    upload {
      id
      contentType
      sizeBytes
      visibility
      status
    }
  }
}
    `;
export type CreateUploadMutationFn = Apollo.MutationFunction<CreateUploadMutation, CreateUploadMutationVariables>;

/**
 * __useCreateUploadMutation__
 *
 * To run a mutation, you first call `useCreateUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUploadMutation, { data, loading, error }] = useCreateUploadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUploadMutation(baseOptions?: Apollo.MutationHookOptions<CreateUploadMutation, CreateUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUploadMutation, CreateUploadMutationVariables>(CreateUploadDocument, options);
      }
export type CreateUploadMutationHookResult = ReturnType<typeof useCreateUploadMutation>;
export type CreateUploadMutationResult = Apollo.MutationResult<CreateUploadMutation>;
export type CreateUploadMutationOptions = Apollo.BaseMutationOptions<CreateUploadMutation, CreateUploadMutationVariables>;
export const FinalizeUploadDocument = gql`
    mutation FinalizeUpload($input: FinalizeUploadInput!) {
  finalizeUpload(input: $input) {
    id
    status
    sizeBytes
  }
}
    `;
export type FinalizeUploadMutationFn = Apollo.MutationFunction<FinalizeUploadMutation, FinalizeUploadMutationVariables>;

/**
 * __useFinalizeUploadMutation__
 *
 * To run a mutation, you first call `useFinalizeUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFinalizeUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [finalizeUploadMutation, { data, loading, error }] = useFinalizeUploadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFinalizeUploadMutation(baseOptions?: Apollo.MutationHookOptions<FinalizeUploadMutation, FinalizeUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<FinalizeUploadMutation, FinalizeUploadMutationVariables>(FinalizeUploadDocument, options);
      }
export type FinalizeUploadMutationHookResult = ReturnType<typeof useFinalizeUploadMutation>;
export type FinalizeUploadMutationResult = Apollo.MutationResult<FinalizeUploadMutation>;
export type FinalizeUploadMutationOptions = Apollo.BaseMutationOptions<FinalizeUploadMutation, FinalizeUploadMutationVariables>;
export const DeleteUploadDocument = gql`
    mutation DeleteUpload($input: DeleteUploadInput!) {
  deleteUpload(input: $input)
}
    `;
export type DeleteUploadMutationFn = Apollo.MutationFunction<DeleteUploadMutation, DeleteUploadMutationVariables>;

/**
 * __useDeleteUploadMutation__
 *
 * To run a mutation, you first call `useDeleteUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUploadMutation, { data, loading, error }] = useDeleteUploadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteUploadMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUploadMutation, DeleteUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUploadMutation, DeleteUploadMutationVariables>(DeleteUploadDocument, options);
      }
export type DeleteUploadMutationHookResult = ReturnType<typeof useDeleteUploadMutation>;
export type DeleteUploadMutationResult = Apollo.MutationResult<DeleteUploadMutation>;
export type DeleteUploadMutationOptions = Apollo.BaseMutationOptions<DeleteUploadMutation, DeleteUploadMutationVariables>;
export const FileUrlDocument = gql`
    query FileUrl($uploadId: Id!) {
  fileUrl(uploadId: $uploadId) {
    url
  }
}
    `;

/**
 * __useFileUrlQuery__
 *
 * To run a query within a React component, call `useFileUrlQuery` and pass it any options that fit your needs.
 * When your component renders, `useFileUrlQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFileUrlQuery({
 *   variables: {
 *      uploadId: // value for 'uploadId'
 *   },
 * });
 */
export function useFileUrlQuery(baseOptions: Apollo.QueryHookOptions<FileUrlQuery, FileUrlQueryVariables> & ({ variables: FileUrlQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FileUrlQuery, FileUrlQueryVariables>(FileUrlDocument, options);
      }
export function useFileUrlLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FileUrlQuery, FileUrlQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FileUrlQuery, FileUrlQueryVariables>(FileUrlDocument, options);
        }
// @ts-ignore
export function useFileUrlSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FileUrlQuery, FileUrlQueryVariables>): Apollo.UseSuspenseQueryResult<FileUrlQuery, FileUrlQueryVariables>;
export function useFileUrlSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FileUrlQuery, FileUrlQueryVariables>): Apollo.UseSuspenseQueryResult<FileUrlQuery | undefined, FileUrlQueryVariables>;
export function useFileUrlSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FileUrlQuery, FileUrlQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FileUrlQuery, FileUrlQueryVariables>(FileUrlDocument, options);
        }
export type FileUrlQueryHookResult = ReturnType<typeof useFileUrlQuery>;
export type FileUrlLazyQueryHookResult = ReturnType<typeof useFileUrlLazyQuery>;
export type FileUrlSuspenseQueryHookResult = ReturnType<typeof useFileUrlSuspenseQuery>;
export type FileUrlQueryResult = Apollo.QueryResult<FileUrlQuery, FileUrlQueryVariables>;