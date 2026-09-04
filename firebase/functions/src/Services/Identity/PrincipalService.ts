import { Principal } from "../../Utils/Principal.js"
import { getTokenVerifier, VerifiedToken } from "./TokenVerifier.js"
import { userService } from "./UserService.js"

/**
 * The fixed subject that scripts/bootstrap-env.mjs signs into the local dev
 * token. Only this subject is ever auto-provisioned.
 */
export const LOCAL_DEV_AUTH_SUBJECT = "local-dev-user"
const LOCAL_DEV_DISPLAY_NAME = "Local Dev"
const LOCAL_DEV_ACCOUNT_NAME = "Local Dev"

class PrincipalService {
    /**
     * Builds the request principal from an Authorization header, or undefined
     * when the header is absent. Verification failures throw UNAUTHENTICATED.
     */
    async principalFromAuthorizationHeader(
        authorizationHeader: string | undefined,
    ): Promise<Principal | undefined> {
        if (authorizationHeader === undefined || authorizationHeader === "") {
            return undefined
        }

        const token = authorizationHeader.replace(/^Bearer\s+/i, "")
        const verifiedToken = await getTokenVerifier().verify(token)
        return await this.hydratePrincipal(verifiedToken)
    }

    /**
     * Attaches the application user (userId/accountId) to a verified token's
     * identity by auth_subject lookup.
     *
     * In local mode, the well-known dev subject is auto-provisioned with a
     * "Local Dev" account and user (idempotently), so a fresh sandbox works
     * with zero setup: bootstrap:env signs a token, the first request creates
     * the dev user, and currentUser immediately resolves.
     */
    async hydratePrincipal(verifiedToken: VerifiedToken): Promise<Principal> {
        let user = await userService.getUserByAuthSubject(verifiedToken.authSubject)

        if (
            user === undefined &&
            process.env.AUTH_MODE === "local" &&
            verifiedToken.authSubject === LOCAL_DEV_AUTH_SUBJECT
        ) {
            user = await userService.linkOrCreateUserForAuthSubject({
                authSubject: verifiedToken.authSubject,
                email: verifiedToken.email,
                displayName: LOCAL_DEV_DISPLAY_NAME,
                accountName: LOCAL_DEV_ACCOUNT_NAME,
                idempotencyKey: `local-dev-provision:${verifiedToken.authSubject}`,
            })
        }

        return {
            authSubject: verifiedToken.authSubject,
            email: verifiedToken.email,
            userId: user?.id,
            accountId: user?.accountId,
        }
    }
}

export const principalService = new PrincipalService()
