/**
 * The authenticated caller attached to every GraphQL request context.
 *
 * authSubject/email come from the verified token. userId/accountId are
 * hydrated by looking up the application user by auth_subject (see
 * Services/Identity/PrincipalService.ts); they are undefined for callers
 * whose token verified but who have no application user yet.
 */
export interface Principal {
    authSubject: string
    email: string
    userId?: string
    accountId?: string
}
