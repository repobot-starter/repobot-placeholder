import { SignJWT } from "jose"
import { AuthIdentity } from "../../../Data/Identity/AuthIdentity.js"
import { GUEST_DISPLAY_NAME, guestEmailForSubject } from "../GuestIdentity.js"
import { builtinAuthJwtSecret } from "../TokenVerifier.js"
import { userService } from "../UserService.js"

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60

export interface MintedSession {
    accessToken: string
    expiresInSeconds: number
}

/**
 * Mints built-in auth access tokens. Minting is also the identity-linking
 * moment: the
 * application user is created or linked before the JWT is signed, so every
 * token carries the app's user_id/account_id and `users.auth_subject` is
 * always populated by the time a request arrives.
 */
class AuthTokenService {
    async mintAccessToken(identity: AuthIdentity): Promise<MintedSession> {
        const email = identity.email ?? guestEmailForSubject(identity.id)
        const user = await userService.linkOrCreateUserForAuthSubject({
            authSubject: identity.id,
            email,
            displayName: identity.displayName ?? (identity.isAnonymous ? GUEST_DISPLAY_NAME : undefined),
            idempotencyKey: `builtin:${identity.id}`,
        })

        const claims: Record<string, unknown> = {
            role: "authenticated",
            user_id: user.id,
            account_id: user.accountId,
        }
        if (identity.isAnonymous) {
            claims.is_anonymous = true
        } else {
            claims.email = email
        }

        const accessToken = await new SignJWT(claims)
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(identity.id)
            .setIssuer("builtin-auth")
            .setIssuedAt()
            .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
            .sign(builtinAuthJwtSecret())

        return { accessToken, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS }
    }
}

export const authTokenService = new AuthTokenService()
