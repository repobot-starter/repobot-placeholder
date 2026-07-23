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
  id: Scalars['Id']['output'];
  /** Product snapshot taken at checkout time. */
  productName: Scalars['String']['output'];
  provider: CheckoutProvider;
  status: CheckoutSessionStatus;
};

export type CheckoutSessionStatus =
  | 'PAID'
  | 'PENDING';

export type CompleteTestCheckoutSessionInput = {
  sessionId: Scalars['Id']['input'];
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

export type CreateCheckoutSessionFields = {
  /** The web app's origin (window.location.origin); success/cancel redirects are built from it. */
  origin: Scalars['String']['input'];
};

export type CreateCheckoutSessionInput = {
  fields: CreateCheckoutSessionFields;
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

export type CreateUserFields = {
  accountId: Scalars['Id']['input'];
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type CreateUserInput = {
  fields: CreateUserFields;
  idempotencyKey: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addProjectMember: ProjectMembership;
  completeTestCheckoutSession: CheckoutSession;
  createAccount: Account;
  createAiVoiceSession: AiVoiceSession;
  createCheckoutSession: CheckoutSession;
  createProject: Project;
  createUser: User;
  updateProject: Project;
  updateUser: User;
};


export type MutationAddProjectMemberArgs = {
  input: AddProjectMemberInput;
};


export type MutationCompleteTestCheckoutSessionArgs = {
  input: CompleteTestCheckoutSessionInput;
};


export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


export type MutationCreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationUpdateProjectArgs = {
  input: UpdateProjectInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
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

export type Query = {
  __typename?: 'Query';
  accounts: AccountConnection;
  checkoutSession: CheckoutSession;
  currentUser: User;
  project: Project;
  projectCreateFormSchema: SchemaForm;
  projectUpdateFormSchema: SchemaForm;
  projects: ProjectConnection;
  shopProduct: ShopProduct;
  userCreateFormSchema: SchemaForm;
  userUpdateFormSchema: SchemaForm;
  users: UserConnection;
};


export type QueryAccountsArgs = {
  input: AccountConnectionInput;
};


export type QueryCheckoutSessionArgs = {
  id: Scalars['Id']['input'];
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


export type QueryUserUpdateFormSchemaArgs = {
  input: SchemaFormUpdateInput;
};


export type QueryUsersArgs = {
  input: UserConnectionInput;
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

export type SortDirection =
  | 'asc'
  | 'desc';

export type SortOrderInput = {
  direction: SortDirection;
  fieldName: Scalars['String']['input'];
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

export type UpdateUserFields = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
};

export type UpdateUserInput = {
  fields: UpdateUserFields;
  idempotencyKey: Scalars['String']['input'];
  objectId: Scalars['Id']['input'];
};

export type User = {
  __typename?: 'User';
  account?: Maybe<Account>;
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

export type UserFieldsFragment = { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, account?: { __typename?: 'Account', id: string, name: string } | null };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, account?: { __typename?: 'Account', id: string, name: string } | null } };

export type UsersQueryVariables = Exact<{
  input: UserConnectionInput;
}>;


export type UsersQuery = { __typename?: 'Query', users: { __typename?: 'UserConnection', nodes: Array<{ __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, account?: { __typename?: 'Account', id: string, name: string } | null } | null>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, account?: { __typename?: 'Account', id: string, name: string } | null } };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, email: string, displayName: string, status: UserStatus, createdTime: string, account?: { __typename?: 'Account', id: string, name: string } | null } };

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

export type CheckoutSessionFieldsFragment = { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productName: string, amountTotal: number, currency: string, createdTime: string };

export type ShopProductQueryVariables = Exact<{ [key: string]: never; }>;


export type ShopProductQuery = { __typename?: 'Query', shopProduct: { __typename?: 'ShopProduct', key: string, name: string, tagline: string, priceMinorUnits: number, currency: string } };

export type CheckoutSessionQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;


export type CheckoutSessionQuery = { __typename?: 'Query', checkoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productName: string, amountTotal: number, currency: string, createdTime: string } };

export type CreateCheckoutSessionMutationVariables = Exact<{
  input: CreateCheckoutSessionInput;
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', createCheckoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productName: string, amountTotal: number, currency: string, createdTime: string } };

export type CompleteTestCheckoutSessionMutationVariables = Exact<{
  input: CompleteTestCheckoutSessionInput;
}>;


export type CompleteTestCheckoutSessionMutation = { __typename?: 'Mutation', completeTestCheckoutSession: { __typename?: 'CheckoutSession', id: string, provider: CheckoutProvider, status: CheckoutSessionStatus, checkoutUrl: string, productName: string, amountTotal: number, currency: string, createdTime: string } };

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
  account {
    id
    name
  }
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
export const CheckoutSessionFieldsFragmentDoc = gql`
    fragment CheckoutSessionFields on CheckoutSession {
  id
  provider
  status
  checkoutUrl
  productName
  amountTotal
  currency
  createdTime
}
    `;
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