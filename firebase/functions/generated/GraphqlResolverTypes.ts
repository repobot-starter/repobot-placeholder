import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { PartiallyResolvedAccount, PartiallyResolvedUser, PartiallyResolvedProject, PartiallyResolvedProjectMembership, PartiallyResolvedCheckoutSession, PartiallyResolvedPurchase, PartiallyResolvedPaymentSubscription, PartiallyResolvedQuickBooksConnection, PartiallyResolvedUpload, PartiallyResolvedPushDevice, PartiallyResolvedCfoMembership, PartiallyResolvedCfoInvite, PartiallyResolvedCfoClient, PartiallyResolvedCreditLc, PartiallyResolvedCreditDocument, PartiallyResolvedFlowTemplate, PartiallyResolvedFlowLine, PartiallyResolvedPitchDeck, PartiallyResolvedPitchSlide, PartiallyResolvedEntryField, PartiallyResolvedEntryRecord, PartiallyResolvedSong, PartiallyResolvedDriveEntry, PartiallyResolvedDriveAlbum } from '../src/Graphql/Resolvers/PartiallyResolved.js';
import { GraphqlRequestContext } from '../src/Graphql/GraphqlServer.js';
export type Maybe<T> = T | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Id: { input: string; output: string; }
  Instant: { input: Date | string; output: Date | string; }
};

export type GqlAccount = {
  __typename?: 'Account';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
};

export type GqlAccountConnection = {
  __typename?: 'AccountConnection';
  nodes: Array<Maybe<GqlAccount>>;
  pageInfo: GqlPageInfo;
};

export type GqlAccountConnectionFilters = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type GqlAccountConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlAccountConnectionFilters>;
};

/** The accounting providers a workspace can connect. Both serve the same simulated dataset in QUICKBOOKS_MODE=local. */
export type GqlAccountingProvider =
  | 'QUICKBOOKS'
  | 'XERO';

