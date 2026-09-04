import { DocumentTemplateSummary } from "@base/core"
import { fieldLabel } from "./pdfForm"

/**
 * Starter HTML/CSS for the workbench's editors, mirroring the server
 * templates in firebase/functions/documents/templates/ so the live preview
 * opens looking like the PDF the server will render. Edits to these panes
 * restyle the preview only — the generated PDF binds the JSON data to the
 * repo's own template files (see packs/pdf/PACK.md).
 */

export interface StarterSource {
    html: string
    css: string
}

export function starterFor(template: DocumentTemplateSummary): StarterSource {
    return STARTERS[template.key] ?? genericStarter(template)
}

/** A key/value sheet for templates that ship without a hand-built starter. */
function genericStarter(template: DocumentTemplateSummary): StarterSource {
    const rows = Object.entries(template.fields)
        .filter(([, field]) => {
            const type = field.type ?? "string"
            return type === "string" || type === "number" || type === "boolean"
        })
        .map(
            ([key]) =>
                `            <div class="row"><span class="row-label">${fieldLabel(key)}</span><span class="row-value">{{${key}}}</span></div>`,
        )
        .join("\n")
    const html = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>${template.name}</title>
    </head>
    <body>
        <main class="sheet">
            <h1 class="sheet-title">${template.name}</h1>
${rows}
        </main>
    </body>
</html>
`
    const css = `body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #16181d;
    background: #ffffff;
}

.sheet {
    width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0.9in 0.8in;
}

.sheet-title {
    font-size: 28px;
    margin: 0 0 24px;
}

.row {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 13px;
}

.row-label {
    color: #6b7280;
}
`
    return { html, css }
}

const INVOICE_HTML = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>Invoice {{invoiceNumber}}</title>
    </head>
    <body>
        <main class="invoice-page">
            <header class="masthead">
                <div class="masthead-identity">
                    <div class="business-name">{{businessName}}</div>
                    {{#businessAddress}}
                    <div class="muted">{{businessAddress}}</div>
                    {{/businessAddress}}
                    {{#businessEmail}}
                    <div class="muted">{{businessEmail}}</div>
                    {{/businessEmail}}
                </div>
                <div class="masthead-badge">
                    <div class="doc-label">Invoice</div>
                    <div class="doc-number">{{invoiceNumber}}</div>
                </div>
            </header>

            <section class="meta-row">
                <div class="meta-block">
                    <span class="meta-label">Billed To</span>
                    <div class="client-name">{{clientName}}</div>
                    {{#clientAddress}}
                    <div class="muted">{{clientAddress}}</div>
                    {{/clientAddress}}
                    {{#clientEmail}}
                    <div class="muted">{{clientEmail}}</div>
                    {{/clientEmail}}
                </div>
                <div class="meta-block meta-dates">
                    <div>
                        <span class="meta-label">Issue Date</span>
                        <div class="meta-value">{{issueDate}}</div>
                    </div>
                    {{#dueDate}}
                    <div>
                        <span class="meta-label">Due Date</span>
                        <div class="meta-value">{{dueDate}}</div>
                    </div>
                    {{/dueDate}}
                </div>
            </section>

            <table class="line-table">
                <thead>
                    <tr>
                        <th class="col-description">Description</th>
                        <th class="col-qty">Qty</th>
                        <th class="col-amount">Unit Price</th>
                        <th class="col-amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {{#lineItems}}
                    <tr>
                        <td class="col-description">{{description}}</td>
                        <td class="col-qty">{{quantity}}</td>
                        <td class="col-amount">{{unitPrice}}</td>
                        <td class="col-amount">{{lineTotal}}</td>
                    </tr>
                    {{/lineItems}}
                </tbody>
            </table>

            <section class="totals">
                <div class="totals-row"><span>Subtotal</span><strong>{{subtotal}}</strong></div>
                {{#tax}}
                <div class="totals-row"><span>Tax</span><strong>{{tax}}</strong></div>
                {{/tax}}
                <div class="totals-row grand-total"><span>Total Due</span><strong>{{total}}</strong></div>
            </section>

            {{#notes}}
            <footer class="notes">
                <span class="meta-label">Notes</span>
                <p>{{notes}}</p>
            </footer>
            {{/notes}}
        </main>
    </body>
</html>
`

