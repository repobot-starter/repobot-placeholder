import type { RegistryWidgetsType, TemplatesType } from "@rjsf/utils"
import React, { useEffect, useId, useMemo, useState } from "react"
import type { SchemaFormReferenceResolvers } from "../forms/EntityRefWidget"
import { parseSchemaForm, type SchemaFormPayload } from "../forms/parseSchemaForm"
import {
    SchemaFormRuntime,
    type SchemaFormData,
    type SchemaFormWizardState,
} from "../forms/SchemaFormRuntime"
import { Button } from "../primitives/Button"
import { Dialog } from "../primitives/Dialog"
import { Spinner } from "../primitives/Spinner"
import { type UiFormPresentation, type UiFormWidth } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
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
    /** Overrides the repobot.theme.json `ui.forms.presentation` preset per view (modal card, in-flow inline card, or full page). */
    presentation?: UiFormPresentation
    /** Overrides the repobot.theme.json `ui.forms.width` preset. */
    width?: UiFormWidth
    /** Extra rjsf widgets merged over the kernel set (see SchemaFormRuntime). */
    widgets?: RegistryWidgetsType
    /** Extra rjsf templates merged over the kernel set (see SchemaFormRuntime). */
    templates?: Partial<TemplatesType>
    /** Live data hookups for `entityRef` fields (see SchemaFormRuntime). */
    referenceResolvers?: SchemaFormReferenceResolvers
    onSubmit: (formData: SchemaFormData) => void | Promise<void>
    onClose: () => void
}

/**
 * Dialog + SchemaFormRuntime for create/edit flows. The caller owns data
 * fetching (schema query) and submission (mutation + refetchQueries); this
 * component owns the loading / error / submitting presentation.
 *
 * Presentation (centered modal, in-flow inline card, or full page with an
 * upper-left X) and width follow the repobot.theme.json `ui.forms` presets;
 * the props override per view — a quick-add can stay a modal while a big
 * ship-order flow takes the page. Validation renders inline (submitError
 * under the fields) — publish to the global error surface only for failures
 * unrelated to the user's input.
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
    presentation,
    width,
    widgets,
    templates,
    referenceResolvers,
    onSubmit,
    onClose,
}: UiQueryViewFormModalProps): React.ReactElement {
    const formId = useId()
    const headingId = useId()

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

    // Non-null when the uiSchema declares `ui:steps`: submission advances the
    // wizard, so the primary button reads "Next" until the last step.
    const [wizardState, setWizardState] = useState<SchemaFormWizardState | null>(null)

    const { ui } = useThemeContract()
    const resolvedPresentation = presentation ?? ui.forms.presentation
    const resolvedWidth = width ?? ui.forms.width

    const body = (
        <>
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
                        onWizardStateChange={setWizardState}
                        widgets={widgets}
                        templates={templates}
                        referenceResolvers={referenceResolvers}
                    />
                    {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
                </>
            ) : null}
        </>
    )

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
            </Button>
            <Button type="submit" form={formId} disabled={submitting || !parsed}>
                {submitting ? <Spinner size="sm" /> : null}
                {submitting
                    ? "Saving..."
                    : wizardState !== null && !wizardState.isLastStep
                      ? "Next"
                      : submitLabel}
            </Button>
        </>
    )

    if (resolvedPresentation === "inline") {
        // In-flow on the page (no portal, no overlay): the caller places the
        // card above/beside the content it feeds and keeps `open` in state
        // exactly like the dialog presentations.
        if (!open) {
            return <></>
        }
        return (
            <section
                className={`${styles.inlineCard} ${styles.inlineWidth[resolvedWidth]}`}
                aria-labelledby={headingId}
            >
                <div className={styles.inlineHeader}>
                    <h2 id={headingId} className={styles.inlineTitle}>
                        {title}
                    </h2>
                </div>
                <div className={styles.inlineBody}>{body}</div>
                <div className={styles.inlineFooter}>{footer}</div>
            </section>
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose()
                }
            }}
            title={title}
            presentation={resolvedPresentation}
            size={resolvedWidth}
            footer={footer}
        >
            {body}
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
