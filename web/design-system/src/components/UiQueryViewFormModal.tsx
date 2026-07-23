import React, { useEffect, useId, useMemo, useState } from "react"
import { parseSchemaForm, type SchemaFormPayload } from "../forms/parseSchemaForm"
import { SchemaFormRuntime, type SchemaFormData } from "../forms/SchemaFormRuntime"
import { Button } from "../primitives/Button"
import { Dialog } from "../primitives/Dialog"
import { Spinner } from "../primitives/Spinner"
import { ErrorPanel } from "./ErrorBoundary"
import { Skeleton } from "./Skeleton"
import * as styles from "./UiQueryViewFormModal.styles.css"

export interface UiQueryViewFormModalProps {
    open: boolean
    title: string
    /** Backend SchemaForm payload; undefined while the schema query is in flight. */
    schemaForm?: SchemaFormPayload
    /** Merged over the schema's defaultData, e.g. to prefill accountId. */
    defaultDataOverrides?: Record<string, unknown>
    loading?: boolean
    error?: string
    submitting?: boolean
    submitError?: string
    submitLabel?: string
    onSubmit: (formData: SchemaFormData) => void | Promise<void>
    onClose: () => void
}

/**
 * Dialog + SchemaFormRuntime for create/edit flows. The caller owns data
 * fetching (schema query) and submission (mutation + refetchQueries); this
 * component owns the loading / error / submitting presentation.
 */
export function UiQueryViewFormModal({
    open,
    title,
    schemaForm,
    defaultDataOverrides,
    loading,
    error,
    submitting,
    submitError,
    submitLabel = "Save",
    onSubmit,
    onClose,
}: UiQueryViewFormModalProps): React.ReactElement {
    const formId = useId()

    const parsed = useMemo(() => {
        if (!schemaForm) {
            return undefined
        }
        const parsedSchemaForm = parseSchemaForm(schemaForm)
        if (defaultDataOverrides) {
            parsedSchemaForm.defaultData = { ...parsedSchemaForm.defaultData, ...defaultDataOverrides }
        }
        return parsedSchemaForm
    }, [schemaForm, defaultDataOverrides])

    const [formData, setFormData] = useState<SchemaFormData>({})
    useEffect(() => {
        setFormData(parsed?.defaultData ?? {})
    }, [parsed])

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose()
                }
            }}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} disabled={submitting || !parsed}>
                        {submitting ? <Spinner size="sm" /> : null}
                        {submitting ? "Saving..." : submitLabel}
                    </Button>
                </>
            }
        >
            {error ? <ErrorPanel title="Failed to load form" message={error} /> : null}
            {!error && (loading || !parsed) ? <FormSkeleton /> : null}
            {!error && parsed ? (
                <>
                    <SchemaFormRuntime
                        id={formId}
                        schemaForm={parsed}
                        formData={formData}
                        onFormDataChange={setFormData}
                        onSubmit={(submittedData) => {
                            void onSubmit(submittedData)
                        }}
                        disabled={submitting}
                    />
                    {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
                </>
            ) : null}
        </Dialog>
    )
}

function FormSkeleton(): React.ReactElement {
    return (
        <div className={styles.loadingBody} aria-label="Loading form">
            <Skeleton height={14} width="30%" />
            <Skeleton height={34} />
            <Skeleton height={14} width="40%" />
            <Skeleton height={34} />
            <Skeleton height={14} width="25%" />
            <Skeleton height={34} />
        </div>
    )
}
