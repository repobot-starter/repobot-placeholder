import { Table } from "drizzle-orm"
import { NodePgDatabase, NodePgTransaction } from "drizzle-orm/node-postgres"

export type TInsertValue<TTable extends Table> = TTable["$inferInsert"]
export type TSelectValue<TTable extends Table> = TTable["$inferSelect"]
export type TUpdateValue<TTable extends Table> = Partial<TInsertValue<TTable>>

// Helpers accept any domain database (each has its own schema type) or a
// transaction within one.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type DatabaseOrTransaction = NodePgDatabase<any> | NodePgTransaction<any, any>
/* eslint-enable @typescript-eslint/no-explicit-any */