export type GqlAddDriveAlbumEntryInput = {
  albumId: Scalars['Id']['input'];
  entryId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type GqlAddProjectMemberFields = {
  projectId: Scalars['Id']['input'];
  role: GqlProjectMembershipRole;
  userId: Scalars['Id']['input'];
};

export type GqlAddProjectMemberInput = {
  fields: GqlAddProjectMemberFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlAiVoiceSession = {
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

export type GqlBeginQuickBooksAuthorizationInput = {
  /** Where Intuit redirects back after consent (must be registered on the Intuit app). */
  redirectUri: Scalars['String']['input'];
};

export type GqlBillingPortalSession = {
  __typename?: 'BillingPortalSession';
  /** Where to send the user to manage billing: Stripe's Billing Portal, or the in-app test billing page in local mode. */
  url: Scalars['String']['output'];
};

/**
 * One member's books: identity plus the live state of their accounting
 * connection. The advisor reads every client's; a client reads their own.
 * Statement fields resolve lazily — they cost nothing unless selected.
 */
export type GqlCfoClient = {
  __typename?: 'CfoClient';
  /** Trailing thirteen month-end balance sheets; empty until they connect. */
  balanceSheet: Array<GqlQuickBooksBalanceSheetPeriod>;
  /** The member's accounting connection; null until they connect. */
  connection?: Maybe<GqlQuickBooksConnection>;
  membership: GqlCfoMembership;
  /** Trailing thirteen months of P&L; empty until they connect. */
  profitAndLoss: Array<GqlQuickBooksProfitAndLossPeriod>;
  /** Headline numbers for the member's company; null until they connect. */
  snapshot?: Maybe<GqlQuickBooksCompanySnapshot>;
};

export type GqlCfoConnectMyBooksInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which accounting provider to connect; defaults to QUICKBOOKS. */
  provider?: InputMaybe<GqlAccountingProvider>;
};

export type GqlCfoExportClientStatementsXlsxInput = {
  /** Whose books to export: the advisor may pass any client; a client only themself. */
  clientUserId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
  /** Which statements to include; defaults to ALL. */
  statement?: InputMaybe<GqlQuickBooksStatementExportKind>;
};

export type GqlCfoInvite = {
  __typename?: 'CfoInvite';
  /** Lowercased; the invitee signs up with this address to join. */
  email: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  invitedTime: Scalars['Instant']['output'];
  role: GqlCfoRole;
  status: GqlCfoInviteStatus;
};

export type GqlCfoInviteClientInput = {
  email: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  /** Where the invite email's button points (the composed site's /login). */
  signInUrl: Scalars['String']['input'];
  /** The product name for the invite email (the composed site's name). */
  siteName: Scalars['String']['input'];
};

export type GqlCfoInviteStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'REVOKED';

export type GqlCfoMembership = {
  __typename?: 'CfoMembership';
  id: Scalars['Id']['output'];
  joinedTime: Scalars['Instant']['output'];
  role: GqlCfoRole;
  user: GqlUser;
};

export type GqlCfoRevokeInviteInput = {
  inviteId: Scalars['Id']['input'];
};

export type GqlCfoRole =
  | 'ADVISOR'
  | 'CLIENT';

export type GqlCheckoutMode =
  /** A one-off charge (the default; buyers are anonymous). */
  | 'PAYMENT'
  /** Recurring billing; the session belongs to an authenticated user. */
  | 'SUBSCRIPTION';

export type GqlCheckoutProvider =
  /** Sandbox-only simulated checkout (PAYMENTS_MODE=local); no real payment. */
  | 'LOCAL'
  /** Stripe hosted Checkout (PAYMENTS_MODE=stripe). */
  | 'STRIPE';

export type GqlCheckoutSession = {
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
  mode: GqlCheckoutMode;
  /** Product snapshot taken at checkout time. */
  productKey: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  provider: GqlCheckoutProvider;
  /** Recurring billing period; null for one-off payments. */
  recurringInterval?: Maybe<GqlSubscriptionInterval>;
  status: GqlCheckoutSessionStatus;
};

export type GqlCheckoutSessionStatus =
  | 'PAID'
  | 'PENDING';

export type GqlCompleteQuickBooksAuthorizationInput = {
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

export type GqlCompleteTestCheckoutSessionInput = {
  sessionId: Scalars['Id']['input'];
};

export type GqlConnectQuickBooksInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which accounting provider to connect; defaults to QUICKBOOKS. */
  provider?: InputMaybe<GqlAccountingProvider>;
};

export type GqlConnectionInput = {
  pagination: GqlPaginationInput;
  sort: Array<GqlSortOrderInput>;
};

export type GqlCreateAccountFields = {
  name: Scalars['String']['input'];
};

export type GqlCreateAccountInput = {
  fields: GqlCreateAccountFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateBillingPortalSessionInput = {
  /** The web app's origin (window.location.origin); the portal's return URL is built from it. */
  origin: Scalars['String']['input'];
};

export type GqlCreateCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
  /** Which catalog product to charge for; omitted means the storefront's default product. */
  productKey?: InputMaybe<Scalars['String']['input']>;
};

export type GqlCreateCheckoutSessionInput = {
  fields: GqlCreateCheckoutSessionFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateDriveAlbumFields = {
  name: Scalars['String']['input'];
};

export type GqlCreateDriveAlbumInput = {
  fields: GqlCreateDriveAlbumFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateDriveFolderFields = {
  name: Scalars['String']['input'];
  /** The destination folder; null/omitted creates at the library root. */
  parentId?: InputMaybe<Scalars['Id']['input']>;
};

export type GqlCreateDriveFolderInput = {
  fields: GqlCreateDriveFolderFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateEntryFieldFields = {
  fieldType: GqlEntryFieldType;
  label: Scalars['String']['input'];
  /** Choices for SELECT fields; ignored for every other type. */
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GqlCreateEntryFieldInput = {
  fields: GqlCreateEntryFieldFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateEntryRecordFields = {
  valuesJson: Scalars['String']['input'];
};

export type GqlCreateEntryRecordInput = {
  fields: GqlCreateEntryRecordFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateProjectFields = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type GqlCreateProjectInput = {
  fields: GqlCreateProjectFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateSongFields = {
  artist: Scalars['String']['input'];
  chartRank: Scalars['Int']['input'];
  genre: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  streamsBillions?: InputMaybe<Scalars['Float']['input']>;
  title: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};

export type GqlCreateSongInput = {
  fields: GqlCreateSongFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateSubscriptionCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
  /** Which catalog plan to subscribe to; omitted means the default plan. */
  productKey?: InputMaybe<Scalars['String']['input']>;
};

export type GqlCreateSubscriptionCheckoutSessionInput = {
  fields: GqlCreateSubscriptionCheckoutSessionFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateUploadFields = {
  /** Must be on the profile's content-type allowlist (Services/Storage/StorageConfig.ts). */
  contentType: Scalars['String']['input'];
  /** The admission profile; DEFAULT when omitted. */
  profile?: InputMaybe<GqlUploadProfile>;
  /** Declared size; validated against the profile's cap, re-checked at finalize. */
  sizeBytes: Scalars['Int']['input'];
  visibility: GqlUploadVisibility;
};

export type GqlCreateUploadInput = {
  fields: GqlCreateUploadFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreateUserFields = {
  accountId: Scalars['Id']['input'];
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type GqlCreateUserInput = {
  fields: GqlCreateUserFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlCreditAttachDocumentInput = {
  /** The dropped file's name, for the document list. */
  fileName?: InputMaybe<Scalars['String']['input']>;
  idempotencyKey: Scalars['String']['input'];
  lcId: Scalars['Id']['input'];
  /** A READY application/pdf upload (the dropped supporting document). */
  uploadId: Scalars['Id']['input'];
};

export type GqlCreditDeleteLcInput = {
  lcId: Scalars['Id']['input'];
};

/** A supporting document dropped against a letter of credit. */
export type GqlCreditDocument = {
  __typename?: 'CreditDocument';
  amountMinorUnits?: Maybe<Scalars['Int']['output']>;
  attachedTime: Scalars['Instant']['output'];
  /** Lowercase ISO currency code, e.g. "usd"; null when the document states none. */
  currency?: Maybe<Scalars['String']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
  goodsDescription?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  kind: GqlCreditDocumentKind;
  portOfDischarge?: Maybe<Scalars['String']['output']>;
  portOfLoading?: Maybe<Scalars['String']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
  /** The bill of lading's shipped-on-board date, ISO yyyy-mm-dd. */
  shipmentDate?: Maybe<Scalars['String']['output']>;
  uploadId: Scalars['Id']['output'];
};

export type GqlCreditDocumentKind =
  | 'BILL_OF_LADING'
  | 'COMMERCIAL_INVOICE'
  | 'OTHER'
  | 'PACKING_LIST';

/** One check from the discrepancy engine. */
export type GqlCreditFinding = {
  __typename?: 'CreditFinding';
  /** Stable machine code, e.g. AMOUNT_OVER_TOLERANCE. */
  code: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  /** The document the finding is about; null for LC-level checks. */
  documentId?: Maybe<Scalars['Id']['output']>;
  severity: GqlCreditFindingSeverity;
  title: Scalars['String']['output'];
};

export type GqlCreditFindingSeverity =
  | 'DISCREPANCY'
  | 'OK'
  | 'WARNING';

export type GqlCreditIngestLcInput = {
  idempotencyKey: Scalars['String']['input'];
  /** A READY application/pdf upload (the dropped LC). */
  uploadId: Scalars['Id']['input'];
};

/**
 * A letter of credit as ingested from the dropped PDF: the fields the credit
 * desk actually checks. Dates are ISO yyyy-mm-dd; money follows the kernel
 * money rule (integer minor units + ISO currency).
 */
export type GqlCreditLc = {
  __typename?: 'CreditLc';
  amountMinorUnits: Scalars['Int']['output'];
  applicant?: Maybe<Scalars['String']['output']>;
  beneficiary?: Maybe<Scalars['String']['output']>;
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  /** Supporting documents dropped against this credit, oldest first. */
  documents: Array<GqlCreditDocument>;
  /** The field 46A documents-required list. */
  documentsRequired: Array<Scalars['String']['output']>;
  expiryDate: Scalars['String']['output'];
  /** The discrepancy report, worst findings first. Deterministic. */
  findings: Array<GqlCreditFinding>;
  goodsDescription: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  ingestedTime: Scalars['Instant']['output'];
  issueDate?: Maybe<Scalars['String']['output']>;
  issuingBank?: Maybe<Scalars['String']['output']>;
  latestShipmentDate?: Maybe<Scalars['String']['output']>;
  partialShipments: GqlShipmentTerm;
  portOfDischarge?: Maybe<Scalars['String']['output']>;
  portOfLoading?: Maybe<Scalars['String']['output']>;
  /** Field 48: days after shipment the documents must be presented within. */
  presentationPeriodDays?: Maybe<Scalars['Int']['output']>;
  /** Field 20, the documentary credit number. */
  reference: Scalars['String']['output'];
  /** Field 39A plus-side tolerance, whole percent. */
  tolerancePercent: Scalars['Int']['output'];
  transhipment: GqlShipmentTerm;
  /** The source PDF in the storage kernel. */
  uploadId: Scalars['Id']['output'];
};

export type GqlCreditRemoveDocumentInput = {
  documentId: Scalars['Id']['input'];
};

export type GqlDeleteDriveAlbumInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlDeleteDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlDeleteEntryFieldInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlDeleteEntryRecordInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlDeleteSongInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlDeleteUploadInput = {
  uploadId: Scalars['Id']['input'];
};

/** One-shot reading of an uploaded PDF document. */
export type GqlDocumentInterpretation = {
  __typename?: 'DocumentInterpretation';
  /** What kind of document this is, e.g. "Commercial invoice" or "Résumé". */
  documentType: Scalars['String']['output'];
  /** Notable fields worth extracting: parties, dates, amounts, references. */
  fields: Array<GqlInterpretedField>;
  /** The document's most important points, in reading order. */
  keyPoints: Array<Scalars['String']['output']>;
  pageCount: Scalars['Int']['output'];
  /** A plain-language summary, a few sentences. */
  summary: Scalars['String']['output'];
  /** The document's own title, when it states one. */
  title?: Maybe<Scalars['String']['output']>;
};

export type GqlDriveAlbum = {
  __typename?: 'DriveAlbum';
  createdTime: Scalars['Instant']['output'];
  /** How many entries the album holds. */
  entryCount: Scalars['Int']['output'];
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  updatedTime: Scalars['Instant']['output'];
};

export type GqlDriveEntry = {
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
  kind: GqlDriveEntryKind;
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

export type GqlDriveEntryConnection = {
  __typename?: 'DriveEntryConnection';
  nodes: Array<Maybe<GqlDriveEntry>>;
  pageInfo: GqlPageInfo;
};

export type GqlDriveEntryConnectionFilters = {
  /** Entries that appear in this album (owner-checked). */
  albumId?: InputMaybe<Scalars['Id']['input']>;
  /** Children of this folder. Overrides rootOnly. */
  folderId?: InputMaybe<Scalars['Id']['input']>;
  /** True lists the trash; otherwise trashed entries are excluded. */
  inTrash?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<GqlDriveEntryKind>;
  /** When true (and no folderId), only entries at the library root. */
  rootOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-insensitive substring match across name and caption. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** True keeps only starred entries. */
  starred?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GqlDriveEntryConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlDriveEntryConnectionFilters>;
};

export type GqlDriveEntryKind =
  | 'FILE'
  | 'FOLDER';

export type GqlEntryField = {
  __typename?: 'EntryField';
  createdTime: Scalars['Instant']['output'];
  /** Stable cell key inside a record's valuesJson; derived from the label at create. */
  fieldKey: Scalars['String']['output'];
  fieldType: GqlEntryFieldType;
  id: Scalars['Id']['output'];
  label: Scalars['String']['output'];
  /** Choices for SELECT fields; null for every other type. */
  options?: Maybe<Array<Scalars['String']['output']>>;
  /** Column order, ascending. */
  position: Scalars['Int']['output'];
  required: Scalars['Boolean']['output'];
};

export type GqlEntryFieldType =
  | 'DATE'
  | 'NUMBER'
  | 'SELECT'
  | 'TEXT'
  | 'YESNO';

export type GqlEntryRecord = {
  __typename?: 'EntryRecord';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  updatedTime: Scalars['Instant']['output'];
  /** The row's cell values, JSON-encoded: { [fieldKey]: string | number | boolean }. */
  valuesJson: Scalars['String']['output'];
};

export type GqlEntryRecordConnection = {
  __typename?: 'EntryRecordConnection';
  nodes: Array<Maybe<GqlEntryRecord>>;
  pageInfo: GqlPageInfo;
};

export type GqlEntryRecordConnectionFilters = {
  /** Case-insensitive substring match across the record's text cell values. */
  search?: InputMaybe<Scalars['String']['input']>;
};

export type GqlEntryRecordConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlEntryRecordConnectionFilters>;
};

export type GqlExportQuickBooksStatementsXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  /** Which statements to include; defaults to ALL. */
  statement?: InputMaybe<GqlQuickBooksStatementExportKind>;
};

/** A resolved download URL. PRIVATE URLs expire; PUBLIC URLs are stable. */
export type GqlFileUrl = {
  __typename?: 'FileUrl';
  url: Scalars['String']['output'];
};

export type GqlFinalizeUploadInput = {
  uploadId: Scalars['Id']['input'];
};

export type GqlFlowAddLineInput = {
  idempotencyKey: Scalars['String']['input'];
  label: Scalars['String']['input'];
  linkedCategory?: InputMaybe<Scalars['String']['input']>;
  section: GqlFlowSection;
  templateId: Scalars['Id']['input'];
};

export type GqlFlowCreateTemplateInput = {
  idempotencyKey: Scalars['String']['input'];
  /** 1-24 grid months. */
  monthCount: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  /** Seed one linked row per P&L category with budgets from the latest actual month (requires connected books). */
  seedFromActuals?: InputMaybe<Scalars['Boolean']['input']>;
  /** First grid month as YYYY-MM. */
  startMonth: Scalars['String']['input'];
};

export type GqlFlowDeleteTemplateInput = {
  templateId: Scalars['Id']['input'];
};

export type GqlFlowExportTemplateXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  templateId: Scalars['Id']['input'];
};

export type GqlFlowImportTemplateXlsxInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  /** A READY xlsx upload whose Budget sheet has the shape the export produces. */
  uploadId: Scalars['Id']['input'];
};

/** One row of the grid: the plan, plus live actuals and variance per month. */
export type GqlFlowLine = {
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
  section: GqlFlowSection;
  /** actual minus budget per grid month; null wherever actuals are null. */
  variancesMinorUnits: Array<Maybe<Scalars['Int']['output']>>;
};

/** The P&L categories the owner's books serve, for the link dropdown. */
export type GqlFlowLinkableCategories = {
  __typename?: 'FlowLinkableCategories';
  expenseCategories: Array<Scalars['String']['output']>;
  incomeCategories: Array<Scalars['String']['output']>;
};

export type GqlFlowRemoveLineInput = {
  lineId: Scalars['Id']['input'];
};

export type GqlFlowRenameTemplateInput = {
  name: Scalars['String']['input'];
  templateId: Scalars['Id']['input'];
};

export type GqlFlowSection =
  | 'EXPENSES'
  | 'INCOME';

/**
 * A budget/forecast template: a named grid whose columns are consecutive
 * calendar months and whose rows are FlowLines. Money follows the kernel
 * money rule (integer minor units + ISO currency).
 */
export type GqlFlowTemplate = {
  __typename?: 'FlowTemplate';
  createdTime: Scalars['Instant']['output'];
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  /** The grid's rows: income first, then expenses, by position. */
  lines: Array<GqlFlowLine>;
  monthCount: Scalars['Int']['output'];
  /** The grid's months, oldest first (startMonth plus monthCount - 1 more). */
  months: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** First grid month as YYYY-MM. */
  startMonth: Scalars['String']['output'];
};

export type GqlFlowUpdateLineInput = {
  /** The full row of planned amounts (exactly monthCount entries, integer minor units). */
  budgetsMinorUnits?: InputMaybe<Array<Scalars['Int']['input']>>;
  label?: InputMaybe<Scalars['String']['input']>;
  lineId: Scalars['Id']['input'];
  /** Pass an empty string to clear the link; omit to leave it unchanged. */
  linkedCategory?: InputMaybe<Scalars['String']['input']>;
};

export type GqlInterpretDocumentInput = {
  /** A READY application/pdf upload (the dropped document). */
  uploadId: Scalars['Id']['input'];
};

/** One extracted field: a label and the value the document states. */
export type GqlInterpretedField = {
  __typename?: 'InterpretedField';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** One claimed (job, due time) from the job_runs ledger. */
export type GqlJobRun = {
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
  status: GqlJobRunStatus;
};

export type GqlJobRunStatus =
  /** The handler threw; error carries the message. */
  | 'FAILED'
  /** The run claimed its due time and is executing (or crashed mid-run). */
  | 'RUNNING'
  /** The handler completed. */
  | 'SUCCEEDED';

export type GqlMoveDriveEntryInput = {
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
  /** The destination folder; null moves the entry to the library root. */
  parentId?: InputMaybe<Scalars['Id']['input']>;
};

export type GqlMutation = {
  __typename?: 'Mutation';
  addDriveAlbumEntry: GqlDriveAlbum;
  addProjectMember: GqlProjectMembership;
  /** Starts the INTUIT-mode live connect: returns the Intuit consent URL to send the user to. */
  beginQuickBooksAuthorization: GqlQuickBooksAuthorization;
  /** Cancels the caller's simulated subscription; refuses when PAYMENTS_MODE=stripe. */
  cancelTestSubscription: GqlPaymentSubscription;
  /** Connects the caller's own books; each member gets their own connection. */
  cfoConnectMyBooks: GqlQuickBooksConnection;
  /** Disconnects the caller's own books. Idempotent. */
  cfoDisconnectMyBooks: Scalars['Boolean']['output'];
  /** Files a member's statements as a PRIVATE xlsx workbook for the caller; download via fileUrl. */
  cfoExportClientStatementsXlsx: GqlUpload;
  /** Invites an email into the practice as a client and sends the invite email (advisor-only). */
  cfoInviteClient: GqlCfoInvite;
  /** Revokes a pending invite (advisor-only). */
  cfoRevokeInvite: GqlCfoInvite;
  /** Empties the caller's whole library (the Clear-demo-library action). */
  clearDriveLibrary: Scalars['Boolean']['output'];
  /** Finishes the INTUIT-mode live connect from Intuit's callback parameters. */
  completeQuickBooksAuthorization: GqlQuickBooksConnection;
  completeTestCheckoutSession: GqlCheckoutSession;
  connectMyBooks: GqlQuickBooksConnection;
  connectQuickBooks: GqlQuickBooksConnection;
  createAccount: GqlAccount;
  createAiVoiceSession: GqlAiVoiceSession;
  /** A Billing Portal URL for the caller's subscription (the in-app test billing page in local mode). */
  createBillingPortalSession: GqlBillingPortalSession;
  createCheckoutSession: GqlCheckoutSession;
  createDriveAlbum: GqlDriveAlbum;
  createDriveFolder: GqlDriveEntry;
  createEntryField: GqlEntryField;
  createEntryRecord: GqlEntryRecord;
  createProject: GqlProject;
  createSong: GqlSong;
  createSubscriptionCheckoutSession: GqlCheckoutSession;
  /** Mints an upload slot: a PENDING row plus the URL and headers for the byte PUT. */
  createUpload: GqlUploadSlot;
  createUser: GqlUser;
  /** Ingests a supporting document dropped against a letter of credit. */
  creditAttachDocument: GqlCreditDocument;
  /** Deletes a letter of credit and its attached documents. */
  creditDeleteLc: Scalars['Boolean']['output'];
  /** Ingests a dropped LC PDF: extracts the MT700-family breakdown and persists it. */
  creditIngestLc: GqlCreditLc;
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
  exportQuickBooksStatementsXlsx: GqlUpload;
  /** Verifies the bytes arrived and flips the upload to READY (owner-only, idempotent). */
  finalizeUpload: GqlUpload;
  /** Appends a row to the grid, budgets all zero. */
  flowAddLine: GqlFlowLine;
  /** Creates a budget template; optionally seeds rows from the live books. */
  flowCreateTemplate: GqlFlowTemplate;
  /** Deletes a template and its lines. */
  flowDeleteTemplate: Scalars['Boolean']['output'];
  /** Renders the template to a PRIVATE xlsx workbook for the caller (Budget sheet + actuals-vs-budget sheet). */
  flowExportTemplateXlsx: GqlUpload;
  /** Seeds a new template from a workbook's Budget sheet (the export's shape). */
  flowImportTemplateXlsx: GqlFlowTemplate;
  flowRemoveLine: Scalars['Boolean']['output'];
  flowRenameTemplate: GqlFlowTemplate;
  /** Updates a row's label, link, and/or planned amounts. */
  flowUpdateLine: GqlFlowLine;
  /** Reads an uploaded PDF and returns its interpretation. Stateless: nothing is persisted. */
  interpretDocument: GqlDocumentInterpretation;
  /** Reparents an entry; null parentId moves it to the library root. */
  moveDriveEntry: GqlDriveEntry;
  /** Creates a deck with the full outline; slide copy defaults from the live books when connected. */
  pitchCreateDeck: GqlPitchDeck;
  /** Deletes a deck and its slides. */
  pitchDeleteDeck: Scalars['Boolean']['output'];
  /** Renders the deck to a PRIVATE PDF for the caller via the documents kernel; download via fileUrl. */
  pitchExportDeckPdf: GqlUpload;
  /** Updates a deck's brand fields (name, company, tagline, logo, accent). */
  pitchUpdateDeck: GqlPitchDeck;
  /** Updates a slide's copy or include toggle (the cover cannot be excluded). */
  pitchUpdateSlide: GqlPitchSlide;
  /** Binds a finalized upload into the tree as a FILE entry. */
  registerDriveFile: GqlDriveEntry;
  /** Registers (or rotates) a push destination for the caller, upserting on endpoint. */
  registerPushDevice: GqlPushDevice;
  removeDriveAlbumEntry: Scalars['Boolean']['output'];
  removeProjectMember: Scalars['Boolean']['output'];
  renameDriveAlbum: GqlDriveAlbum;
  renameDriveEntry: GqlDriveEntry;
  /** Swaps a file's media for freshly filed uploads (the photo rotate path). */
  replaceDriveEntryMedia: GqlDriveEntry;
  /** Restores from the trash; falls back to the root when the parent is gone. */
  restoreDriveEntry: GqlDriveEntry;
  setDriveEntryCaption: GqlDriveEntry;
  setDriveEntryStarred: GqlDriveEntry;
  /** Flips the underlying upload's visibility: the stable /file/<id> share link. */
  shareDriveEntry: GqlDriveEntry;
  /** Moves an entry (folders take their subtree) to the trash. */
  trashDriveEntry: GqlDriveEntry;
  /** Removes the caller's registration for the endpoint; true when one was removed. */
  unregisterPushDevice: Scalars['Boolean']['output'];
  updateEntryField: GqlEntryField;
  updateEntryRecord: GqlEntryRecord;
  updateProject: GqlProject;
  updateProjectMember: GqlProjectMembership;
  updateSong: GqlSong;
  updateUser: GqlUser;
  /** Server-side write: files inline bytes under the same allowlist, cap, and record as the browser flow. */
  writeFile: GqlUpload;
};


export type GqlMutationAddDriveAlbumEntryArgs = {
  input: GqlAddDriveAlbumEntryInput;
};


export type GqlMutationAddProjectMemberArgs = {
  input: GqlAddProjectMemberInput;
};


export type GqlMutationBeginQuickBooksAuthorizationArgs = {
  input: GqlBeginQuickBooksAuthorizationInput;
};


export type GqlMutationCfoConnectMyBooksArgs = {
  input: GqlCfoConnectMyBooksInput;
};


export type GqlMutationCfoExportClientStatementsXlsxArgs = {
  input: GqlCfoExportClientStatementsXlsxInput;
};


export type GqlMutationCfoInviteClientArgs = {
  input: GqlCfoInviteClientInput;
};


export type GqlMutationCfoRevokeInviteArgs = {
  input: GqlCfoRevokeInviteInput;
};


export type GqlMutationCompleteQuickBooksAuthorizationArgs = {
  input: GqlCompleteQuickBooksAuthorizationInput;
};


export type GqlMutationCompleteTestCheckoutSessionArgs = {
  input: GqlCompleteTestCheckoutSessionInput;
};


export type GqlMutationConnectMyBooksArgs = {
  input: GqlConnectQuickBooksInput;
};


export type GqlMutationConnectQuickBooksArgs = {
  input: GqlConnectQuickBooksInput;
};


export type GqlMutationCreateAccountArgs = {
  input: GqlCreateAccountInput;
};


export type GqlMutationCreateBillingPortalSessionArgs = {
  input: GqlCreateBillingPortalSessionInput;
};


export type GqlMutationCreateCheckoutSessionArgs = {
  input: GqlCreateCheckoutSessionInput;
};


export type GqlMutationCreateDriveAlbumArgs = {
  input: GqlCreateDriveAlbumInput;
};


export type GqlMutationCreateDriveFolderArgs = {
  input: GqlCreateDriveFolderInput;
};


export type GqlMutationCreateEntryFieldArgs = {
  input: GqlCreateEntryFieldInput;
};


export type GqlMutationCreateEntryRecordArgs = {
  input: GqlCreateEntryRecordInput;
};


export type GqlMutationCreateProjectArgs = {
  input: GqlCreateProjectInput;
};


export type GqlMutationCreateSongArgs = {
  input: GqlCreateSongInput;
};


export type GqlMutationCreateSubscriptionCheckoutSessionArgs = {
  input: GqlCreateSubscriptionCheckoutSessionInput;
};


export type GqlMutationCreateUploadArgs = {
  input: GqlCreateUploadInput;
};


export type GqlMutationCreateUserArgs = {
  input: GqlCreateUserInput;
};


export type GqlMutationCreditAttachDocumentArgs = {
  input: GqlCreditAttachDocumentInput;
};


export type GqlMutationCreditDeleteLcArgs = {
  input: GqlCreditDeleteLcInput;
};


export type GqlMutationCreditIngestLcArgs = {
  input: GqlCreditIngestLcInput;
};


export type GqlMutationCreditRemoveDocumentArgs = {
  input: GqlCreditRemoveDocumentInput;
};


export type GqlMutationDeleteDriveAlbumArgs = {
  input: GqlDeleteDriveAlbumInput;
};


export type GqlMutationDeleteDriveEntryArgs = {
  input: GqlDeleteDriveEntryInput;
};


export type GqlMutationDeleteEntryFieldArgs = {
  input: GqlDeleteEntryFieldInput;
};


export type GqlMutationDeleteEntryRecordArgs = {
  input: GqlDeleteEntryRecordInput;
};


export type GqlMutationDeleteSongArgs = {
  input: GqlDeleteSongInput;
};


export type GqlMutationDeleteUploadArgs = {
  input: GqlDeleteUploadInput;
};


export type GqlMutationExportQuickBooksStatementsXlsxArgs = {
  input: GqlExportQuickBooksStatementsXlsxInput;
};


export type GqlMutationFinalizeUploadArgs = {
  input: GqlFinalizeUploadInput;
};


export type GqlMutationFlowAddLineArgs = {
  input: GqlFlowAddLineInput;
};


export type GqlMutationFlowCreateTemplateArgs = {
  input: GqlFlowCreateTemplateInput;
};


export type GqlMutationFlowDeleteTemplateArgs = {
  input: GqlFlowDeleteTemplateInput;
};


export type GqlMutationFlowExportTemplateXlsxArgs = {
  input: GqlFlowExportTemplateXlsxInput;
};


export type GqlMutationFlowImportTemplateXlsxArgs = {
  input: GqlFlowImportTemplateXlsxInput;
};


export type GqlMutationFlowRemoveLineArgs = {
  input: GqlFlowRemoveLineInput;
};


export type GqlMutationFlowRenameTemplateArgs = {
  input: GqlFlowRenameTemplateInput;
};


export type GqlMutationFlowUpdateLineArgs = {
  input: GqlFlowUpdateLineInput;
};


export type GqlMutationInterpretDocumentArgs = {
  input: GqlInterpretDocumentInput;
};


export type GqlMutationMoveDriveEntryArgs = {
  input: GqlMoveDriveEntryInput;
};


export type GqlMutationPitchCreateDeckArgs = {
  input: GqlPitchCreateDeckInput;
};


export type GqlMutationPitchDeleteDeckArgs = {
  input: GqlPitchDeleteDeckInput;
};


export type GqlMutationPitchExportDeckPdfArgs = {
  input: GqlPitchExportDeckPdfInput;
};


export type GqlMutationPitchUpdateDeckArgs = {
  input: GqlPitchUpdateDeckInput;
};


export type GqlMutationPitchUpdateSlideArgs = {
  input: GqlPitchUpdateSlideInput;
};


export type GqlMutationRegisterDriveFileArgs = {
  input: GqlRegisterDriveFileInput;
};


export type GqlMutationRegisterPushDeviceArgs = {
  input: GqlRegisterPushDeviceInput;
};


export type GqlMutationRemoveDriveAlbumEntryArgs = {
  input: GqlRemoveDriveAlbumEntryInput;
};


export type GqlMutationRemoveProjectMemberArgs = {
  input: GqlRemoveProjectMemberInput;
};


export type GqlMutationRenameDriveAlbumArgs = {
  input: GqlRenameDriveAlbumInput;
};


export type GqlMutationRenameDriveEntryArgs = {
  input: GqlRenameDriveEntryInput;
};


export type GqlMutationReplaceDriveEntryMediaArgs = {
  input: GqlReplaceDriveEntryMediaInput;
};


export type GqlMutationRestoreDriveEntryArgs = {
  input: GqlRestoreDriveEntryInput;
};


export type GqlMutationSetDriveEntryCaptionArgs = {
  input: GqlSetDriveEntryCaptionInput;
};


export type GqlMutationSetDriveEntryStarredArgs = {
  input: GqlSetDriveEntryStarredInput;
};


export type GqlMutationShareDriveEntryArgs = {
  input: GqlShareDriveEntryInput;
};


export type GqlMutationTrashDriveEntryArgs = {
  input: GqlTrashDriveEntryInput;
};


export type GqlMutationUnregisterPushDeviceArgs = {
  input: GqlUnregisterPushDeviceInput;
};


export type GqlMutationUpdateEntryFieldArgs = {
  input: GqlUpdateEntryFieldInput;
};


export type GqlMutationUpdateEntryRecordArgs = {
  input: GqlUpdateEntryRecordInput;
};


export type GqlMutationUpdateProjectArgs = {
  input: GqlUpdateProjectInput;
};


export type GqlMutationUpdateProjectMemberArgs = {
  input: GqlUpdateProjectMemberInput;
};


export type GqlMutationUpdateSongArgs = {
  input: GqlUpdateSongInput;
};


export type GqlMutationUpdateUserArgs = {
  input: GqlUpdateUserInput;
};


export type GqlMutationWriteFileArgs = {
  input: GqlWriteFileInput;
};

export type GqlPageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type GqlPaginationInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

/**
 * One user's subscription: written exactly once when its checkout session
 * reaches PAID, then moved through ACTIVE / PAST_DUE / CANCELED by Stripe's
 * lifecycle events. Never anonymous.
 */
export type GqlPaymentSubscription = {
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
  provider: GqlCheckoutProvider;
  recurringInterval: GqlSubscriptionInterval;
  status: GqlSubscriptionStatus;
};

export type GqlPitchCreateDeckInput = {
  companyName: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagline?: InputMaybe<Scalars['String']['input']>;
};

/** An investor deck: brand plus the slide outline. */
export type GqlPitchDeck = {
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
  slides: Array<GqlPitchSlide>;
  tagline?: Maybe<Scalars['String']['output']>;
};

/**
 * The live numbers behind the chart slides, computed from the caller's books.
 * Served only while the books are connected (the query returns null otherwise).
 */
export type GqlPitchDeckData = {
  __typename?: 'PitchDeckData';
  /** Trailing-three-month average net income; negative means burn. */
  averageNetIncomeMinorUnits: Scalars['Int']['output'];
  /** Month-end cash, trailing thirteen months. */
  cashSeries: Array<GqlPitchSeriesPoint>;
  /** The connected company the numbers come from. */
  companyName: Scalars['String']['output'];
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  customerCount: Scalars['Int']['output'];
  expenseSeries: Array<GqlPitchSeriesPoint>;
  latestCashMinorUnits: Scalars['Int']['output'];
  netIncomeSeries: Array<GqlPitchSeriesPoint>;
  /** Latest month's net margin, whole percent. */
  netMarginPercent: Scalars['Int']['output'];
  paidInvoiceCount: Scalars['Int']['output'];
  /** Revenue change over the trailing year, whole percent. */
  revenueGrowthPercent: Scalars['Int']['output'];
  /** Monthly revenue, trailing thirteen months, oldest first. */
  revenueSeries: Array<GqlPitchSeriesPoint>;
  /** Whole months of runway at the trailing burn; null when cash-flow positive. */
  runwayMonths?: Maybe<Scalars['Int']['output']>;
  trailingTwelveMonthRevenueMinorUnits: Scalars['Int']['output'];
};

export type GqlPitchDeleteDeckInput = {
  deckId: Scalars['Id']['input'];
};

export type GqlPitchExportDeckPdfInput = {
  deckId: Scalars['Id']['input'];
  idempotencyKey: Scalars['String']['input'];
};

/** One month of a deck metric, integer minor units. */
export type GqlPitchSeriesPoint = {
  __typename?: 'PitchSeriesPoint';
  minorUnits: Scalars['Int']['output'];
  /** ISO month, YYYY-MM. */
  month: Scalars['String']['output'];
};

/** One slide: editable copy plus an include toggle (the cover is always included). */
export type GqlPitchSlide = {
  __typename?: 'PitchSlide';
  body: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  included: Scalars['Boolean']['output'];
  kind: GqlPitchSlideKind;
  position: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

/** The fixed deck outline; every deck has one slide of each kind. */
export type GqlPitchSlideKind =
  | 'ASK'
  | 'COVER'
  | 'MARGINS'
  | 'REVENUE'
  | 'RUNWAY'
  | 'TRACTION';

export type GqlPitchUpdateDeckInput = {
  accentColor?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  deckId: Scalars['Id']['input'];
  /** A READY image upload to brand the cover; empty string clears; omit to leave unchanged. */
  logoUploadId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  /** Pass an empty string to clear; omit to leave unchanged. */
  tagline?: InputMaybe<Scalars['String']['input']>;
};

export type GqlPitchUpdateSlideInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  included?: InputMaybe<Scalars['Boolean']['input']>;
  slideId: Scalars['Id']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type GqlProject = {
  __typename?: 'Project';
  archivedAt?: Maybe<Scalars['Instant']['output']>;
  createdBy: GqlUser;
  createdTime: Scalars['Instant']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  memberships: Array<GqlProjectMembership>;
  name: Scalars['String']['output'];
  status: GqlProjectStatus;
};

export type GqlProjectConnection = {
  __typename?: 'ProjectConnection';
  nodes: Array<Maybe<GqlProject>>;
  pageInfo: GqlPageInfo;
};

export type GqlProjectConnectionFilters = {
  name?: InputMaybe<Scalars['String']['input']>;
  statuses?: InputMaybe<Array<GqlProjectStatus>>;
};

export type GqlProjectConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlProjectConnectionFilters>;
};

export type GqlProjectMembership = {
  __typename?: 'ProjectMembership';
  createdTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  project: GqlProject;
  role: GqlProjectMembershipRole;
  user: GqlUser;
};

export type GqlProjectMembershipRole =
  | 'EDITOR'
  | 'OWNER'
  | 'VIEWER';

export type GqlProjectStatus =
  | 'ACTIVE'
  | 'ARCHIVED';

/** One PAID checkout, written exactly once no matter which observer saw payment first. */
export type GqlPurchase = {
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
  provider: GqlCheckoutProvider;
};

export type GqlPurchaseConnection = {
  __typename?: 'PurchaseConnection';
  nodes: Array<Maybe<GqlPurchase>>;
  pageInfo: GqlPageInfo;
};

export type GqlPurchaseConnectionInput = {
  connection: GqlConnectionInput;
};

/** One registered push destination (a browser subscription; native devices in C1b). */
export type GqlPushDevice = {
  __typename?: 'PushDevice';
  createdTime: Scalars['Instant']['output'];
  /** The transport identity: the Web Push subscription endpoint (native device tokens in C1b). */
  endpoint: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  platform: GqlPushDevicePlatform;
  /** Bumped every time the endpoint is (re-)registered. */
  rotatedTime: Scalars['Instant']['output'];
};

export type GqlPushDevicePlatform =
  /** An Android device via FCM. Registration rails exist; the transport is the C1b follow-up. */
  | 'ANDROID'
  /** An iPhone/iPad via APNs. Registration rails exist; the transport is the C1b follow-up. */
  | 'IOS'
  /** A browser, via Web Push (the only channel with a live transport today). */
  | 'WEB';

export type GqlQuery = {
  __typename?: 'Query';
  accounts: GqlAccountConnection;
  /** One member's books: the advisor may pass any member; a client only themself. */
  cfoClient: GqlCfoClient;
  /** Every client with the live state of their books (advisor-only). */
  cfoClients: Array<GqlCfoClient>;
  /** Every invite, newest first (advisor-only). */
  cfoInvites: Array<GqlCfoInvite>;
  /** The caller's practice membership, created on first touch (first user = advisor). */
  cfoMyMembership: GqlCfoMembership;
  checkoutSession: GqlCheckoutSession;
  /** One letter of credit with its documents and discrepancy report. */
  creditLc: GqlCreditLc;
  /** The caller's letters of credit, newest first. */
  creditLcs: Array<GqlCreditLc>;
  currentUser: GqlUser;
  driveAlbum: GqlDriveAlbum;
  /** The caller's albums, by name. */
  driveAlbums: Array<GqlDriveAlbum>;
  driveEntries: GqlDriveEntryConnection;
  driveEntry: GqlDriveEntry;
  entryFieldCreateFormSchema: GqlSchemaForm;
  entryFieldUpdateFormSchema: GqlSchemaForm;
  /** The workbook's field definitions, in column order. */
  entryFields: Array<GqlEntryField>;
  /** Built dynamically from the live field definitions — the modal form IS the user's schema. */
  entryRecordCreateFormSchema: GqlSchemaForm;
  entryRecordUpdateFormSchema: GqlSchemaForm;
  entryRecords: GqlEntryRecordConnection;
  /** The download URL for a READY upload (PUBLIC: stable; PRIVATE: owner-checked, short-lived). */
  fileUrl: GqlFileUrl;
  /** The P&L categories the caller's books serve, for the link dropdown. */
  flowLinkableCategories: GqlFlowLinkableCategories;
  /** One template with its computed grid (live actuals + variance). */
  flowTemplate: GqlFlowTemplate;
  /** The caller's budget templates, newest first. */
  flowTemplates: Array<GqlFlowTemplate>;
  /** Scheduled-job run history, newest first (optionally one job, capped at 200). */
  jobRuns: Array<GqlJobRun>;
  /** The caller's own books connection, or null before connecting (per-user surface). */
  myBooksConnection?: Maybe<GqlQuickBooksConnection>;
  /** The caller's subscription (most recent; optionally scoped to a product), or null. */
  mySubscription?: Maybe<GqlPaymentSubscription>;
  /** One deck with its slide outline. */
  pitchDeck: GqlPitchDeck;
  /** The live numbers behind the chart slides; null before the books are connected. */
  pitchDeckData?: Maybe<GqlPitchDeckData>;
  /** The caller's decks, newest first. */
  pitchDecks: Array<GqlPitchDeck>;
  project: GqlProject;
  projectCreateFormSchema: GqlSchemaForm;
  projectUpdateFormSchema: GqlSchemaForm;
  projects: GqlProjectConnection;
  purchases: GqlPurchaseConnection;
  /** Thirteen trailing month-end balance sheets, oldest first. */
  quickBooksBalanceSheet: Array<GqlQuickBooksBalanceSheetPeriod>;
  quickBooksCompanySnapshot: GqlQuickBooksCompanySnapshot;
  quickBooksCustomers: Array<GqlQuickBooksCustomer>;
  quickBooksInvoices: Array<GqlQuickBooksInvoice>;
  /** Thirteen trailing months of P&L, oldest first. */
  quickBooksProfitAndLoss: Array<GqlQuickBooksProfitAndLossPeriod>;
  quickBooksStatus: GqlQuickBooksStatus;
  shopProduct: GqlShopProduct;
  shopProducts: Array<GqlShopProduct>;
  song: GqlSong;
  songCreateFormSchema: GqlSchemaForm;
  songUpdateFormSchema: GqlSchemaForm;
  songs: GqlSongConnection;
  userCreateFormSchema: GqlSchemaForm;
  userUpdateFormSchema: GqlSchemaForm;
  users: GqlUserConnection;
};


export type GqlQueryAccountsArgs = {
  input: GqlAccountConnectionInput;
};


export type GqlQueryCfoClientArgs = {
  clientUserId: Scalars['Id']['input'];
};


export type GqlQueryCheckoutSessionArgs = {
  id: Scalars['Id']['input'];
};


export type GqlQueryCreditLcArgs = {
  lcId: Scalars['Id']['input'];
};


export type GqlQueryDriveAlbumArgs = {
  albumId: Scalars['Id']['input'];
};


export type GqlQueryDriveEntriesArgs = {
  input: GqlDriveEntryConnectionInput;
};


export type GqlQueryDriveEntryArgs = {
  id: Scalars['Id']['input'];
};


export type GqlQueryEntryFieldUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQueryEntryRecordUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQueryEntryRecordsArgs = {
  input: GqlEntryRecordConnectionInput;
};


export type GqlQueryFileUrlArgs = {
  uploadId: Scalars['Id']['input'];
};


export type GqlQueryFlowTemplateArgs = {
  templateId: Scalars['Id']['input'];
};


export type GqlQueryJobRunsArgs = {
  jobName?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type GqlQueryMySubscriptionArgs = {
  productKey?: InputMaybe<Scalars['String']['input']>;
};


export type GqlQueryPitchDeckArgs = {
  deckId: Scalars['Id']['input'];
};


export type GqlQueryProjectArgs = {
  id: Scalars['Id']['input'];
};


export type GqlQueryProjectUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQueryProjectsArgs = {
  input: GqlProjectConnectionInput;
};


export type GqlQueryPurchasesArgs = {
  input: GqlPurchaseConnectionInput;
};


export type GqlQueryQuickBooksInvoicesArgs = {
  input?: InputMaybe<GqlQuickBooksInvoicesInput>;
};


export type GqlQuerySongArgs = {
  id: Scalars['Id']['input'];
};


export type GqlQuerySongUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQuerySongsArgs = {
  input: GqlSongConnectionInput;
};


export type GqlQueryUserUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQueryUsersArgs = {
  input: GqlUserConnectionInput;
};

/** The Intuit consent-screen hand-off that starts a live (INTUIT-mode) connect. */
export type GqlQuickBooksAuthorization = {
  __typename?: 'QuickBooksAuthorization';
  /** Send the user's browser here; Intuit redirects back with code, state and realmId. */
  authorizationUrl: Scalars['String']['output'];
};

/** One month-end balance sheet. Assets always equal liabilities plus equity. */
export type GqlQuickBooksBalanceSheetPeriod = {
  __typename?: 'QuickBooksBalanceSheetPeriod';
  assetLines: Array<GqlQuickBooksStatementLine>;
  equityLines: Array<GqlQuickBooksStatementLine>;
  liabilityLines: Array<GqlQuickBooksStatementLine>;
  /** Calendar month as YYYY-MM (as-of month end). */
  month: Scalars['String']['output'];
  totalAssetsMinorUnits: Scalars['Int']['output'];
  totalEquityMinorUnits: Scalars['Int']['output'];
  totalLiabilitiesMinorUnits: Scalars['Int']['output'];
};

export type GqlQuickBooksCompanySnapshot = {
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

export type GqlQuickBooksConnection = {
  __typename?: 'QuickBooksConnection';
  companyName: Scalars['String']['output'];
  connectedTime: Scalars['Instant']['output'];
  id: Scalars['Id']['output'];
  mode: GqlQuickBooksMode;
  /** Which accounting provider this connection is for. */
  provider: GqlAccountingProvider;
  /** The QuickBooks company (realm) id this connection is bound to. */
  realmId: Scalars['String']['output'];
};

export type GqlQuickBooksCustomer = {
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

export type GqlQuickBooksInvoice = {
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
  status: GqlQuickBooksInvoiceStatus;
  /** Invoice total in minor units. */
  totalMinorUnits: Scalars['Int']['output'];
};

export type GqlQuickBooksInvoiceStatus =
  | 'OPEN'
  | 'OVERDUE'
  | 'PAID';

export type GqlQuickBooksInvoicesFilters = {
  statuses?: InputMaybe<Array<GqlQuickBooksInvoiceStatus>>;
};

export type GqlQuickBooksInvoicesInput = {
  filters?: InputMaybe<GqlQuickBooksInvoicesFilters>;
};

export type GqlQuickBooksMode =
  | 'INTUIT'
  | 'LOCAL';

/** One calendar month of profit & loss. Thirteen trailing months are served, oldest first. */
export type GqlQuickBooksProfitAndLossPeriod = {
  __typename?: 'QuickBooksProfitAndLossPeriod';
  expenseLines: Array<GqlQuickBooksStatementLine>;
  incomeLines: Array<GqlQuickBooksStatementLine>;
  /** Calendar month as YYYY-MM. */
  month: Scalars['String']['output'];
  netIncomeMinorUnits: Scalars['Int']['output'];
  totalExpensesMinorUnits: Scalars['Int']['output'];
  totalIncomeMinorUnits: Scalars['Int']['output'];
};

/** Which statements an xlsx export includes. */
export type GqlQuickBooksStatementExportKind =
  | 'ALL'
  | 'BALANCE_SHEET'
  | 'PROFIT_AND_LOSS';

/** One category line on a financial statement, in the currency's minor units. */
export type GqlQuickBooksStatementLine = {
  __typename?: 'QuickBooksStatementLine';
  category: Scalars['String']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type GqlQuickBooksStatus = {
  __typename?: 'QuickBooksStatus';
  connected: Scalars['Boolean']['output'];
  connection?: Maybe<GqlQuickBooksConnection>;
  /** How new connections connect here: LOCAL (instant, simulated) or INTUIT (the OAuth flow). */
  mode: GqlQuickBooksMode;
};

export type GqlRegisterDriveFileFields = {
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

export type GqlRegisterDriveFileInput = {
  fields: GqlRegisterDriveFileFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlRegisterPushDeviceInput = {
  /** Unique per browser/device; registration upserts on it. */
  endpoint: Scalars['String']['input'];
  platform: GqlPushDevicePlatform;
  /** The full browser PushSubscription JSON (endpoint + keys.p256dh + keys.auth) for WEB. */
  subscriptionJson: Scalars['String']['input'];
};

export type GqlRemoveDriveAlbumEntryInput = {
  albumId: Scalars['Id']['input'];
  entryId: Scalars['Id']['input'];
};

export type GqlRemoveProjectMemberInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlRenameDriveAlbumInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlRenameDriveEntryInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlReplaceDriveEntryMediaInput = {
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
  /** The replacement thumbnail; null/omitted drops the old one. */
  thumbUploadId?: InputMaybe<Scalars['Id']['input']>;
  /** The freshly filed replacement upload (READY, caller-owned). */
  uploadId: Scalars['Id']['input'];
};

export type GqlRestoreDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlSchemaForm = {
  __typename?: 'SchemaForm';
  defaultData: Scalars['String']['output'];
  jsonSchema: Scalars['String']['output'];
  uiSchema: Scalars['String']['output'];
};

export type GqlSchemaFormUpdateInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlSetDriveEntryCaptionInput = {
  /** Null clears the caption. */
  caption?: InputMaybe<Scalars['String']['input']>;
  objectId: Scalars['Id']['input'];
};

export type GqlSetDriveEntryStarredInput = {
  objectId: Scalars['Id']['input'];
  starred: Scalars['Boolean']['input'];
};

export type GqlShareDriveEntryInput = {
  objectId: Scalars['Id']['input'];
  /** True flips the underlying upload PUBLIC; false back to PRIVATE. */
  shared: Scalars['Boolean']['input'];
};

export type GqlShipmentTerm =
  | 'ALLOWED'
  | 'NOT_ALLOWED'
  | 'NOT_STATED';

export type GqlShopProduct = {
  __typename?: 'ShopProduct';
  /** Lowercase ISO currency code, e.g. "usd". */
  currency: Scalars['String']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Price in the currency's minor units (cents for USD). */
  priceMinorUnits: Scalars['Int']['output'];
  tagline: Scalars['String']['output'];
};

export type GqlSong = {
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

export type GqlSongConnection = {
  __typename?: 'SongConnection';
  nodes: Array<Maybe<GqlSong>>;
  pageInfo: GqlPageInfo;
};

export type GqlSongConnectionFilters = {
  /** Case-insensitive substring match across title, artist, genre, and notes. */
  search?: InputMaybe<Scalars['String']['input']>;
};

export type GqlSongConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlSongConnectionFilters>;
};

export type GqlSortDirection =
  | 'asc'
  | 'desc';

export type GqlSortOrderInput = {
  direction: GqlSortDirection;
  fieldName: Scalars['String']['input'];
};

export type GqlSubscriptionInterval =
  | 'MONTH'
  | 'YEAR';

export type GqlSubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE';

export type GqlTrashDriveEntryInput = {
  objectId: Scalars['Id']['input'];
};

export type GqlUnregisterPushDeviceInput = {
  endpoint: Scalars['String']['input'];
};

export type GqlUpdateEntryFieldFields = {
  label?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GqlUpdateEntryFieldInput = {
  fields: GqlUpdateEntryFieldFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpdateEntryRecordFields = {
  valuesJson: Scalars['String']['input'];
};

export type GqlUpdateEntryRecordInput = {
  fields: GqlUpdateEntryRecordFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpdateProjectFields = {
  description?: InputMaybe<Scalars['String']['input']>;
  doArchive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type GqlUpdateProjectInput = {
  fields: GqlUpdateProjectFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpdateProjectMemberFields = {
  role: GqlProjectMembershipRole;
};

export type GqlUpdateProjectMemberInput = {
  fields: GqlUpdateProjectMemberFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpdateSongFields = {
  artist?: InputMaybe<Scalars['String']['input']>;
  chartRank?: InputMaybe<Scalars['Int']['input']>;
  genre?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  streamsBillions?: InputMaybe<Scalars['Float']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type GqlUpdateSongInput = {
  fields: GqlUpdateSongFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpdateUserFields = {
  /** A READY PUBLIC upload id from the storage kernel (Settings avatar flow). */
  avatarUploadId?: InputMaybe<Scalars['Id']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GqlUserStatus>;
};

export type GqlUpdateUserInput = {
  fields: GqlUpdateUserFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUpload = {
  __typename?: 'Upload';
  contentType: Scalars['String']['output'];
  createdTime: Scalars['Instant']['output'];
  /** The download-friendly name the file was filed with, when the caller supplied one. */
  fileName?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  /** Declared at create time; the actual byte count once READY. */
  sizeBytes: Scalars['Int']['output'];
  status: GqlUploadStatus;
  visibility: GqlUploadVisibility;
};

/** Admission profiles (Services/Storage/StorageConfig.ts): each surface's allowlist and size cap. */
export type GqlUploadProfile =
  /** The original avatar-era rules: a small allowlist at 20MB. */
  | 'DEFAULT'
  /** The drive surface (Files/Images packs): broad document and media types at 100MB. */
  | 'DRIVE';

/** Everything the client needs to PUT the file bytes. */
export type GqlUploadSlot = {
  __typename?: 'UploadSlot';
  /** Headers to send verbatim on the PUT, JSON-encoded ({"Content-Type": ...}). */
  headersJson: Scalars['String']['output'];
  upload: GqlUpload;
  uploadId: Scalars['Id']['output'];
  /** Absolute signed GCS URL (gcs mode) or a /upload path on the storage function (local mode). */
  uploadUrl: Scalars['String']['output'];
};

export type GqlUploadStatus =
  /** The slot exists; bytes have not been verified yet. */
  | 'PENDING'
  /** Bytes are verified and the file is servable. */
  | 'READY';

export type GqlUploadVisibility =
  /** Only the owner can mint a short-lived download URL. */
  | 'PRIVATE'
  /** Anyone with the file URL can read it (stable /file/<id> serving URL). */
  | 'PUBLIC';

export type GqlUser = {
  __typename?: 'User';
  account?: Maybe<GqlAccount>;
  /** The user's avatar upload (storage kernel), or null when none is set. */
  avatarUploadId?: Maybe<Scalars['Id']['output']>;
  createdTime: Scalars['Instant']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['Id']['output'];
  status: GqlUserStatus;
};

export type GqlUserConnection = {
  __typename?: 'UserConnection';
  nodes: Array<Maybe<GqlUser>>;
  pageInfo: GqlPageInfo;
};

export type GqlUserConnectionFilters = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  statuses?: InputMaybe<Array<GqlUserStatus>>;
};

export type GqlUserConnectionInput = {
  connection: GqlConnectionInput;
  filters?: InputMaybe<GqlUserConnectionFilters>;
};

export type GqlUserStatus =
  | 'ACTIVE'
  | 'DISABLED';

export type GqlWriteFileFields = {
  /** The file bytes, base64-encoded; decoded size is held to the same cap as a browser upload. */
  bytesBase64: Scalars['String']['input'];
  /** Must be on the kernel's content-type allowlist (Services/Storage/StorageConfig.ts). */
  contentType: Scalars['String']['input'];
  /** Optional download-friendly name recorded on the upload (e.g. a generated document's). */
  fileName?: InputMaybe<Scalars['String']['input']>;
  visibility: GqlUploadVisibility;
};

export type GqlWriteFileInput = {
  fields: GqlWriteFileFields;
  idempotencyKey: Scalars['String']['input'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type GqlResolversTypes = ResolversObject<{
  Account: ResolverTypeWrapper<PartiallyResolvedAccount>;
  AccountConnection: ResolverTypeWrapper<Omit<GqlAccountConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['Account']>> }>;
  AccountConnectionFilters: GqlAccountConnectionFilters;
  AccountConnectionInput: GqlAccountConnectionInput;
  AccountingProvider: GqlAccountingProvider;
  AddDriveAlbumEntryInput: GqlAddDriveAlbumEntryInput;
  AddProjectMemberFields: GqlAddProjectMemberFields;
  AddProjectMemberInput: GqlAddProjectMemberInput;
  AiVoiceSession: ResolverTypeWrapper<GqlAiVoiceSession>;
  BeginQuickBooksAuthorizationInput: GqlBeginQuickBooksAuthorizationInput;
  BillingPortalSession: ResolverTypeWrapper<GqlBillingPortalSession>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CfoClient: ResolverTypeWrapper<PartiallyResolvedCfoClient>;
  CfoConnectMyBooksInput: GqlCfoConnectMyBooksInput;
  CfoExportClientStatementsXlsxInput: GqlCfoExportClientStatementsXlsxInput;
  CfoInvite: ResolverTypeWrapper<PartiallyResolvedCfoInvite>;
  CfoInviteClientInput: GqlCfoInviteClientInput;
  CfoInviteStatus: GqlCfoInviteStatus;
  CfoMembership: ResolverTypeWrapper<PartiallyResolvedCfoMembership>;
  CfoRevokeInviteInput: GqlCfoRevokeInviteInput;
  CfoRole: GqlCfoRole;
  CheckoutMode: GqlCheckoutMode;
  CheckoutProvider: GqlCheckoutProvider;
  CheckoutSession: ResolverTypeWrapper<PartiallyResolvedCheckoutSession>;
  CheckoutSessionStatus: GqlCheckoutSessionStatus;
  CompleteQuickBooksAuthorizationInput: GqlCompleteQuickBooksAuthorizationInput;
  CompleteTestCheckoutSessionInput: GqlCompleteTestCheckoutSessionInput;
  ConnectQuickBooksInput: GqlConnectQuickBooksInput;
  ConnectionInput: GqlConnectionInput;
  CreateAccountFields: GqlCreateAccountFields;
  CreateAccountInput: GqlCreateAccountInput;
  CreateBillingPortalSessionInput: GqlCreateBillingPortalSessionInput;
  CreateCheckoutSessionFields: GqlCreateCheckoutSessionFields;
  CreateCheckoutSessionInput: GqlCreateCheckoutSessionInput;
  CreateDriveAlbumFields: GqlCreateDriveAlbumFields;
  CreateDriveAlbumInput: GqlCreateDriveAlbumInput;
  CreateDriveFolderFields: GqlCreateDriveFolderFields;
  CreateDriveFolderInput: GqlCreateDriveFolderInput;
  CreateEntryFieldFields: GqlCreateEntryFieldFields;
  CreateEntryFieldInput: GqlCreateEntryFieldInput;
  CreateEntryRecordFields: GqlCreateEntryRecordFields;
  CreateEntryRecordInput: GqlCreateEntryRecordInput;
  CreateProjectFields: GqlCreateProjectFields;
  CreateProjectInput: GqlCreateProjectInput;
  CreateSongFields: GqlCreateSongFields;
  CreateSongInput: GqlCreateSongInput;
  CreateSubscriptionCheckoutSessionFields: GqlCreateSubscriptionCheckoutSessionFields;
  CreateSubscriptionCheckoutSessionInput: GqlCreateSubscriptionCheckoutSessionInput;
  CreateUploadFields: GqlCreateUploadFields;
  CreateUploadInput: GqlCreateUploadInput;
  CreateUserFields: GqlCreateUserFields;
  CreateUserInput: GqlCreateUserInput;
  CreditAttachDocumentInput: GqlCreditAttachDocumentInput;
  CreditDeleteLcInput: GqlCreditDeleteLcInput;
  CreditDocument: ResolverTypeWrapper<PartiallyResolvedCreditDocument>;
  CreditDocumentKind: GqlCreditDocumentKind;
  CreditFinding: ResolverTypeWrapper<GqlCreditFinding>;
  CreditFindingSeverity: GqlCreditFindingSeverity;
  CreditIngestLcInput: GqlCreditIngestLcInput;
  CreditLc: ResolverTypeWrapper<PartiallyResolvedCreditLc>;
  CreditRemoveDocumentInput: GqlCreditRemoveDocumentInput;
  DeleteDriveAlbumInput: GqlDeleteDriveAlbumInput;
  DeleteDriveEntryInput: GqlDeleteDriveEntryInput;
  DeleteEntryFieldInput: GqlDeleteEntryFieldInput;
  DeleteEntryRecordInput: GqlDeleteEntryRecordInput;
  DeleteSongInput: GqlDeleteSongInput;
  DeleteUploadInput: GqlDeleteUploadInput;
  DocumentInterpretation: ResolverTypeWrapper<GqlDocumentInterpretation>;
  DriveAlbum: ResolverTypeWrapper<PartiallyResolvedDriveAlbum>;
  DriveEntry: ResolverTypeWrapper<PartiallyResolvedDriveEntry>;
  DriveEntryConnection: ResolverTypeWrapper<Omit<GqlDriveEntryConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['DriveEntry']>> }>;
  DriveEntryConnectionFilters: GqlDriveEntryConnectionFilters;
  DriveEntryConnectionInput: GqlDriveEntryConnectionInput;
  DriveEntryKind: GqlDriveEntryKind;
  EntryField: ResolverTypeWrapper<PartiallyResolvedEntryField>;
  EntryFieldType: GqlEntryFieldType;
  EntryRecord: ResolverTypeWrapper<PartiallyResolvedEntryRecord>;
  EntryRecordConnection: ResolverTypeWrapper<Omit<GqlEntryRecordConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['EntryRecord']>> }>;
  EntryRecordConnectionFilters: GqlEntryRecordConnectionFilters;
  EntryRecordConnectionInput: GqlEntryRecordConnectionInput;
  ExportQuickBooksStatementsXlsxInput: GqlExportQuickBooksStatementsXlsxInput;
  FileUrl: ResolverTypeWrapper<GqlFileUrl>;
  FinalizeUploadInput: GqlFinalizeUploadInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FlowAddLineInput: GqlFlowAddLineInput;
  FlowCreateTemplateInput: GqlFlowCreateTemplateInput;
  FlowDeleteTemplateInput: GqlFlowDeleteTemplateInput;
  FlowExportTemplateXlsxInput: GqlFlowExportTemplateXlsxInput;
  FlowImportTemplateXlsxInput: GqlFlowImportTemplateXlsxInput;
  FlowLine: ResolverTypeWrapper<PartiallyResolvedFlowLine>;
  FlowLinkableCategories: ResolverTypeWrapper<GqlFlowLinkableCategories>;
  FlowRemoveLineInput: GqlFlowRemoveLineInput;
  FlowRenameTemplateInput: GqlFlowRenameTemplateInput;
  FlowSection: GqlFlowSection;
  FlowTemplate: ResolverTypeWrapper<PartiallyResolvedFlowTemplate>;
  FlowUpdateLineInput: GqlFlowUpdateLineInput;
  Id: ResolverTypeWrapper<Scalars['Id']['output']>;
  Instant: ResolverTypeWrapper<Scalars['Instant']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InterpretDocumentInput: GqlInterpretDocumentInput;
  InterpretedField: ResolverTypeWrapper<GqlInterpretedField>;
  JobRun: ResolverTypeWrapper<GqlJobRun>;
  JobRunStatus: GqlJobRunStatus;
  MoveDriveEntryInput: GqlMoveDriveEntryInput;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<GqlPageInfo>;
  PaginationInput: GqlPaginationInput;
  PaymentSubscription: ResolverTypeWrapper<PartiallyResolvedPaymentSubscription>;
  PitchCreateDeckInput: GqlPitchCreateDeckInput;
  PitchDeck: ResolverTypeWrapper<PartiallyResolvedPitchDeck>;
  PitchDeckData: ResolverTypeWrapper<GqlPitchDeckData>;
  PitchDeleteDeckInput: GqlPitchDeleteDeckInput;
  PitchExportDeckPdfInput: GqlPitchExportDeckPdfInput;
  PitchSeriesPoint: ResolverTypeWrapper<GqlPitchSeriesPoint>;
  PitchSlide: ResolverTypeWrapper<PartiallyResolvedPitchSlide>;
  PitchSlideKind: GqlPitchSlideKind;
  PitchUpdateDeckInput: GqlPitchUpdateDeckInput;
  PitchUpdateSlideInput: GqlPitchUpdateSlideInput;
  Project: ResolverTypeWrapper<PartiallyResolvedProject>;
  ProjectConnection: ResolverTypeWrapper<Omit<GqlProjectConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['Project']>> }>;
  ProjectConnectionFilters: GqlProjectConnectionFilters;
  ProjectConnectionInput: GqlProjectConnectionInput;
  ProjectMembership: ResolverTypeWrapper<PartiallyResolvedProjectMembership>;
  ProjectMembershipRole: GqlProjectMembershipRole;
  ProjectStatus: GqlProjectStatus;
  Purchase: ResolverTypeWrapper<PartiallyResolvedPurchase>;
  PurchaseConnection: ResolverTypeWrapper<Omit<GqlPurchaseConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['Purchase']>> }>;
  PurchaseConnectionInput: GqlPurchaseConnectionInput;
  PushDevice: ResolverTypeWrapper<PartiallyResolvedPushDevice>;
  PushDevicePlatform: GqlPushDevicePlatform;
  Query: ResolverTypeWrapper<{}>;
  QuickBooksAuthorization: ResolverTypeWrapper<GqlQuickBooksAuthorization>;
  QuickBooksBalanceSheetPeriod: ResolverTypeWrapper<GqlQuickBooksBalanceSheetPeriod>;
  QuickBooksCompanySnapshot: ResolverTypeWrapper<GqlQuickBooksCompanySnapshot>;
  QuickBooksConnection: ResolverTypeWrapper<PartiallyResolvedQuickBooksConnection>;
  QuickBooksCustomer: ResolverTypeWrapper<GqlQuickBooksCustomer>;
  QuickBooksInvoice: ResolverTypeWrapper<GqlQuickBooksInvoice>;
  QuickBooksInvoiceStatus: GqlQuickBooksInvoiceStatus;
  QuickBooksInvoicesFilters: GqlQuickBooksInvoicesFilters;
  QuickBooksInvoicesInput: GqlQuickBooksInvoicesInput;
  QuickBooksMode: GqlQuickBooksMode;
  QuickBooksProfitAndLossPeriod: ResolverTypeWrapper<GqlQuickBooksProfitAndLossPeriod>;
  QuickBooksStatementExportKind: GqlQuickBooksStatementExportKind;
  QuickBooksStatementLine: ResolverTypeWrapper<GqlQuickBooksStatementLine>;
  QuickBooksStatus: ResolverTypeWrapper<Omit<GqlQuickBooksStatus, 'connection'> & { connection?: Maybe<GqlResolversTypes['QuickBooksConnection']> }>;
  RegisterDriveFileFields: GqlRegisterDriveFileFields;
  RegisterDriveFileInput: GqlRegisterDriveFileInput;
  RegisterPushDeviceInput: GqlRegisterPushDeviceInput;
  RemoveDriveAlbumEntryInput: GqlRemoveDriveAlbumEntryInput;
  RemoveProjectMemberInput: GqlRemoveProjectMemberInput;
  RenameDriveAlbumInput: GqlRenameDriveAlbumInput;
  RenameDriveEntryInput: GqlRenameDriveEntryInput;
  ReplaceDriveEntryMediaInput: GqlReplaceDriveEntryMediaInput;
  RestoreDriveEntryInput: GqlRestoreDriveEntryInput;
  SchemaForm: ResolverTypeWrapper<GqlSchemaForm>;
  SchemaFormUpdateInput: GqlSchemaFormUpdateInput;
  SetDriveEntryCaptionInput: GqlSetDriveEntryCaptionInput;
  SetDriveEntryStarredInput: GqlSetDriveEntryStarredInput;
  ShareDriveEntryInput: GqlShareDriveEntryInput;
  ShipmentTerm: GqlShipmentTerm;
  ShopProduct: ResolverTypeWrapper<GqlShopProduct>;
  Song: ResolverTypeWrapper<PartiallyResolvedSong>;
  SongConnection: ResolverTypeWrapper<Omit<GqlSongConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['Song']>> }>;
  SongConnectionFilters: GqlSongConnectionFilters;
  SongConnectionInput: GqlSongConnectionInput;
  SortDirection: GqlSortDirection;
  SortOrderInput: GqlSortOrderInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SubscriptionInterval: GqlSubscriptionInterval;
  SubscriptionStatus: GqlSubscriptionStatus;
  TrashDriveEntryInput: GqlTrashDriveEntryInput;
  UnregisterPushDeviceInput: GqlUnregisterPushDeviceInput;
  UpdateEntryFieldFields: GqlUpdateEntryFieldFields;
  UpdateEntryFieldInput: GqlUpdateEntryFieldInput;
  UpdateEntryRecordFields: GqlUpdateEntryRecordFields;
  UpdateEntryRecordInput: GqlUpdateEntryRecordInput;
  UpdateProjectFields: GqlUpdateProjectFields;
  UpdateProjectInput: GqlUpdateProjectInput;
  UpdateProjectMemberFields: GqlUpdateProjectMemberFields;
  UpdateProjectMemberInput: GqlUpdateProjectMemberInput;
  UpdateSongFields: GqlUpdateSongFields;
  UpdateSongInput: GqlUpdateSongInput;
  UpdateUserFields: GqlUpdateUserFields;
  UpdateUserInput: GqlUpdateUserInput;
  Upload: ResolverTypeWrapper<PartiallyResolvedUpload>;
  UploadProfile: GqlUploadProfile;
  UploadSlot: ResolverTypeWrapper<Omit<GqlUploadSlot, 'upload'> & { upload: GqlResolversTypes['Upload'] }>;
  UploadStatus: GqlUploadStatus;
  UploadVisibility: GqlUploadVisibility;
  User: ResolverTypeWrapper<PartiallyResolvedUser>;
  UserConnection: ResolverTypeWrapper<Omit<GqlUserConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['User']>> }>;
  UserConnectionFilters: GqlUserConnectionFilters;
  UserConnectionInput: GqlUserConnectionInput;
  UserStatus: GqlUserStatus;
  WriteFileFields: GqlWriteFileFields;
  WriteFileInput: GqlWriteFileInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GqlResolversParentTypes = ResolversObject<{
  Account: PartiallyResolvedAccount;
  AccountConnection: Omit<GqlAccountConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Account']>> };
  AccountConnectionFilters: GqlAccountConnectionFilters;
  AccountConnectionInput: GqlAccountConnectionInput;
  AddDriveAlbumEntryInput: GqlAddDriveAlbumEntryInput;
  AddProjectMemberFields: GqlAddProjectMemberFields;
  AddProjectMemberInput: GqlAddProjectMemberInput;
  AiVoiceSession: GqlAiVoiceSession;
  BeginQuickBooksAuthorizationInput: GqlBeginQuickBooksAuthorizationInput;
  BillingPortalSession: GqlBillingPortalSession;
  Boolean: Scalars['Boolean']['output'];
  CfoClient: PartiallyResolvedCfoClient;
  CfoConnectMyBooksInput: GqlCfoConnectMyBooksInput;
  CfoExportClientStatementsXlsxInput: GqlCfoExportClientStatementsXlsxInput;
  CfoInvite: PartiallyResolvedCfoInvite;
  CfoInviteClientInput: GqlCfoInviteClientInput;
  CfoMembership: PartiallyResolvedCfoMembership;
  CfoRevokeInviteInput: GqlCfoRevokeInviteInput;
  CheckoutSession: PartiallyResolvedCheckoutSession;
  CompleteQuickBooksAuthorizationInput: GqlCompleteQuickBooksAuthorizationInput;
  CompleteTestCheckoutSessionInput: GqlCompleteTestCheckoutSessionInput;
  ConnectQuickBooksInput: GqlConnectQuickBooksInput;
  ConnectionInput: GqlConnectionInput;
  CreateAccountFields: GqlCreateAccountFields;
  CreateAccountInput: GqlCreateAccountInput;
  CreateBillingPortalSessionInput: GqlCreateBillingPortalSessionInput;
  CreateCheckoutSessionFields: GqlCreateCheckoutSessionFields;
  CreateCheckoutSessionInput: GqlCreateCheckoutSessionInput;
  CreateDriveAlbumFields: GqlCreateDriveAlbumFields;
  CreateDriveAlbumInput: GqlCreateDriveAlbumInput;
  CreateDriveFolderFields: GqlCreateDriveFolderFields;
  CreateDriveFolderInput: GqlCreateDriveFolderInput;
  CreateEntryFieldFields: GqlCreateEntryFieldFields;
  CreateEntryFieldInput: GqlCreateEntryFieldInput;
  CreateEntryRecordFields: GqlCreateEntryRecordFields;
  CreateEntryRecordInput: GqlCreateEntryRecordInput;
  CreateProjectFields: GqlCreateProjectFields;
  CreateProjectInput: GqlCreateProjectInput;
  CreateSongFields: GqlCreateSongFields;
  CreateSongInput: GqlCreateSongInput;
  CreateSubscriptionCheckoutSessionFields: GqlCreateSubscriptionCheckoutSessionFields;
  CreateSubscriptionCheckoutSessionInput: GqlCreateSubscriptionCheckoutSessionInput;
  CreateUploadFields: GqlCreateUploadFields;
  CreateUploadInput: GqlCreateUploadInput;
  CreateUserFields: GqlCreateUserFields;
  CreateUserInput: GqlCreateUserInput;
  CreditAttachDocumentInput: GqlCreditAttachDocumentInput;
  CreditDeleteLcInput: GqlCreditDeleteLcInput;
  CreditDocument: PartiallyResolvedCreditDocument;
  CreditFinding: GqlCreditFinding;
  CreditIngestLcInput: GqlCreditIngestLcInput;
  CreditLc: PartiallyResolvedCreditLc;
  CreditRemoveDocumentInput: GqlCreditRemoveDocumentInput;
  DeleteDriveAlbumInput: GqlDeleteDriveAlbumInput;
  DeleteDriveEntryInput: GqlDeleteDriveEntryInput;
  DeleteEntryFieldInput: GqlDeleteEntryFieldInput;
  DeleteEntryRecordInput: GqlDeleteEntryRecordInput;
  DeleteSongInput: GqlDeleteSongInput;
  DeleteUploadInput: GqlDeleteUploadInput;
  DocumentInterpretation: GqlDocumentInterpretation;
  DriveAlbum: PartiallyResolvedDriveAlbum;
  DriveEntry: PartiallyResolvedDriveEntry;
  DriveEntryConnection: Omit<GqlDriveEntryConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['DriveEntry']>> };
  DriveEntryConnectionFilters: GqlDriveEntryConnectionFilters;
  DriveEntryConnectionInput: GqlDriveEntryConnectionInput;
  EntryField: PartiallyResolvedEntryField;
  EntryRecord: PartiallyResolvedEntryRecord;
  EntryRecordConnection: Omit<GqlEntryRecordConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['EntryRecord']>> };
  EntryRecordConnectionFilters: GqlEntryRecordConnectionFilters;
  EntryRecordConnectionInput: GqlEntryRecordConnectionInput;
  ExportQuickBooksStatementsXlsxInput: GqlExportQuickBooksStatementsXlsxInput;
  FileUrl: GqlFileUrl;
  FinalizeUploadInput: GqlFinalizeUploadInput;
  Float: Scalars['Float']['output'];
  FlowAddLineInput: GqlFlowAddLineInput;
  FlowCreateTemplateInput: GqlFlowCreateTemplateInput;
  FlowDeleteTemplateInput: GqlFlowDeleteTemplateInput;
  FlowExportTemplateXlsxInput: GqlFlowExportTemplateXlsxInput;
  FlowImportTemplateXlsxInput: GqlFlowImportTemplateXlsxInput;
  FlowLine: PartiallyResolvedFlowLine;
  FlowLinkableCategories: GqlFlowLinkableCategories;
  FlowRemoveLineInput: GqlFlowRemoveLineInput;
  FlowRenameTemplateInput: GqlFlowRenameTemplateInput;
  FlowTemplate: PartiallyResolvedFlowTemplate;
  FlowUpdateLineInput: GqlFlowUpdateLineInput;
  Id: Scalars['Id']['output'];
  Instant: Scalars['Instant']['output'];
  Int: Scalars['Int']['output'];
  InterpretDocumentInput: GqlInterpretDocumentInput;
  InterpretedField: GqlInterpretedField;
  JobRun: GqlJobRun;
  MoveDriveEntryInput: GqlMoveDriveEntryInput;
  Mutation: {};
  PageInfo: GqlPageInfo;
  PaginationInput: GqlPaginationInput;
  PaymentSubscription: PartiallyResolvedPaymentSubscription;
  PitchCreateDeckInput: GqlPitchCreateDeckInput;
  PitchDeck: PartiallyResolvedPitchDeck;
  PitchDeckData: GqlPitchDeckData;
  PitchDeleteDeckInput: GqlPitchDeleteDeckInput;
  PitchExportDeckPdfInput: GqlPitchExportDeckPdfInput;
  PitchSeriesPoint: GqlPitchSeriesPoint;
  PitchSlide: PartiallyResolvedPitchSlide;
  PitchUpdateDeckInput: GqlPitchUpdateDeckInput;
  PitchUpdateSlideInput: GqlPitchUpdateSlideInput;
  Project: PartiallyResolvedProject;
  ProjectConnection: Omit<GqlProjectConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Project']>> };
  ProjectConnectionFilters: GqlProjectConnectionFilters;
  ProjectConnectionInput: GqlProjectConnectionInput;
  ProjectMembership: PartiallyResolvedProjectMembership;
  Purchase: PartiallyResolvedPurchase;
  PurchaseConnection: Omit<GqlPurchaseConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Purchase']>> };
  PurchaseConnectionInput: GqlPurchaseConnectionInput;
  PushDevice: PartiallyResolvedPushDevice;
  Query: {};
  QuickBooksAuthorization: GqlQuickBooksAuthorization;
  QuickBooksBalanceSheetPeriod: GqlQuickBooksBalanceSheetPeriod;
  QuickBooksCompanySnapshot: GqlQuickBooksCompanySnapshot;
  QuickBooksConnection: PartiallyResolvedQuickBooksConnection;
  QuickBooksCustomer: GqlQuickBooksCustomer;
  QuickBooksInvoice: GqlQuickBooksInvoice;
  QuickBooksInvoicesFilters: GqlQuickBooksInvoicesFilters;
  QuickBooksInvoicesInput: GqlQuickBooksInvoicesInput;
  QuickBooksProfitAndLossPeriod: GqlQuickBooksProfitAndLossPeriod;
  QuickBooksStatementLine: GqlQuickBooksStatementLine;
  QuickBooksStatus: Omit<GqlQuickBooksStatus, 'connection'> & { connection?: Maybe<GqlResolversParentTypes['QuickBooksConnection']> };
  RegisterDriveFileFields: GqlRegisterDriveFileFields;
  RegisterDriveFileInput: GqlRegisterDriveFileInput;
  RegisterPushDeviceInput: GqlRegisterPushDeviceInput;
  RemoveDriveAlbumEntryInput: GqlRemoveDriveAlbumEntryInput;
  RemoveProjectMemberInput: GqlRemoveProjectMemberInput;
  RenameDriveAlbumInput: GqlRenameDriveAlbumInput;
  RenameDriveEntryInput: GqlRenameDriveEntryInput;
  ReplaceDriveEntryMediaInput: GqlReplaceDriveEntryMediaInput;
  RestoreDriveEntryInput: GqlRestoreDriveEntryInput;
  SchemaForm: GqlSchemaForm;
  SchemaFormUpdateInput: GqlSchemaFormUpdateInput;
  SetDriveEntryCaptionInput: GqlSetDriveEntryCaptionInput;
  SetDriveEntryStarredInput: GqlSetDriveEntryStarredInput;
  ShareDriveEntryInput: GqlShareDriveEntryInput;
  ShopProduct: GqlShopProduct;
  Song: PartiallyResolvedSong;
  SongConnection: Omit<GqlSongConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Song']>> };
  SongConnectionFilters: GqlSongConnectionFilters;
  SongConnectionInput: GqlSongConnectionInput;
  SortOrderInput: GqlSortOrderInput;
  String: Scalars['String']['output'];
  TrashDriveEntryInput: GqlTrashDriveEntryInput;
  UnregisterPushDeviceInput: GqlUnregisterPushDeviceInput;
  UpdateEntryFieldFields: GqlUpdateEntryFieldFields;
  UpdateEntryFieldInput: GqlUpdateEntryFieldInput;
  UpdateEntryRecordFields: GqlUpdateEntryRecordFields;
  UpdateEntryRecordInput: GqlUpdateEntryRecordInput;
  UpdateProjectFields: GqlUpdateProjectFields;
  UpdateProjectInput: GqlUpdateProjectInput;
  UpdateProjectMemberFields: GqlUpdateProjectMemberFields;
  UpdateProjectMemberInput: GqlUpdateProjectMemberInput;
  UpdateSongFields: GqlUpdateSongFields;
  UpdateSongInput: GqlUpdateSongInput;
  UpdateUserFields: GqlUpdateUserFields;
  UpdateUserInput: GqlUpdateUserInput;
  Upload: PartiallyResolvedUpload;
  UploadSlot: Omit<GqlUploadSlot, 'upload'> & { upload: GqlResolversParentTypes['Upload'] };
  User: PartiallyResolvedUser;
  UserConnection: Omit<GqlUserConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['User']>> };
  UserConnectionFilters: GqlUserConnectionFilters;
  UserConnectionInput: GqlUserConnectionInput;
  WriteFileFields: GqlWriteFileFields;
  WriteFileInput: GqlWriteFileInput;
}>;

export type GqlAccountResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Account'] = GqlResolversParentTypes['Account']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlAccountConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['AccountConnection'] = GqlResolversParentTypes['AccountConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['Account']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlAiVoiceSessionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['AiVoiceSession'] = GqlResolversParentTypes['AiVoiceSession']> = ResolversObject<{
  clientSecret?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  model?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  voice?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlBillingPortalSessionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['BillingPortalSession'] = GqlResolversParentTypes['BillingPortalSession']> = ResolversObject<{
  url?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCfoClientResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CfoClient'] = GqlResolversParentTypes['CfoClient']> = ResolversObject<{
  balanceSheet?: Resolver<Array<GqlResolversTypes['QuickBooksBalanceSheetPeriod']>, ParentType, ContextType>;
  connection?: Resolver<Maybe<GqlResolversTypes['QuickBooksConnection']>, ParentType, ContextType>;
  membership?: Resolver<GqlResolversTypes['CfoMembership'], ParentType, ContextType>;
  profitAndLoss?: Resolver<Array<GqlResolversTypes['QuickBooksProfitAndLossPeriod']>, ParentType, ContextType>;
  snapshot?: Resolver<Maybe<GqlResolversTypes['QuickBooksCompanySnapshot']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCfoInviteResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CfoInvite'] = GqlResolversParentTypes['CfoInvite']> = ResolversObject<{
  email?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  invitedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  role?: Resolver<GqlResolversTypes['CfoRole'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['CfoInviteStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCfoMembershipResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CfoMembership'] = GqlResolversParentTypes['CfoMembership']> = ResolversObject<{
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  joinedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  role?: Resolver<GqlResolversTypes['CfoRole'], ParentType, ContextType>;
  user?: Resolver<GqlResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCheckoutSessionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CheckoutSession'] = GqlResolversParentTypes['CheckoutSession']> = ResolversObject<{
  amountTotal?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  checkoutUrl?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  deliveryAvailable?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  mode?: Resolver<GqlResolversTypes['CheckoutMode'], ParentType, ContextType>;
  productKey?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  productName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<GqlResolversTypes['CheckoutProvider'], ParentType, ContextType>;
  recurringInterval?: Resolver<Maybe<GqlResolversTypes['SubscriptionInterval']>, ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['CheckoutSessionStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCreditDocumentResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CreditDocument'] = GqlResolversParentTypes['CreditDocument']> = ResolversObject<{
  amountMinorUnits?: Resolver<Maybe<GqlResolversTypes['Int']>, ParentType, ContextType>;
  attachedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  fileName?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  goodsDescription?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  kind?: Resolver<GqlResolversTypes['CreditDocumentKind'], ParentType, ContextType>;
  portOfDischarge?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  portOfLoading?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  reference?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  shipmentDate?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  uploadId?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCreditFindingResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CreditFinding'] = GqlResolversParentTypes['CreditFinding']> = ResolversObject<{
  code?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  detail?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  documentId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  severity?: Resolver<GqlResolversTypes['CreditFindingSeverity'], ParentType, ContextType>;
  title?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlCreditLcResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CreditLc'] = GqlResolversParentTypes['CreditLc']> = ResolversObject<{
  amountMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  applicant?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  beneficiary?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  documents?: Resolver<Array<GqlResolversTypes['CreditDocument']>, ParentType, ContextType>;
  documentsRequired?: Resolver<Array<GqlResolversTypes['String']>, ParentType, ContextType>;
  expiryDate?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  findings?: Resolver<Array<GqlResolversTypes['CreditFinding']>, ParentType, ContextType>;
  goodsDescription?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  ingestedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  issueDate?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  issuingBank?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  latestShipmentDate?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  partialShipments?: Resolver<GqlResolversTypes['ShipmentTerm'], ParentType, ContextType>;
  portOfDischarge?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  portOfLoading?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  presentationPeriodDays?: Resolver<Maybe<GqlResolversTypes['Int']>, ParentType, ContextType>;
  reference?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  tolerancePercent?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  transhipment?: Resolver<GqlResolversTypes['ShipmentTerm'], ParentType, ContextType>;
  uploadId?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlDocumentInterpretationResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['DocumentInterpretation'] = GqlResolversParentTypes['DocumentInterpretation']> = ResolversObject<{
  documentType?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  fields?: Resolver<Array<GqlResolversTypes['InterpretedField']>, ParentType, ContextType>;
  keyPoints?: Resolver<Array<GqlResolversTypes['String']>, ParentType, ContextType>;
  pageCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  summary?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlDriveAlbumResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['DriveAlbum'] = GqlResolversParentTypes['DriveAlbum']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  entryCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  updatedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlDriveEntryResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['DriveEntry'] = GqlResolversParentTypes['DriveEntry']> = ResolversObject<{
  caption?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  capturedTime?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  contentType?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  fileUrl?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  kind?: Resolver<GqlResolversTypes['DriveEntryKind'], ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  parentId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  shared?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  sizeBytes?: Resolver<Maybe<GqlResolversTypes['Int']>, ParentType, ContextType>;
  starred?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  thumbUploadId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  thumbUrl?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  trashedTime?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  updatedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  uploadId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlDriveEntryConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['DriveEntryConnection'] = GqlResolversParentTypes['DriveEntryConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['DriveEntry']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlEntryFieldResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['EntryField'] = GqlResolversParentTypes['EntryField']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  fieldKey?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  fieldType?: Resolver<GqlResolversTypes['EntryFieldType'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  label?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  options?: Resolver<Maybe<Array<GqlResolversTypes['String']>>, ParentType, ContextType>;
  position?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  required?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlEntryRecordResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['EntryRecord'] = GqlResolversParentTypes['EntryRecord']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  updatedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  valuesJson?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlEntryRecordConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['EntryRecordConnection'] = GqlResolversParentTypes['EntryRecordConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['EntryRecord']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlFileUrlResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['FileUrl'] = GqlResolversParentTypes['FileUrl']> = ResolversObject<{
  url?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlFlowLineResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['FlowLine'] = GqlResolversParentTypes['FlowLine']> = ResolversObject<{
  actualsMinorUnits?: Resolver<Array<Maybe<GqlResolversTypes['Int']>>, ParentType, ContextType>;
  budgetsMinorUnits?: Resolver<Array<GqlResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  label?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  linkedCategory?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  position?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  section?: Resolver<GqlResolversTypes['FlowSection'], ParentType, ContextType>;
  variancesMinorUnits?: Resolver<Array<Maybe<GqlResolversTypes['Int']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlFlowLinkableCategoriesResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['FlowLinkableCategories'] = GqlResolversParentTypes['FlowLinkableCategories']> = ResolversObject<{
  expenseCategories?: Resolver<Array<GqlResolversTypes['String']>, ParentType, ContextType>;
  incomeCategories?: Resolver<Array<GqlResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlFlowTemplateResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['FlowTemplate'] = GqlResolversParentTypes['FlowTemplate']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  lines?: Resolver<Array<GqlResolversTypes['FlowLine']>, ParentType, ContextType>;
  monthCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  months?: Resolver<Array<GqlResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  startMonth?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GqlIdScalarConfig extends GraphQLScalarTypeConfig<GqlResolversTypes['Id'], any> {
  name: 'Id';
}

export interface GqlInstantScalarConfig extends GraphQLScalarTypeConfig<GqlResolversTypes['Instant'], any> {
  name: 'Instant';
}

export type GqlInterpretedFieldResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['InterpretedField'] = GqlResolversParentTypes['InterpretedField']> = ResolversObject<{
  label?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlJobRunResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['JobRun'] = GqlResolversParentTypes['JobRun']> = ResolversObject<{
  error?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  finishedAt?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  jobName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  scheduledFor?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  startedAt?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['JobRunStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlMutationResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Mutation'] = GqlResolversParentTypes['Mutation']> = ResolversObject<{
  addDriveAlbumEntry?: Resolver<GqlResolversTypes['DriveAlbum'], ParentType, ContextType, RequireFields<GqlMutationAddDriveAlbumEntryArgs, 'input'>>;
  addProjectMember?: Resolver<GqlResolversTypes['ProjectMembership'], ParentType, ContextType, RequireFields<GqlMutationAddProjectMemberArgs, 'input'>>;
  beginQuickBooksAuthorization?: Resolver<GqlResolversTypes['QuickBooksAuthorization'], ParentType, ContextType, RequireFields<GqlMutationBeginQuickBooksAuthorizationArgs, 'input'>>;
  cancelTestSubscription?: Resolver<GqlResolversTypes['PaymentSubscription'], ParentType, ContextType>;
  cfoConnectMyBooks?: Resolver<GqlResolversTypes['QuickBooksConnection'], ParentType, ContextType, RequireFields<GqlMutationCfoConnectMyBooksArgs, 'input'>>;
  cfoDisconnectMyBooks?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  cfoExportClientStatementsXlsx?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationCfoExportClientStatementsXlsxArgs, 'input'>>;
  cfoInviteClient?: Resolver<GqlResolversTypes['CfoInvite'], ParentType, ContextType, RequireFields<GqlMutationCfoInviteClientArgs, 'input'>>;
  cfoRevokeInvite?: Resolver<GqlResolversTypes['CfoInvite'], ParentType, ContextType, RequireFields<GqlMutationCfoRevokeInviteArgs, 'input'>>;
  clearDriveLibrary?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  completeQuickBooksAuthorization?: Resolver<GqlResolversTypes['QuickBooksConnection'], ParentType, ContextType, RequireFields<GqlMutationCompleteQuickBooksAuthorizationArgs, 'input'>>;
  completeTestCheckoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlMutationCompleteTestCheckoutSessionArgs, 'input'>>;
  connectMyBooks?: Resolver<GqlResolversTypes['QuickBooksConnection'], ParentType, ContextType, RequireFields<GqlMutationConnectMyBooksArgs, 'input'>>;
  connectQuickBooks?: Resolver<GqlResolversTypes['QuickBooksConnection'], ParentType, ContextType, RequireFields<GqlMutationConnectQuickBooksArgs, 'input'>>;
  createAccount?: Resolver<GqlResolversTypes['Account'], ParentType, ContextType, RequireFields<GqlMutationCreateAccountArgs, 'input'>>;
  createAiVoiceSession?: Resolver<GqlResolversTypes['AiVoiceSession'], ParentType, ContextType>;
  createBillingPortalSession?: Resolver<GqlResolversTypes['BillingPortalSession'], ParentType, ContextType, RequireFields<GqlMutationCreateBillingPortalSessionArgs, 'input'>>;
  createCheckoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlMutationCreateCheckoutSessionArgs, 'input'>>;
  createDriveAlbum?: Resolver<GqlResolversTypes['DriveAlbum'], ParentType, ContextType, RequireFields<GqlMutationCreateDriveAlbumArgs, 'input'>>;
  createDriveFolder?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationCreateDriveFolderArgs, 'input'>>;
  createEntryField?: Resolver<GqlResolversTypes['EntryField'], ParentType, ContextType, RequireFields<GqlMutationCreateEntryFieldArgs, 'input'>>;
  createEntryRecord?: Resolver<GqlResolversTypes['EntryRecord'], ParentType, ContextType, RequireFields<GqlMutationCreateEntryRecordArgs, 'input'>>;
  createProject?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlMutationCreateProjectArgs, 'input'>>;
  createSong?: Resolver<GqlResolversTypes['Song'], ParentType, ContextType, RequireFields<GqlMutationCreateSongArgs, 'input'>>;
  createSubscriptionCheckoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlMutationCreateSubscriptionCheckoutSessionArgs, 'input'>>;
  createUpload?: Resolver<GqlResolversTypes['UploadSlot'], ParentType, ContextType, RequireFields<GqlMutationCreateUploadArgs, 'input'>>;
  createUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType, RequireFields<GqlMutationCreateUserArgs, 'input'>>;
  creditAttachDocument?: Resolver<GqlResolversTypes['CreditDocument'], ParentType, ContextType, RequireFields<GqlMutationCreditAttachDocumentArgs, 'input'>>;
  creditDeleteLc?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationCreditDeleteLcArgs, 'input'>>;
  creditIngestLc?: Resolver<GqlResolversTypes['CreditLc'], ParentType, ContextType, RequireFields<GqlMutationCreditIngestLcArgs, 'input'>>;
  creditRemoveDocument?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationCreditRemoveDocumentArgs, 'input'>>;
  deleteDriveAlbum?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteDriveAlbumArgs, 'input'>>;
  deleteDriveEntry?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteDriveEntryArgs, 'input'>>;
  deleteEntryField?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteEntryFieldArgs, 'input'>>;
  deleteEntryRecord?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteEntryRecordArgs, 'input'>>;
  deleteSong?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteSongArgs, 'input'>>;
  deleteUpload?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationDeleteUploadArgs, 'input'>>;
  disconnectMyBooks?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  disconnectQuickBooks?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  exportQuickBooksStatementsXlsx?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationExportQuickBooksStatementsXlsxArgs, 'input'>>;
  finalizeUpload?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationFinalizeUploadArgs, 'input'>>;
  flowAddLine?: Resolver<GqlResolversTypes['FlowLine'], ParentType, ContextType, RequireFields<GqlMutationFlowAddLineArgs, 'input'>>;
  flowCreateTemplate?: Resolver<GqlResolversTypes['FlowTemplate'], ParentType, ContextType, RequireFields<GqlMutationFlowCreateTemplateArgs, 'input'>>;
  flowDeleteTemplate?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationFlowDeleteTemplateArgs, 'input'>>;
  flowExportTemplateXlsx?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationFlowExportTemplateXlsxArgs, 'input'>>;
  flowImportTemplateXlsx?: Resolver<GqlResolversTypes['FlowTemplate'], ParentType, ContextType, RequireFields<GqlMutationFlowImportTemplateXlsxArgs, 'input'>>;
  flowRemoveLine?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationFlowRemoveLineArgs, 'input'>>;
  flowRenameTemplate?: Resolver<GqlResolversTypes['FlowTemplate'], ParentType, ContextType, RequireFields<GqlMutationFlowRenameTemplateArgs, 'input'>>;
  flowUpdateLine?: Resolver<GqlResolversTypes['FlowLine'], ParentType, ContextType, RequireFields<GqlMutationFlowUpdateLineArgs, 'input'>>;
  interpretDocument?: Resolver<GqlResolversTypes['DocumentInterpretation'], ParentType, ContextType, RequireFields<GqlMutationInterpretDocumentArgs, 'input'>>;
  moveDriveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationMoveDriveEntryArgs, 'input'>>;
  pitchCreateDeck?: Resolver<GqlResolversTypes['PitchDeck'], ParentType, ContextType, RequireFields<GqlMutationPitchCreateDeckArgs, 'input'>>;
  pitchDeleteDeck?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationPitchDeleteDeckArgs, 'input'>>;
  pitchExportDeckPdf?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationPitchExportDeckPdfArgs, 'input'>>;
  pitchUpdateDeck?: Resolver<GqlResolversTypes['PitchDeck'], ParentType, ContextType, RequireFields<GqlMutationPitchUpdateDeckArgs, 'input'>>;
  pitchUpdateSlide?: Resolver<GqlResolversTypes['PitchSlide'], ParentType, ContextType, RequireFields<GqlMutationPitchUpdateSlideArgs, 'input'>>;
  registerDriveFile?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationRegisterDriveFileArgs, 'input'>>;
  registerPushDevice?: Resolver<GqlResolversTypes['PushDevice'], ParentType, ContextType, RequireFields<GqlMutationRegisterPushDeviceArgs, 'input'>>;
  removeDriveAlbumEntry?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationRemoveDriveAlbumEntryArgs, 'input'>>;
  removeProjectMember?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationRemoveProjectMemberArgs, 'input'>>;
  renameDriveAlbum?: Resolver<GqlResolversTypes['DriveAlbum'], ParentType, ContextType, RequireFields<GqlMutationRenameDriveAlbumArgs, 'input'>>;
  renameDriveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationRenameDriveEntryArgs, 'input'>>;
  replaceDriveEntryMedia?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationReplaceDriveEntryMediaArgs, 'input'>>;
  restoreDriveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationRestoreDriveEntryArgs, 'input'>>;
  setDriveEntryCaption?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationSetDriveEntryCaptionArgs, 'input'>>;
  setDriveEntryStarred?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationSetDriveEntryStarredArgs, 'input'>>;
  shareDriveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationShareDriveEntryArgs, 'input'>>;
  trashDriveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlMutationTrashDriveEntryArgs, 'input'>>;
  unregisterPushDevice?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GqlMutationUnregisterPushDeviceArgs, 'input'>>;
  updateEntryField?: Resolver<GqlResolversTypes['EntryField'], ParentType, ContextType, RequireFields<GqlMutationUpdateEntryFieldArgs, 'input'>>;
  updateEntryRecord?: Resolver<GqlResolversTypes['EntryRecord'], ParentType, ContextType, RequireFields<GqlMutationUpdateEntryRecordArgs, 'input'>>;
  updateProject?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlMutationUpdateProjectArgs, 'input'>>;
  updateProjectMember?: Resolver<GqlResolversTypes['ProjectMembership'], ParentType, ContextType, RequireFields<GqlMutationUpdateProjectMemberArgs, 'input'>>;
  updateSong?: Resolver<GqlResolversTypes['Song'], ParentType, ContextType, RequireFields<GqlMutationUpdateSongArgs, 'input'>>;
  updateUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType, RequireFields<GqlMutationUpdateUserArgs, 'input'>>;
  writeFile?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType, RequireFields<GqlMutationWriteFileArgs, 'input'>>;
}>;

export type GqlPageInfoResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PageInfo'] = GqlResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPaymentSubscriptionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PaymentSubscription'] = GqlResolversParentTypes['PaymentSubscription']> = ResolversObject<{
  amountTotal?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  currentPeriodEnd?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  productKey?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  productName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<GqlResolversTypes['CheckoutProvider'], ParentType, ContextType>;
  recurringInterval?: Resolver<GqlResolversTypes['SubscriptionInterval'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['SubscriptionStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPitchDeckResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PitchDeck'] = GqlResolversParentTypes['PitchDeck']> = ResolversObject<{
  accentColor?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  companyName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  logoUploadId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  slides?: Resolver<Array<GqlResolversTypes['PitchSlide']>, ParentType, ContextType>;
  tagline?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPitchDeckDataResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PitchDeckData'] = GqlResolversParentTypes['PitchDeckData']> = ResolversObject<{
  averageNetIncomeMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  cashSeries?: Resolver<Array<GqlResolversTypes['PitchSeriesPoint']>, ParentType, ContextType>;
  companyName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  customerCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  expenseSeries?: Resolver<Array<GqlResolversTypes['PitchSeriesPoint']>, ParentType, ContextType>;
  latestCashMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  netIncomeSeries?: Resolver<Array<GqlResolversTypes['PitchSeriesPoint']>, ParentType, ContextType>;
  netMarginPercent?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  paidInvoiceCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  revenueGrowthPercent?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  revenueSeries?: Resolver<Array<GqlResolversTypes['PitchSeriesPoint']>, ParentType, ContextType>;
  runwayMonths?: Resolver<Maybe<GqlResolversTypes['Int']>, ParentType, ContextType>;
  trailingTwelveMonthRevenueMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPitchSeriesPointResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PitchSeriesPoint'] = GqlResolversParentTypes['PitchSeriesPoint']> = ResolversObject<{
  minorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  month?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPitchSlideResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PitchSlide'] = GqlResolversParentTypes['PitchSlide']> = ResolversObject<{
  body?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  included?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<GqlResolversTypes['PitchSlideKind'], ParentType, ContextType>;
  position?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlProjectResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Project'] = GqlResolversParentTypes['Project']> = ResolversObject<{
  archivedAt?: Resolver<Maybe<GqlResolversTypes['Instant']>, ParentType, ContextType>;
  createdBy?: Resolver<GqlResolversTypes['User'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  description?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  memberships?: Resolver<Array<GqlResolversTypes['ProjectMembership']>, ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['ProjectStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlProjectConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['ProjectConnection'] = GqlResolversParentTypes['ProjectConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['Project']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlProjectMembershipResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['ProjectMembership'] = GqlResolversParentTypes['ProjectMembership']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  project?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType>;
  role?: Resolver<GqlResolversTypes['ProjectMembershipRole'], ParentType, ContextType>;
  user?: Resolver<GqlResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPurchaseResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Purchase'] = GqlResolversParentTypes['Purchase']> = ResolversObject<{
  amountTotal?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  buyerEmail?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  checkoutSessionId?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  productKey?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  productName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<GqlResolversTypes['CheckoutProvider'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPurchaseConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PurchaseConnection'] = GqlResolversParentTypes['PurchaseConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['Purchase']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlPushDeviceResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PushDevice'] = GqlResolversParentTypes['PushDevice']> = ResolversObject<{
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  endpoint?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  platform?: Resolver<GqlResolversTypes['PushDevicePlatform'], ParentType, ContextType>;
  rotatedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQueryResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Query'] = GqlResolversParentTypes['Query']> = ResolversObject<{
  accounts?: Resolver<GqlResolversTypes['AccountConnection'], ParentType, ContextType, RequireFields<GqlQueryAccountsArgs, 'input'>>;
  cfoClient?: Resolver<GqlResolversTypes['CfoClient'], ParentType, ContextType, RequireFields<GqlQueryCfoClientArgs, 'clientUserId'>>;
  cfoClients?: Resolver<Array<GqlResolversTypes['CfoClient']>, ParentType, ContextType>;
  cfoInvites?: Resolver<Array<GqlResolversTypes['CfoInvite']>, ParentType, ContextType>;
  cfoMyMembership?: Resolver<GqlResolversTypes['CfoMembership'], ParentType, ContextType>;
  checkoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlQueryCheckoutSessionArgs, 'id'>>;
  creditLc?: Resolver<GqlResolversTypes['CreditLc'], ParentType, ContextType, RequireFields<GqlQueryCreditLcArgs, 'lcId'>>;
  creditLcs?: Resolver<Array<GqlResolversTypes['CreditLc']>, ParentType, ContextType>;
  currentUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType>;
  driveAlbum?: Resolver<GqlResolversTypes['DriveAlbum'], ParentType, ContextType, RequireFields<GqlQueryDriveAlbumArgs, 'albumId'>>;
  driveAlbums?: Resolver<Array<GqlResolversTypes['DriveAlbum']>, ParentType, ContextType>;
  driveEntries?: Resolver<GqlResolversTypes['DriveEntryConnection'], ParentType, ContextType, RequireFields<GqlQueryDriveEntriesArgs, 'input'>>;
  driveEntry?: Resolver<GqlResolversTypes['DriveEntry'], ParentType, ContextType, RequireFields<GqlQueryDriveEntryArgs, 'id'>>;
  entryFieldCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  entryFieldUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryEntryFieldUpdateFormSchemaArgs, 'input'>>;
  entryFields?: Resolver<Array<GqlResolversTypes['EntryField']>, ParentType, ContextType>;
  entryRecordCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  entryRecordUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryEntryRecordUpdateFormSchemaArgs, 'input'>>;
  entryRecords?: Resolver<GqlResolversTypes['EntryRecordConnection'], ParentType, ContextType, RequireFields<GqlQueryEntryRecordsArgs, 'input'>>;
  fileUrl?: Resolver<GqlResolversTypes['FileUrl'], ParentType, ContextType, RequireFields<GqlQueryFileUrlArgs, 'uploadId'>>;
  flowLinkableCategories?: Resolver<GqlResolversTypes['FlowLinkableCategories'], ParentType, ContextType>;
  flowTemplate?: Resolver<GqlResolversTypes['FlowTemplate'], ParentType, ContextType, RequireFields<GqlQueryFlowTemplateArgs, 'templateId'>>;
  flowTemplates?: Resolver<Array<GqlResolversTypes['FlowTemplate']>, ParentType, ContextType>;
  jobRuns?: Resolver<Array<GqlResolversTypes['JobRun']>, ParentType, ContextType, Partial<GqlQueryJobRunsArgs>>;
  myBooksConnection?: Resolver<Maybe<GqlResolversTypes['QuickBooksConnection']>, ParentType, ContextType>;
  mySubscription?: Resolver<Maybe<GqlResolversTypes['PaymentSubscription']>, ParentType, ContextType, Partial<GqlQueryMySubscriptionArgs>>;
  pitchDeck?: Resolver<GqlResolversTypes['PitchDeck'], ParentType, ContextType, RequireFields<GqlQueryPitchDeckArgs, 'deckId'>>;
  pitchDeckData?: Resolver<Maybe<GqlResolversTypes['PitchDeckData']>, ParentType, ContextType>;
  pitchDecks?: Resolver<Array<GqlResolversTypes['PitchDeck']>, ParentType, ContextType>;
  project?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlQueryProjectArgs, 'id'>>;
  projectCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  projectUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryProjectUpdateFormSchemaArgs, 'input'>>;
  projects?: Resolver<GqlResolversTypes['ProjectConnection'], ParentType, ContextType, RequireFields<GqlQueryProjectsArgs, 'input'>>;
  purchases?: Resolver<GqlResolversTypes['PurchaseConnection'], ParentType, ContextType, RequireFields<GqlQueryPurchasesArgs, 'input'>>;
  quickBooksBalanceSheet?: Resolver<Array<GqlResolversTypes['QuickBooksBalanceSheetPeriod']>, ParentType, ContextType>;
  quickBooksCompanySnapshot?: Resolver<GqlResolversTypes['QuickBooksCompanySnapshot'], ParentType, ContextType>;
  quickBooksCustomers?: Resolver<Array<GqlResolversTypes['QuickBooksCustomer']>, ParentType, ContextType>;
  quickBooksInvoices?: Resolver<Array<GqlResolversTypes['QuickBooksInvoice']>, ParentType, ContextType, Partial<GqlQueryQuickBooksInvoicesArgs>>;
  quickBooksProfitAndLoss?: Resolver<Array<GqlResolversTypes['QuickBooksProfitAndLossPeriod']>, ParentType, ContextType>;
  quickBooksStatus?: Resolver<GqlResolversTypes['QuickBooksStatus'], ParentType, ContextType>;
  shopProduct?: Resolver<GqlResolversTypes['ShopProduct'], ParentType, ContextType>;
  shopProducts?: Resolver<Array<GqlResolversTypes['ShopProduct']>, ParentType, ContextType>;
  song?: Resolver<GqlResolversTypes['Song'], ParentType, ContextType, RequireFields<GqlQuerySongArgs, 'id'>>;
  songCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  songUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQuerySongUpdateFormSchemaArgs, 'input'>>;
  songs?: Resolver<GqlResolversTypes['SongConnection'], ParentType, ContextType, RequireFields<GqlQuerySongsArgs, 'input'>>;
  userCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  userUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryUserUpdateFormSchemaArgs, 'input'>>;
  users?: Resolver<GqlResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<GqlQueryUsersArgs, 'input'>>;
}>;

export type GqlQuickBooksAuthorizationResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksAuthorization'] = GqlResolversParentTypes['QuickBooksAuthorization']> = ResolversObject<{
  authorizationUrl?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksBalanceSheetPeriodResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksBalanceSheetPeriod'] = GqlResolversParentTypes['QuickBooksBalanceSheetPeriod']> = ResolversObject<{
  assetLines?: Resolver<Array<GqlResolversTypes['QuickBooksStatementLine']>, ParentType, ContextType>;
  equityLines?: Resolver<Array<GqlResolversTypes['QuickBooksStatementLine']>, ParentType, ContextType>;
  liabilityLines?: Resolver<Array<GqlResolversTypes['QuickBooksStatementLine']>, ParentType, ContextType>;
  month?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  totalAssetsMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  totalEquityMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  totalLiabilitiesMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksCompanySnapshotResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksCompanySnapshot'] = GqlResolversParentTypes['QuickBooksCompanySnapshot']> = ResolversObject<{
  companyName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  customerCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  openInvoiceCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  outstandingMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  overdueInvoiceCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  overdueMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  paidInvoiceCount?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  revenueMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksConnection'] = GqlResolversParentTypes['QuickBooksConnection']> = ResolversObject<{
  companyName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  connectedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  mode?: Resolver<GqlResolversTypes['QuickBooksMode'], ParentType, ContextType>;
  provider?: Resolver<GqlResolversTypes['AccountingProvider'], ParentType, ContextType>;
  realmId?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksCustomerResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksCustomer'] = GqlResolversParentTypes['QuickBooksCustomer']> = ResolversObject<{
  city?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  companyName?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  customerSince?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  openBalanceMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  state?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksInvoiceResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksInvoice'] = GqlResolversParentTypes['QuickBooksInvoice']> = ResolversObject<{
  balanceMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  customerId?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  customerName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  docNumber?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  dueDate?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  issueDate?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['QuickBooksInvoiceStatus'], ParentType, ContextType>;
  totalMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksProfitAndLossPeriodResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksProfitAndLossPeriod'] = GqlResolversParentTypes['QuickBooksProfitAndLossPeriod']> = ResolversObject<{
  expenseLines?: Resolver<Array<GqlResolversTypes['QuickBooksStatementLine']>, ParentType, ContextType>;
  incomeLines?: Resolver<Array<GqlResolversTypes['QuickBooksStatementLine']>, ParentType, ContextType>;
  month?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  netIncomeMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  totalExpensesMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  totalIncomeMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksStatementLineResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksStatementLine'] = GqlResolversParentTypes['QuickBooksStatementLine']> = ResolversObject<{
  category?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  minorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlQuickBooksStatusResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['QuickBooksStatus'] = GqlResolversParentTypes['QuickBooksStatus']> = ResolversObject<{
  connected?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  connection?: Resolver<Maybe<GqlResolversTypes['QuickBooksConnection']>, ParentType, ContextType>;
  mode?: Resolver<GqlResolversTypes['QuickBooksMode'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlSchemaFormResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['SchemaForm'] = GqlResolversParentTypes['SchemaForm']> = ResolversObject<{
  defaultData?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  jsonSchema?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  uiSchema?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlShopProductResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['ShopProduct'] = GqlResolversParentTypes['ShopProduct']> = ResolversObject<{
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  priceMinorUnits?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  tagline?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlSongResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Song'] = GqlResolversParentTypes['Song']> = ResolversObject<{
  artist?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  chartRank?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  genre?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  notes?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  streamsBillions?: Resolver<Maybe<GqlResolversTypes['Float']>, ParentType, ContextType>;
  title?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  updatedTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  year?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlSongConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['SongConnection'] = GqlResolversParentTypes['SongConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['Song']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlUploadResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Upload'] = GqlResolversParentTypes['Upload']> = ResolversObject<{
  contentType?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  fileName?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  sizeBytes?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['UploadStatus'], ParentType, ContextType>;
  visibility?: Resolver<GqlResolversTypes['UploadVisibility'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlUploadSlotResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['UploadSlot'] = GqlResolversParentTypes['UploadSlot']> = ResolversObject<{
  headersJson?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  upload?: Resolver<GqlResolversTypes['Upload'], ParentType, ContextType>;
  uploadId?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  uploadUrl?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlUserResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['User'] = GqlResolversParentTypes['User']> = ResolversObject<{
  account?: Resolver<Maybe<GqlResolversTypes['Account']>, ParentType, ContextType>;
  avatarUploadId?: Resolver<Maybe<GqlResolversTypes['Id']>, ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  displayName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['UserStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlUserConnectionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['UserConnection'] = GqlResolversParentTypes['UserConnection']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<GqlResolversTypes['User']>>, ParentType, ContextType>;
  pageInfo?: Resolver<GqlResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GqlResolvers<ContextType = GraphqlRequestContext> = ResolversObject<{
  Account?: GqlAccountResolvers<ContextType>;
  AccountConnection?: GqlAccountConnectionResolvers<ContextType>;
  AiVoiceSession?: GqlAiVoiceSessionResolvers<ContextType>;
  BillingPortalSession?: GqlBillingPortalSessionResolvers<ContextType>;
  CfoClient?: GqlCfoClientResolvers<ContextType>;
  CfoInvite?: GqlCfoInviteResolvers<ContextType>;
  CfoMembership?: GqlCfoMembershipResolvers<ContextType>;
  CheckoutSession?: GqlCheckoutSessionResolvers<ContextType>;
  CreditDocument?: GqlCreditDocumentResolvers<ContextType>;
  CreditFinding?: GqlCreditFindingResolvers<ContextType>;
  CreditLc?: GqlCreditLcResolvers<ContextType>;
  DocumentInterpretation?: GqlDocumentInterpretationResolvers<ContextType>;
  DriveAlbum?: GqlDriveAlbumResolvers<ContextType>;
  DriveEntry?: GqlDriveEntryResolvers<ContextType>;
  DriveEntryConnection?: GqlDriveEntryConnectionResolvers<ContextType>;
  EntryField?: GqlEntryFieldResolvers<ContextType>;
  EntryRecord?: GqlEntryRecordResolvers<ContextType>;
  EntryRecordConnection?: GqlEntryRecordConnectionResolvers<ContextType>;
  FileUrl?: GqlFileUrlResolvers<ContextType>;
  FlowLine?: GqlFlowLineResolvers<ContextType>;
  FlowLinkableCategories?: GqlFlowLinkableCategoriesResolvers<ContextType>;
  FlowTemplate?: GqlFlowTemplateResolvers<ContextType>;
  Id?: GraphQLScalarType;
  Instant?: GraphQLScalarType;
  InterpretedField?: GqlInterpretedFieldResolvers<ContextType>;
  JobRun?: GqlJobRunResolvers<ContextType>;
  Mutation?: GqlMutationResolvers<ContextType>;
  PageInfo?: GqlPageInfoResolvers<ContextType>;
  PaymentSubscription?: GqlPaymentSubscriptionResolvers<ContextType>;
  PitchDeck?: GqlPitchDeckResolvers<ContextType>;
  PitchDeckData?: GqlPitchDeckDataResolvers<ContextType>;
  PitchSeriesPoint?: GqlPitchSeriesPointResolvers<ContextType>;
  PitchSlide?: GqlPitchSlideResolvers<ContextType>;
  Project?: GqlProjectResolvers<ContextType>;
  ProjectConnection?: GqlProjectConnectionResolvers<ContextType>;
  ProjectMembership?: GqlProjectMembershipResolvers<ContextType>;
  Purchase?: GqlPurchaseResolvers<ContextType>;
  PurchaseConnection?: GqlPurchaseConnectionResolvers<ContextType>;
  PushDevice?: GqlPushDeviceResolvers<ContextType>;
  Query?: GqlQueryResolvers<ContextType>;
  QuickBooksAuthorization?: GqlQuickBooksAuthorizationResolvers<ContextType>;
  QuickBooksBalanceSheetPeriod?: GqlQuickBooksBalanceSheetPeriodResolvers<ContextType>;
  QuickBooksCompanySnapshot?: GqlQuickBooksCompanySnapshotResolvers<ContextType>;
  QuickBooksConnection?: GqlQuickBooksConnectionResolvers<ContextType>;
  QuickBooksCustomer?: GqlQuickBooksCustomerResolvers<ContextType>;
  QuickBooksInvoice?: GqlQuickBooksInvoiceResolvers<ContextType>;
  QuickBooksProfitAndLossPeriod?: GqlQuickBooksProfitAndLossPeriodResolvers<ContextType>;
  QuickBooksStatementLine?: GqlQuickBooksStatementLineResolvers<ContextType>;
  QuickBooksStatus?: GqlQuickBooksStatusResolvers<ContextType>;
  SchemaForm?: GqlSchemaFormResolvers<ContextType>;
  ShopProduct?: GqlShopProductResolvers<ContextType>;
  Song?: GqlSongResolvers<ContextType>;
  SongConnection?: GqlSongConnectionResolvers<ContextType>;
  Upload?: GqlUploadResolvers<ContextType>;
  UploadSlot?: GqlUploadSlotResolvers<ContextType>;
  User?: GqlUserResolvers<ContextType>;
  UserConnection?: GqlUserConnectionResolvers<ContextType>;
}>;