const INVOICE_CSS = `*,
*::before,
*::after {
    box-sizing: border-box;
}

body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #16181d;
    background: #ffffff;
}

.invoice-page {
    width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0.75in 0.7in;
}

.muted {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.5;
}

.masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid #16181d;
}

.business-name {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
}

.masthead-badge {
    text-align: right;
}

.doc-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #6b7280;
}

.doc-number {
    font-size: 16px;
    font-weight: 700;
    margin-top: 4px;
}

.meta-row {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin: 24px 0 28px;
}

.meta-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 5px;
}

.client-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
}

.meta-dates {
    display: flex;
    gap: 32px;
    text-align: right;
}

.meta-value {
    font-size: 13px;
    font-weight: 600;
}

.line-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.line-table th {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b7280;
    text-align: left;
    padding: 0 10px 8px;
    border-bottom: 1px solid #d1d5db;
}

.line-table td {
    padding: 10px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
}

.col-qty {
    width: 60px;
    text-align: right;
}

.col-amount {
    width: 110px;
    text-align: right;
}

.line-table th.col-qty,
.line-table th.col-amount {
    text-align: right;
}

.totals {
    margin-top: 16px;
    margin-left: auto;
    width: 280px;
    font-size: 13px;
}

.totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
}

.grand-total {
    margin-top: 6px;
    border-top: 2px solid #16181d;
    padding-top: 10px;
    font-size: 15px;
}

.notes {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
}

.notes p {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #374151;
}
`

