-- Letter-of-credit domain: LCs ingested from dropped PDFs and the supporting
-- documents checked against them. Matches src/Data/Credit/* exactly.
--
-- Dates are ISO yyyy-mm-dd text; money is integer minor units + ISO
-- currency (the kernel money rule). The source PDFs live in the storage
-- kernel (upload_id references uploads.id by convention, no cross-domain
-- FK). Discrepancies are computed by the service, never persisted.

CREATE TABLE credit_lcs (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK).
    user_id text NOT NULL,
    upload_id text NOT NULL,
    reference text NOT NULL,
    issuing_bank text,
    applicant text,
    beneficiary text,
    currency text NOT NULL,
    amount_minor_units integer NOT NULL,
    -- 39A percentage credit amount tolerance (plus side), whole percent.
    tolerance_percent integer NOT NULL DEFAULT 0,
    issue_date text,
    expiry_date text NOT NULL,
    latest_shipment_date text,
    -- 48: days after shipment the documents must be presented within.
    presentation_period_days integer,
    port_of_loading text,
    port_of_discharge text,
    partial_shipments text NOT NULL DEFAULT 'NOT_STATED'
        CONSTRAINT credit_lcs_partial_shipments_check
        CHECK (partial_shipments IN ('ALLOWED', 'NOT_ALLOWED', 'NOT_STATED')),
    transhipment text NOT NULL DEFAULT 'NOT_STATED'
        CONSTRAINT credit_lcs_transhipment_check
        CHECK (transhipment IN ('ALLOWED', 'NOT_ALLOWED', 'NOT_STATED')),
    goods_description text NOT NULL,
    -- The 46A documents-required list, newline-joined.
    documents_required text NOT NULL
);

CREATE TABLE credit_documents (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References credit_lcs.id by convention (same domain, still no FK —
    -- the service owns referential integrity).
    lc_id text NOT NULL,
    user_id text NOT NULL,
    upload_id text NOT NULL,
    kind text NOT NULL
        CONSTRAINT credit_documents_kind_check
        CHECK (kind IN ('COMMERCIAL_INVOICE', 'BILL_OF_LADING', 'PACKING_LIST', 'OTHER')),
    file_name text,
    reference text,
    currency text,
    amount_minor_units integer,
    -- The bill of lading's shipped-on-board date, ISO yyyy-mm-dd.
    shipment_date text,
    port_of_loading text,
    port_of_discharge text,
    goods_description text
);
