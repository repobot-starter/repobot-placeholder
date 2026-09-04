import crypto from "node:crypto"

export function randomSuffix(): string {
    return crypto.randomUUID().slice(0, 8)
}

export function randomName(prefix: string): string {
    return `${prefix} ${randomSuffix()}`
}

export function randomEmail(): string {
    return `user-${crypto.randomUUID()}@example.test`
}

export function newIdempotencyKey(): string {
    return crypto.randomUUID()
}
