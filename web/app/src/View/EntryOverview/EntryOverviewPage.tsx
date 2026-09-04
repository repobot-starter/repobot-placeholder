import {
    ActivityFeed,
    Badge,
    Button,
    StatCard,
    StatCardRow,
    UiQueryViewFormModal,
    type ActivityFeedItem,
} from "@ui"
import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { formatInstant } from "../../Utils/Dates"
import { useEntryFieldsQuery, useEntryRecordsQuery } from "../../generated/graphql/types"
import { parseEntryValues } from "../EntryRecords/entryValues"
import { useEntryRecordFormModal } from "../EntryRecords/useEntryRecordFormModal"
import * as styles from "./EntryOverviewPage.styles.css"

/**
 * The entry pack's signed-in home (manifest destination `/overview`): the
 * workbook at a glance — record and field counts, the latest entries, and
 * the one action that matters front and center: "New record" opens the
 * backend-built entry form in a modal, and the refetch after submit is the
 * data-refresh moment the whole flow demonstrates.
 */

const RECENT_COUNT = 8
const OVERVIEW_PAGE = 50

function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) {
        return "Working late"
    }
    if (hour < 12) {
        return "Good morning"
    }
    if (hour < 18) {
        return "Good afternoon"
    }
    return "Good evening"
}

export default function EntryOverviewPage(): React.ReactElement {
    const fieldsQuery = useEntryFieldsQuery()
    const recordsQuery = useEntryRecordsQuery({
        variables: {
            input: {
                connection: {
                    pagination: { first: OVERVIEW_PAGE },
                    sort: [{ fieldName: "rowCreatedAt", direction: "desc" }],
                },
            },
        },
    })
    const { formModal, openCreate } = useEntryRecordFormModal()

    const fields = fieldsQuery.data?.entryFields ?? []
    const records = useMemo(
        () => (recordsQuery.data?.entryRecords.nodes ?? []).flatMap((node) => (node ? [node] : [])),
        [recordsQuery.data],
    )
    const hasMore = recordsQuery.data?.entryRecords.pageInfo.hasNextPage ?? false

    // The first field is the row's headline in the activity feed — a contact
    // log leads with the name, an expense log with the merchant.
    const headlineField = fields[0]
    const activityItems: ActivityFeedItem[] = records.slice(0, RECENT_COUNT).map((record) => {
        const values = parseEntryValues(record.valuesJson)
        const headline = headlineField !== undefined ? String(values[headlineField.fieldKey] ?? "") : ""
        const rest = fields
            .slice(1, 3)
            .map((field) => values[field.fieldKey])
            .filter((value) => value !== undefined && value !== null && value !== "")
            .map((value) => String(value))
            .join(" · ")
        return {
            id: record.id,
            title: headline === "" ? "Record" : headline,
            meta: rest === "" ? undefined : rest,
            timestamp: formatInstant(record.createdTime),
        }
    })

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{greeting()}</h1>
                    <p className={styles.subtitle}>
                        Your workbook, at a glance — every record one modal away.
                    </p>
                </div>
                <Button onClick={openCreate}>New record</Button>
            </header>

            <StatCardRow>
                <StatCard
                    label="Records"
                    value={recordsQuery.loading ? "—" : `${records.length}${hasMore ? "+" : ""}`}
                    hint={hasMore ? `latest ${OVERVIEW_PAGE} loaded` : "in the workbook"}
                />
                <StatCard
                    label="Fields"
                    value={fieldsQuery.loading ? "—" : String(fields.length)}
                    hint="shape the entry form"
                />
                <StatCard
                    label="Last entry"
                    value={
                        records.length > 0 && records[0] !== undefined
                            ? formatInstant(records[0].createdTime)
                            : "—"
                    }
                    hint="newest record"
                />
            </StatCardRow>

            <div className={styles.columns}>
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent records</h2>
                        <Link className={styles.cardLink} to="/records">
                            View all
                        </Link>
                    </div>
                    <ActivityFeed
                        items={activityItems}
                        emptyState={{
                            title: "No records yet",
                            description: "Add the first one — the form follows your fields.",
                        }}
                    />
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Your fields</h2>
                        <Link className={styles.cardLink} to="/fields">
                            Design fields
                        </Link>
                    </div>
                    <ul className={styles.fieldList}>
                        {fields.map((field) => (
                            <li key={field.id} className={styles.fieldItem}>
                                <span className={styles.fieldLabel}>{field.label}</span>
                                <Badge tone={field.required ? "warning" : "neutral"}>
                                    {field.required ? "Required" : field.fieldType.toLowerCase()}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
        </div>
    )
}
