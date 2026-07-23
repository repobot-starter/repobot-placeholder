import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { PartiallyResolvedAccount, PartiallyResolvedUser, PartiallyResolvedProject, PartiallyResolvedProjectMembership, PartiallyResolvedCheckoutSession } from '../src/Graphql/Resolvers/PartiallyResolved.js';
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
  id: Scalars['Id']['output'];
  /** Product snapshot taken at checkout time. */
  productName: Scalars['String']['output'];
  provider: GqlCheckoutProvider;
  status: GqlCheckoutSessionStatus;
};

export type GqlCheckoutSessionStatus =
  | 'PAID'
  | 'PENDING';

export type GqlCompleteTestCheckoutSessionInput = {
  sessionId: Scalars['Id']['input'];
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

export type GqlCreateCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
};

export type GqlCreateCheckoutSessionInput = {
  fields: GqlCreateCheckoutSessionFields;
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

export type GqlCreateUserFields = {
  accountId: Scalars['Id']['input'];
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type GqlCreateUserInput = {
  fields: GqlCreateUserFields;
  idempotencyKey: Scalars['String']['input'];
};

export type GqlMutation = {
  __typename?: 'Mutation';
  addProjectMember: GqlProjectMembership;
  completeTestCheckoutSession: GqlCheckoutSession;
  createAccount: GqlAccount;
  createAiVoiceSession: GqlAiVoiceSession;
  createCheckoutSession: GqlCheckoutSession;
  createProject: GqlProject;
  createUser: GqlUser;
  updateProject: GqlProject;
  updateUser: GqlUser;
};


export type GqlMutationAddProjectMemberArgs = {
  input: GqlAddProjectMemberInput;
};


export type GqlMutationCompleteTestCheckoutSessionArgs = {
  input: GqlCompleteTestCheckoutSessionInput;
};


export type GqlMutationCreateAccountArgs = {
  input: GqlCreateAccountInput;
};


export type GqlMutationCreateCheckoutSessionArgs = {
  input: GqlCreateCheckoutSessionInput;
};


export type GqlMutationCreateProjectArgs = {
  input: GqlCreateProjectInput;
};


export type GqlMutationCreateUserArgs = {
  input: GqlCreateUserInput;
};


export type GqlMutationUpdateProjectArgs = {
  input: GqlUpdateProjectInput;
};


export type GqlMutationUpdateUserArgs = {
  input: GqlUpdateUserInput;
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

export type GqlQuery = {
  __typename?: 'Query';
  accounts: GqlAccountConnection;
  checkoutSession: GqlCheckoutSession;
  currentUser: GqlUser;
  project: GqlProject;
  projectCreateFormSchema: GqlSchemaForm;
  projectUpdateFormSchema: GqlSchemaForm;
  projects: GqlProjectConnection;
  shopProduct: GqlShopProduct;
  userCreateFormSchema: GqlSchemaForm;
  userUpdateFormSchema: GqlSchemaForm;
  users: GqlUserConnection;
};


export type GqlQueryAccountsArgs = {
  input: GqlAccountConnectionInput;
};


export type GqlQueryCheckoutSessionArgs = {
  id: Scalars['Id']['input'];
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


export type GqlQueryUserUpdateFormSchemaArgs = {
  input: GqlSchemaFormUpdateInput;
};


export type GqlQueryUsersArgs = {
  input: GqlUserConnectionInput;
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

export type GqlSortDirection =
  | 'asc'
  | 'desc';

export type GqlSortOrderInput = {
  direction: GqlSortDirection;
  fieldName: Scalars['String']['input'];
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

export type GqlUpdateUserFields = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GqlUserStatus>;
};

export type GqlUpdateUserInput = {
  fields: GqlUpdateUserFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type GqlUser = {
  __typename?: 'User';
  account?: Maybe<GqlAccount>;
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
  AddProjectMemberFields: GqlAddProjectMemberFields;
  AddProjectMemberInput: GqlAddProjectMemberInput;
  AiVoiceSession: ResolverTypeWrapper<GqlAiVoiceSession>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CheckoutProvider: GqlCheckoutProvider;
  CheckoutSession: ResolverTypeWrapper<PartiallyResolvedCheckoutSession>;
  CheckoutSessionStatus: GqlCheckoutSessionStatus;
  CompleteTestCheckoutSessionInput: GqlCompleteTestCheckoutSessionInput;
  ConnectionInput: GqlConnectionInput;
  CreateAccountFields: GqlCreateAccountFields;
  CreateAccountInput: GqlCreateAccountInput;
  CreateCheckoutSessionFields: GqlCreateCheckoutSessionFields;
  CreateCheckoutSessionInput: GqlCreateCheckoutSessionInput;
  CreateProjectFields: GqlCreateProjectFields;
  CreateProjectInput: GqlCreateProjectInput;
  CreateUserFields: GqlCreateUserFields;
  CreateUserInput: GqlCreateUserInput;
  Id: ResolverTypeWrapper<Scalars['Id']['output']>;
  Instant: ResolverTypeWrapper<Scalars['Instant']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<GqlPageInfo>;
  PaginationInput: GqlPaginationInput;
  Project: ResolverTypeWrapper<PartiallyResolvedProject>;
  ProjectConnection: ResolverTypeWrapper<Omit<GqlProjectConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['Project']>> }>;
  ProjectConnectionFilters: GqlProjectConnectionFilters;
  ProjectConnectionInput: GqlProjectConnectionInput;
  ProjectMembership: ResolverTypeWrapper<PartiallyResolvedProjectMembership>;
  ProjectMembershipRole: GqlProjectMembershipRole;
  ProjectStatus: GqlProjectStatus;
  Query: ResolverTypeWrapper<{}>;
  SchemaForm: ResolverTypeWrapper<GqlSchemaForm>;
  SchemaFormUpdateInput: GqlSchemaFormUpdateInput;
  ShopProduct: ResolverTypeWrapper<GqlShopProduct>;
  SortDirection: GqlSortDirection;
  SortOrderInput: GqlSortOrderInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateProjectFields: GqlUpdateProjectFields;
  UpdateProjectInput: GqlUpdateProjectInput;
  UpdateUserFields: GqlUpdateUserFields;
  UpdateUserInput: GqlUpdateUserInput;
  User: ResolverTypeWrapper<PartiallyResolvedUser>;
  UserConnection: ResolverTypeWrapper<Omit<GqlUserConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversTypes['User']>> }>;
  UserConnectionFilters: GqlUserConnectionFilters;
  UserConnectionInput: GqlUserConnectionInput;
  UserStatus: GqlUserStatus;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GqlResolversParentTypes = ResolversObject<{
  Account: PartiallyResolvedAccount;
  AccountConnection: Omit<GqlAccountConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Account']>> };
  AccountConnectionFilters: GqlAccountConnectionFilters;
  AccountConnectionInput: GqlAccountConnectionInput;
  AddProjectMemberFields: GqlAddProjectMemberFields;
  AddProjectMemberInput: GqlAddProjectMemberInput;
  AiVoiceSession: GqlAiVoiceSession;
  Boolean: Scalars['Boolean']['output'];
  CheckoutSession: PartiallyResolvedCheckoutSession;
  CompleteTestCheckoutSessionInput: GqlCompleteTestCheckoutSessionInput;
  ConnectionInput: GqlConnectionInput;
  CreateAccountFields: GqlCreateAccountFields;
  CreateAccountInput: GqlCreateAccountInput;
  CreateCheckoutSessionFields: GqlCreateCheckoutSessionFields;
  CreateCheckoutSessionInput: GqlCreateCheckoutSessionInput;
  CreateProjectFields: GqlCreateProjectFields;
  CreateProjectInput: GqlCreateProjectInput;
  CreateUserFields: GqlCreateUserFields;
  CreateUserInput: GqlCreateUserInput;
  Id: Scalars['Id']['output'];
  Instant: Scalars['Instant']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  PageInfo: GqlPageInfo;
  PaginationInput: GqlPaginationInput;
  Project: PartiallyResolvedProject;
  ProjectConnection: Omit<GqlProjectConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['Project']>> };
  ProjectConnectionFilters: GqlProjectConnectionFilters;
  ProjectConnectionInput: GqlProjectConnectionInput;
  ProjectMembership: PartiallyResolvedProjectMembership;
  Query: {};
  SchemaForm: GqlSchemaForm;
  SchemaFormUpdateInput: GqlSchemaFormUpdateInput;
  ShopProduct: GqlShopProduct;
  SortOrderInput: GqlSortOrderInput;
  String: Scalars['String']['output'];
  UpdateProjectFields: GqlUpdateProjectFields;
  UpdateProjectInput: GqlUpdateProjectInput;
  UpdateUserFields: GqlUpdateUserFields;
  UpdateUserInput: GqlUpdateUserInput;
  User: PartiallyResolvedUser;
  UserConnection: Omit<GqlUserConnection, 'nodes'> & { nodes: Array<Maybe<GqlResolversParentTypes['User']>> };
  UserConnectionFilters: GqlUserConnectionFilters;
  UserConnectionInput: GqlUserConnectionInput;
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

export type GqlCheckoutSessionResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['CheckoutSession'] = GqlResolversParentTypes['CheckoutSession']> = ResolversObject<{
  amountTotal?: Resolver<GqlResolversTypes['Int'], ParentType, ContextType>;
  checkoutUrl?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  createdTime?: Resolver<GqlResolversTypes['Instant'], ParentType, ContextType>;
  currency?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<GqlResolversTypes['Id'], ParentType, ContextType>;
  productName?: Resolver<GqlResolversTypes['String'], ParentType, ContextType>;
  provider?: Resolver<GqlResolversTypes['CheckoutProvider'], ParentType, ContextType>;
  status?: Resolver<GqlResolversTypes['CheckoutSessionStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GqlIdScalarConfig extends GraphQLScalarTypeConfig<GqlResolversTypes['Id'], any> {
  name: 'Id';
}

export interface GqlInstantScalarConfig extends GraphQLScalarTypeConfig<GqlResolversTypes['Instant'], any> {
  name: 'Instant';
}

export type GqlMutationResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Mutation'] = GqlResolversParentTypes['Mutation']> = ResolversObject<{
  addProjectMember?: Resolver<GqlResolversTypes['ProjectMembership'], ParentType, ContextType, RequireFields<GqlMutationAddProjectMemberArgs, 'input'>>;
  completeTestCheckoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlMutationCompleteTestCheckoutSessionArgs, 'input'>>;
  createAccount?: Resolver<GqlResolversTypes['Account'], ParentType, ContextType, RequireFields<GqlMutationCreateAccountArgs, 'input'>>;
  createAiVoiceSession?: Resolver<GqlResolversTypes['AiVoiceSession'], ParentType, ContextType>;
  createCheckoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlMutationCreateCheckoutSessionArgs, 'input'>>;
  createProject?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlMutationCreateProjectArgs, 'input'>>;
  createUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType, RequireFields<GqlMutationCreateUserArgs, 'input'>>;
  updateProject?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlMutationUpdateProjectArgs, 'input'>>;
  updateUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType, RequireFields<GqlMutationUpdateUserArgs, 'input'>>;
}>;

export type GqlPageInfoResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['PageInfo'] = GqlResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<GqlResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<GqlResolversTypes['String']>, ParentType, ContextType>;
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

export type GqlQueryResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['Query'] = GqlResolversParentTypes['Query']> = ResolversObject<{
  accounts?: Resolver<GqlResolversTypes['AccountConnection'], ParentType, ContextType, RequireFields<GqlQueryAccountsArgs, 'input'>>;
  checkoutSession?: Resolver<GqlResolversTypes['CheckoutSession'], ParentType, ContextType, RequireFields<GqlQueryCheckoutSessionArgs, 'id'>>;
  currentUser?: Resolver<GqlResolversTypes['User'], ParentType, ContextType>;
  project?: Resolver<GqlResolversTypes['Project'], ParentType, ContextType, RequireFields<GqlQueryProjectArgs, 'id'>>;
  projectCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  projectUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryProjectUpdateFormSchemaArgs, 'input'>>;
  projects?: Resolver<GqlResolversTypes['ProjectConnection'], ParentType, ContextType, RequireFields<GqlQueryProjectsArgs, 'input'>>;
  shopProduct?: Resolver<GqlResolversTypes['ShopProduct'], ParentType, ContextType>;
  userCreateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType>;
  userUpdateFormSchema?: Resolver<GqlResolversTypes['SchemaForm'], ParentType, ContextType, RequireFields<GqlQueryUserUpdateFormSchemaArgs, 'input'>>;
  users?: Resolver<GqlResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<GqlQueryUsersArgs, 'input'>>;
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

export type GqlUserResolvers<ContextType = GraphqlRequestContext, ParentType extends GqlResolversParentTypes['User'] = GqlResolversParentTypes['User']> = ResolversObject<{
  account?: Resolver<Maybe<GqlResolversTypes['Account']>, ParentType, ContextType>;
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
  CheckoutSession?: GqlCheckoutSessionResolvers<ContextType>;
  Id?: GraphQLScalarType;
  Instant?: GraphQLScalarType;
  Mutation?: GqlMutationResolvers<ContextType>;
  PageInfo?: GqlPageInfoResolvers<ContextType>;
  Project?: GqlProjectResolvers<ContextType>;
  ProjectConnection?: GqlProjectConnectionResolvers<ContextType>;
  ProjectMembership?: GqlProjectMembershipResolvers<ContextType>;
  Query?: GqlQueryResolvers<ContextType>;
  SchemaForm?: GqlSchemaFormResolvers<ContextType>;
  ShopProduct?: GqlShopProductResolvers<ContextType>;
  User?: GqlUserResolvers<ContextType>;
  UserConnection?: GqlUserConnectionResolvers<ContextType>;
}>;

