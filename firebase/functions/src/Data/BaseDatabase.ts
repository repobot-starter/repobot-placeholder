import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { commonPool } from "./CommonPool.js"

export type DomainDatabase<TSchema extends Record<string, unknown>> = NodePgDatabase<TSchema>

/**
 * Creates a drizzle database instance for one domain (Identity, Project, ...).
 *
 * Domain-per-database intent: each domain owns its own database handle and
 * schema so that domains never join across each other's tables. Today every
 * domain database shares one physical Postgres via the common pool; when a
 * domain needs to scale independently it can move to its own database (or
 * server) by changing only its Data/<Domain>Database.ts, because cross-domain
 * references are by-convention ids enforced in the service layer, never
 * cross-database foreign keys.
 */
export function createDomainDatabase<TSchema extends Record<string, unknown>>(
    schema: TSchema,
): DomainDatabase<TSchema> {
    // Lazily construct on first use so importing a domain database never
    // requires DATABASE_URL at module-load time (the functions emulator loads
    // code during discovery before request env is relevant, and tests set env
    // in hooks before the first query).
    let instance: DomainDatabase<TSchema> | undefined
    return new Proxy({} as DomainDatabase<TSchema>, {
        get(_target, property, receiver) {
            if (instance === undefined) {
                instance = drizzle({ client: commonPool(), schema })
            }
            const value = Reflect.get(instance, property, receiver)
            return typeof value === "function" ? value.bind(instance) : value
        },
    })
}
