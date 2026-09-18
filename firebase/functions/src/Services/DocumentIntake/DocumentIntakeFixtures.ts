/**
 * Deterministic structured-extraction fixtures for AI_MODE=local.
 *
 * The sandbox has no model, so document intake resolves structured
 * extraction from this registry instead: a fixture document (a PDF a pack
 * bundles as sample content) carries a marker line in its visible text —
 *
 *     REPOBOT-INTAKE-FIXTURE: <key>
 *
 * — and extractStructured returns the payload registered under that key.
 * Packs that ship drag-and-drop demos (e.g. the letter-of-credit pack's
 * sample LC + document sets) register their fixtures here, next to the
 * kernel exemplar, so the whole demo path works credential-free and
 * deterministically. Deploys with AI_MODE=openai|gateway never consult
 * this registry — the real model reads the real document.
 */
export const intakeFixtureMarker = /REPOBOT-INTAKE-FIXTURE:\s*([A-Za-z0-9_-]+)/

/**
 * Structured payloads by fixture key. Payloads are plain JSON — the same
 * shape the AI path would return for that document.
 */
export const intakeFixtures: Record<string, unknown> = {
    // Kernel exemplar: what a fixture registration looks like. Tests pin
    // the mechanism against it; packs add their own entries below.
    "intake-exemplar": {
        documentKind: "EXEMPLAR",
        title: "Document intake exemplar",
        fields: { reference: "EX-2026-001", amount: 1250.5 },
    },

    // The credit pack's sample set (packs/credit): one letter of credit and
    // three supporting documents, shipped as PDFs under
    // web/app/public/samples/credit/. The set is deliberately imperfect —
    // the invoice exceeds the credit amount beyond the 5% tolerance and the
    // bill of lading ships four days late — so the sandbox demo produces a
    // real discrepancy report. Dates are fixed (mid-2027) so the breakdown's
    // countdowns stay positive without recomputing the PDFs.
    "credit-sample-lc": {
        documentKind: "LETTER_OF_CREDIT",
        reference: "LC-2026-0815",
        issuingBank: "First Meridian Bank",
        applicant: "Atlas Trading GmbH",
        beneficiary: "Pacific Textiles Ltd",
        currency: "USD",
        amount: 184500,
        tolerancePercent: 5,
        issueDate: "2026-07-15",
        expiryDate: "2027-06-30",
        latestShipmentDate: "2027-05-31",
        presentationPeriodDays: 21,
        portOfLoading: "Shanghai",
        portOfDischarge: "Hamburg",
        partialShipments: "NOT_ALLOWED",
        transhipment: "ALLOWED",
        goodsDescription: "100% cotton knitted T-shirts, 14,000 pieces, as per proforma invoice PI-2244",
        documentsRequired: [
            "Signed commercial invoice in triplicate",
            "Full set clean on board ocean bills of lading",
            "Packing list in duplicate",
        ],
    },
    "credit-sample-invoice": {
        documentKind: "COMMERCIAL_INVOICE",
        reference: "INV-88213",
        currency: "USD",
        amount: 195300,
        portOfLoading: "Shanghai",
        portOfDischarge: "Hamburg",
        goodsDescription: "100% cotton knitted T-shirts, 14,000 pieces",
    },
    "credit-sample-bl": {
        documentKind: "BILL_OF_LADING",
        reference: "MSCUAB123456",
        shipmentDate: "2027-06-04",
        portOfLoading: "Shanghai",
        portOfDischarge: "Hamburg",
        goodsDescription: "100% cotton knitted T-shirts, 14,000 pieces",
    },
    "credit-sample-packing-list": {
        documentKind: "PACKING_LIST",
        reference: "PL-88213",
        goodsDescription: "100% cotton knitted T-shirts, 14,000 pieces in 560 cartons",
    },
}