const PITCH_DECK_HTML = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>{{companyName}} — Investor Deck</title>
    </head>
    <body>
        <main class="deck">
            <section class="slide cover">
                <header class="slide-head">
                    <span class="head-kicker">Investor deck</span>
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <div class="cover-body">
                    {{#hasLogo}}
                    <img class="cover-logo" src="{{logoDataUri}}" alt="{{companyName}} logo" />
                    {{/hasLogo}}
                    <h1 class="cover-name">{{companyName}}</h1>
                    {{#tagline}}
                    <p class="cover-tagline">{{tagline}}</p>
                    {{/tagline}}
                    <span class="cover-rule" style="background: {{accentColor}}"></span>
                </div>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>

            {{#hasTraction}}
            <section class="slide">
                <header class="slide-head">
                    <span class="head-title"
                        ><span class="head-chip" style="background: {{accentColor}}"></span
                        >{{tractionTitle}}</span
                    >
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <p class="slide-body">{{tractionBody}}</p>
                <div class="stat-grid">
                    {{#tractionStats}}
                    <div class="stat">
                        <div class="stat-value" style="color: {{accentColor}}">{{value}}</div>
                        <div class="stat-label">{{label}}</div>
                    </div>
                    {{/tractionStats}}
                </div>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>
            {{/hasTraction}} {{#hasRevenue}}
            <section class="slide">
                <header class="slide-head">
                    <span class="head-title"
                        ><span class="head-chip" style="background: {{accentColor}}"></span
                        >{{revenueTitle}}</span
                    >
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <p class="slide-body">{{revenueBody}}</p>
                <div class="chart">
                    {{#revenueBars}}
                    <div class="chart-column">
                        <div class="chart-value">{{value}}</div>
                        <div class="chart-track">
                            <div
                                class="chart-bar"
                                style="height: {{heightPercent}}%; background: {{accentColor}}"
                            ></div>
                        </div>
                        <div class="chart-label">{{label}}</div>
                    </div>
                    {{/revenueBars}}
                </div>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>
            {{/hasRevenue}} {{#hasMargins}}
            <section class="slide">
                <header class="slide-head">
                    <span class="head-title"
                        ><span class="head-chip" style="background: {{accentColor}}"></span
                        >{{marginsTitle}}</span
                    >
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <p class="slide-body">{{marginsBody}}</p>
                <div class="chart">
                    {{#netIncomeBars}}
                    <div class="chart-column">
                        <div class="chart-value">{{value}}</div>
                        <div class="chart-track">
                            <div
                                class="chart-bar"
                                style="height: {{heightPercent}}%; background: {{accentColor}}"
                            ></div>
                        </div>
                        <div class="chart-label">{{label}}</div>
                    </div>
                    {{/netIncomeBars}}
                </div>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>
            {{/hasMargins}} {{#hasRunway}}
            <section class="slide">
                <header class="slide-head">
                    <span class="head-title"
                        ><span class="head-chip" style="background: {{accentColor}}"></span
                        >{{runwayTitle}}</span
                    >
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <p class="slide-body">{{runwayBody}}</p>
                <div class="stat-row">
                    {{#runwayStats}}
                    <div class="stat">
                        <div class="stat-value" style="color: {{accentColor}}">{{value}}</div>
                        <div class="stat-label">{{label}}</div>
                    </div>
                    {{/runwayStats}}
                </div>
                <div class="chart chart-short">
                    {{#cashBars}}
                    <div class="chart-column">
                        <div class="chart-track">
                            <div
                                class="chart-bar"
                                style="height: {{heightPercent}}%; background: {{accentColor}}"
                            ></div>
                        </div>
                        <div class="chart-label">{{label}}</div>
                    </div>
                    {{/cashBars}}
                </div>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>
            {{/hasRunway}} {{#hasAsk}}
            <section class="slide">
                <header class="slide-head">
                    <span class="head-title"
                        ><span class="head-chip" style="background: {{accentColor}}"></span
                        >{{askTitle}}</span
                    >
                    <span class="head-brand">{{companyName}}</span>
                </header>
                <p class="slide-body slide-body-large">{{askBody}}</p>
                <footer class="slide-foot">
                    <span>{{companyName}}</span>
                    <span>Prepared {{preparedDate}} · Live from the books</span>
                </footer>
            </section>
            {{/hasAsk}}
        </main>
    </body>
</html>
`

const PITCH_DECK_CSS = `*,
*::before,
*::after {
    box-sizing: border-box;
}

/* A dark, landscape deck: near-black slides, hairline scaffolding, the
   accent reserved for bars and figures. Values and axis labels set in mono
   for a clear, technical read. */

body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #f2f4f8;
    background: #0b0e13;
    margin: 0;
}

.mono,
.chart-value,
.chart-label,
.stat-label,
.head-brand,
.head-kicker,
.slide-foot {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* One slide per landscape Letter page. */
.slide {
    width: 11in;
    height: 8.5in;
    margin: 0 auto;
    padding: 0.55in 0.7in 0.5in;
    background: #0b0e13;
    page-break-after: always;
    display: flex;
    flex-direction: column;
}

.slide:last-child {
    page-break-after: auto;
}

/* Every page: the title bar. */
.slide-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.head-title {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 27px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.head-chip {
    width: 10px;
    height: 10px;
    border-radius: 2px;
}

.head-kicker,
.head-brand {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #828b9c;
}

/* Every page: the footer rail. */
.slide-foot {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    justify-content: space-between;
    gap: 24px;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #6d7585;
}

/* Cover */

.cover-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.cover-logo {
    max-height: 84px;
    max-width: 260px;
    object-fit: contain;
    margin-bottom: 32px;
}

.cover-name {
    font-size: 66px;
    line-height: 1.05;
    margin: 0 0 18px;
    letter-spacing: -0.025em;
}

.cover-tagline {
    font-size: 21px;
    color: #a7afbf;
    margin: 0 0 36px;
    max-width: 7in;
    line-height: 1.5;
}

.cover-rule {
    display: inline-block;
    width: 64px;
    height: 5px;
    border-radius: 3px;
}

/* Body copy under the title bar. */
.slide-body {
    font-size: 14px;
    line-height: 1.6;
    color: #a7afbf;
    margin: 18px 0 22px;
    max-width: 8in;
}

.slide-body-large {
    font-size: 24px;
    line-height: 1.8;
    color: #dde2ea;
    max-width: 8.4in;
    margin: auto 0;
    padding-bottom: 0.5in;
}

/* Stat cards. The traction slide's 2×2 grid centers in the free height and
   scales its figures up; the runway slide's 3-across row stays compact so
   the cash chart below can breathe. */

.stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    align-content: center;
    flex: 1;
    margin-bottom: 0.25in;
}

.stat-grid .stat {
    padding: 34px 36px;
}

.stat-grid .stat-value {
    font-size: 46px;
}

.stat-grid .stat-label {
    margin-top: 12px;
    font-size: 11px;
}

.stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-bottom: 22px;
}

.stat-row .stat {
    align-self: stretch;
}

.stat {
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 20px 22px;
    align-self: start;
}

.stat-value {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.stat-label {
    margin-top: 8px;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #828b9c;
}

/* Pure-CSS column chart: the service precomputes heightPercent. Faint
   quarter-height gridlines keep the read technical without an axis. */
.chart {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex: 1;
    min-height: 0;
    padding-top: 14px;
    margin-bottom: 18px;
}

.chart-short {
    flex: 1;
    min-height: 0;
}

.chart-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    min-width: 0;
}

.chart-value {
    font-size: 8.5px;
    color: #828b9c;
    margin-bottom: 6px;
    white-space: nowrap;
}

.chart-track {
    width: 100%;
    flex: 1;
    display: flex;
    align-items: flex-end;
    background: repeating-linear-gradient(
        to top,
        rgba(255, 255, 255, 0.06) 0,
        rgba(255, 255, 255, 0.06) 1px,
        transparent 1px,
        transparent 25%
    );
}

.chart-bar {
    width: 100%;
    border-radius: 3px 3px 0 0;
}

.chart-label {
    margin-top: 8px;
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6d7585;
}
`

const STARTERS: Record<string, StarterSource> = {
    invoice: { html: INVOICE_HTML, css: INVOICE_CSS },
    "pitch-deck": { html: PITCH_DECK_HTML, css: PITCH_DECK_CSS },
}
