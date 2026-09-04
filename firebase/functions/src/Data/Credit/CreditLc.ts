import { sql } from "drizzle-orm"
import { check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allShipmentTerms = ["ALLOWED", "NOT_ALLOWED", "NOT_STATED"] as const
export type ShipmentTerm = (typeof allShipmentTerms)[number]

/**
 * A letter of credit ingested from a dropped PDF: the SWIFT MT700-family
 * fields the credit desk actually checks, as typed columns (dates are ISO
 * yyyy-mm-dd strings; money is integer minor units + ISO currency, per the
 * kernel money rule). The source PDF stays in the storage kernel under
 * uploadId; documentsRequired keeps the 46A list newline-joined.
 */
export const creditLcsTable = baseTable(
    "credit_lcs",
    {
        // The member who dropped the LC; rows are strictly per-user.
        userId: text("user_id").notNull(),
        uploadId: text("upload_id").notNull(),
        reference: text("reference").notNull(),
        issuingBank: text("issuing_bank"),
        applicant: text("applicant"),
        beneficiary: text("beneficiary"),
        currency: text("currency").notNull(),
        amountMinorUnits: integer("amount_minor_units").notNull(),
        // 39A percentage credit amount tolerance (plus side), whole percent.
        tolerancePercent: integer("tolerance_percent").notNull().default(0),
        issueDate: text("issue_date"),
        expiryDate: text("expiry_date").notNull(),
        latestShipmentDate: text("latest_shipment_date"),
        // 48: days after shipment the documents must be presented within.
        presentationPeriodDays: integer("presentation_period_days"),
        portOfLoading: text("port_of_loading"),
        portOfDischarge: text("port_of_discharge"),
        partialShipments: text("partial_shipments", { enum: allShipmentTerms })
            .notNull()
            .default("NOT_STATED"),
        transhipment: text("transhipment", { enum: allShipmentTerms }).notNull().default("NOT_STATED"),
        goodsDescription: text("goods_description").notNull(),
        // The 46A documents-required list, newline-joined.
        documentsRequired: text("documents_required").notNull(),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "credit_lcs_partial_shipments_check",
            sql`${table.partialShipments} IN ('ALLOWED', 'NOT_ALLOWED', 'NOT_STATED')`,
        ),
        check(
            "credit_lcs_transhipment_check",
            sql`${table.transhipment} IN ('ALLOWED', 'NOT_ALLOWED', 'NOT_STATED')`,
        ),
    ],
)

export type CreditLc = typeof creditLcsTable.$inferSelect
export type NewCreditLc = typeof creditLcsTable.$inferInsert

export const creditLcInsertSchema = createInsertSchema(creditLcsTable, {
    userId: (schema) => schema.trim().min(1),
    uploadId: (schema) => schema.trim().min(1),
    reference: (schema) => schema.trim().min(1),
    currency: (schema) => schema.trim().toLowerCase().length(3),
    amountMinorUnits: (schema) => schema.int().positive(),
    tolerancePercent: (schema) => schema.int().min(0).max(100),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
