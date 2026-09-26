import { describe, expect, it } from "vitest"
import {
    formatQuickBooksDate,
    formatQuickBooksMoney,
    invoiceMatchesSearch,
    type QuickBooksInvoiceNode,
} from "../../../src/View/Accounting/accountingShared"
import { sortInvoiceRows } from "../../../src/View/Accounting/InvoicesPage"
import {
    customerMatchesSearch,
    sortCustomerRows,
    type CustomerRow,
} from "../../../src/View/Accounting/CustomersPage"

function invoice(overrides: Partial<QuickBooksInvoiceNode>): QuickBooksInvoiceNode {
    return {
        id: "qbinv-1",
        docNumber: "INV-1001",
        customerId: "cust-1",
        customerName: "Harbor & Pine Cafe",
        status: "OPEN",
        issueDate: "2026-07-01",
        dueDate: "2026-07-31",
        totalMinorUnits: 245_000,
        balanceMinorUnits: 245_000,
        ...overrides,
    }
}

function customer(overrides: Partial<CustomerRow>): CustomerRow {
    return {
        id: "cust-1",
        displayName: "Harbor & Pine Cafe",
        companyName: "Harbor & Pine LLC",
        email: "accounts@harborandpine.example",
        city: "Portland",
        state: "OR",
        customerSince: "2024-01-15",
        openBalanceMinorUnits: 245_000,
        ...overrides,
    }
}

describe("accounting views", () => {
    it("formats QuickBooks minor units as currency per repo conventions", () => {
        expect(formatQuickBooksMoney(245_000)).toBe("$2,450.00")
        expect(formatQuickBooksMoney(0)).toBe("$0.00")
    })

    it("formats QuickBooks dates without timezone drift", () => {
        expect(formatQuickBooksDate("2026-07-01")).toContain("2026")
        expect(formatQuickBooksDate("2026-07-01")).toContain("1")
        expect(formatQuickBooksDate("not-a-date")).toBe("not-a-date")
    })

    it("matches invoices by document number and customer, case-insensitively", () => {
        const row = invoice({})
        expect(invoiceMatchesSearch(row, "")).toBe(true)
        expect(invoiceMatchesSearch(row, "inv-1001")).toBe(true)
        expect(invoiceMatchesSearch(row, "harbor")).toBe(true)
        expect(invoiceMatchesSearch(row, "meridian")).toBe(false)
    })

    it("sorts invoice rows by the visible columns in both directions", () => {
        const rows = [
            invoice({ id: "a", totalMinorUnits: 300, issueDate: "2026-07-03" }),
            invoice({ id: "b", totalMinorUnits: 100, issueDate: "2026-07-01" }),
            invoice({ id: "c", totalMinorUnits: 200, issueDate: "2026-07-02" }),
        ]
        expect(sortInvoiceRows(rows, { columnId: "total", direction: "asc" }).map((row) => row.id)).toEqual([
            "b",
            "c",
            "a",
        ])
        expect(
            sortInvoiceRows(rows, { columnId: "issueDate", direction: "desc" }).map((row) => row.id),
        ).toEqual(["a", "c", "b"])
        // Unknown columns leave the order untouched.
        expect(sortInvoiceRows(rows, { columnId: "nope", direction: "asc" }).map((row) => row.id)).toEqual([
            "a",
            "b",
            "c",
        ])
    })

    it("matches customers by name, company, and email", () => {
        const row = customer({})
        expect(customerMatchesSearch(row, "harbor")).toBe(true)
        expect(customerMatchesSearch(row, "LLC")).toBe(true)
        expect(customerMatchesSearch(row, "accounts@")).toBe(true)
        expect(customerMatchesSearch(row, "meridian")).toBe(false)
        expect(customerMatchesSearch(customer({ companyName: null }), "llc")).toBe(false)
    })

    it("sorts customer rows by open balance", () => {
        const rows = [
            customer({ id: "a", openBalanceMinorUnits: 50 }),
            customer({ id: "b", openBalanceMinorUnits: 200 }),
        ]
        expect(
            sortCustomerRows(rows, { columnId: "openBalance", direction: "desc" }).map((row) => row.id),
        ).toEqual(["b", "a"])
    })
})
