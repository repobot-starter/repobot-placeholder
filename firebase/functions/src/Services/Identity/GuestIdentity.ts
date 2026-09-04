/**
 * Anonymous (guest) sign-ins issue JWTs with `is_anonymous: true` and no
 * email claim. The identity layer is keyed by email, so guests get a
 * deterministic synthetic address derived from their auth subject. The
 * `.invalid` TLD guarantees it can never collide with (or mail to) a real
 * user address; linking a real email later goes through the normal
 * auth-subject match, since the subject is stable across the upgrade.
 */
export function guestEmailForSubject(authSubject: string): string {
    return `guest-${authSubject}@anonymous.invalid`
}

export const GUEST_DISPLAY_NAME = "Guest"

export function isAnonymousClaim(value: unknown): boolean {
    return value === true
}
