import { sql } from "drizzle-orm"
import { check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allCreditDocumentKinds = [
    "COMMERCIAL_INVOICE",
    "BILL_OF_LADING",
    "PACKING_LIST",
    "OTHER",
] as const
export type CreditDocumentKind = (typeof allCreditDocumentKinds)[number]

/**
 * A supporting document dropped against a letter of credit. One table
 * serves every kind with nullable columns — an invoice carries an amount,
 * a bill of lading carries the on-board date and ports, a packing list
 * mostly just its goods description. The discrepancy engine compares
 * whatever a document states against the LC and skips what it doesn't.
 */
export const creditDocumentsTable = baseTable(
    "credit_documents",
    {
        // References credit_lcs.id by convention (no cross-domain FK).
        lcId: text("lc_id").notNull(),
        userId: text("user_id").notNull(),
        uploadId: text("upload_id").notNull(),
        kind: text("kind", { enum: allCreditDocumentKinds }).notNull(),
        fileName: text("file_name"),
        reference: text("reference"),
        currency: text("currency"),
        amountMinorUnits: integer("amount_minor_units"),
        // The bill of lading's shipped-on-board date, ISO yyyy-mm-dd.
        shipmentDate: text("shipment_date"),
        portOfLoading: text("port_of_loading"),
        portOfDischarge: text("port_of_discharge"),
        goodsDescription: text("goods_description"),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "credit_documents_kind_check",
            sql`${table.kind} IN ('COMMERCIAL_INVOICE', 'BILL_OF_LADING', 'PACKING_LIST', 'OTHER')`,
        ),
    ],
)

export type CreditDocument = typeof creditDocumentsTable.$inferSelect
export type NewCreditDocument = typeof creditDocumentsTable.$inferInsert

export const creditDocumentInsertSchema = createInsertSchema(creditDocumentsTable, {
    lcId: (schema) => schema.trim().min(1),
    userId: (schema) => schema.trim().min(1),
    uploadId: (schema) => schema.trim().min(1),
    currency: (schema) => schema.trim().toLowerCase().length(3).optional().nullable(),
    amountMinorUnits: (schema) => schema.int().positive().optional().nullable(),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
