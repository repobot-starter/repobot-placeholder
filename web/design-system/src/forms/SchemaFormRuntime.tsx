import Form from "@rjsf/core"
import type {
    ArrayFieldTemplateProps,
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    RegistryWidgetsType,
    RJSFSchema,
    RJSFValidationError,
    TemplatesType,
    UiSchema,
    WidgetProps,
} from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "../primitives/Button"
import { Checkbox } from "../primitives/Checkbox"
import { Input } from "../primitives/Input"
import { Label } from "../primitives/Label"
import { RadioGroup } from "../primitives/RadioGroup"
import { Select } from "../primitives/Select"
import { Switch } from "../primitives/Switch"
import { TextArea } from "../primitives/TextArea"
import { EntityRefWidget, type SchemaFormReferenceResolvers } from "./EntityRefWidget"
import type { ParsedSchemaForm } from "./parseSchemaForm"
import {
    applyDerivations,
    derivedUiSchemaOverlay,
    mergeUiSchema,
    parseDerivedRules,
    parseSummaryConfig,
} from "./schemaFormDerivations"
import { SchemaFormSummaryTable } from "./SchemaFormSummary"
import * as styles from "./SchemaFormRuntime.styles.css"

export type SchemaFormData = Record<string, unknown>

/** One page of a multi-step form, declared by the backend in the uiSchema. */
export interface SchemaFormWizardStep {
    title: string
    description?: string
    /** Root property names this step renders (and validates). */
    fields: string[]
}

/** Reported to the host so its footer can relabel (Next vs. Save). */
export interface SchemaFormWizardState {
    step: number
    stepCount: number
    isLastStep: boolean
}

export interface SchemaFormRuntimeProps {
    /** DOM id of the rendered <form>; external buttons submit via form={id}. */
    id?: string
    schemaForm: ParsedSchemaForm
    formData: SchemaFormData
    onFormDataChange: (formData: SchemaFormData) => void
    onSubmit?: (formData: SchemaFormData) => void
    disabled?: boolean
    /** The default (true) hides rjsf's submit button so a modal footer owns submission. */
    hideSubmitButton?: boolean
    /**
     * Fires when the uiSchema declares `ui:steps` (null when it doesn't), and
     * on every step change — the host's submit button should read "Next"
     * until `isLastStep`. Submission advances steps; only the last step's
     * submit reaches `onSubmit`.
     */
    onWizardStateChange?: (state: SchemaFormWizardState | null) => void
    /**
     * Extra rjsf widgets merged over the kernel set (`schemaFormWidgets`).
     * The escape hatch for app-specific widgets — kernel widgets stay the
     * default for every `ui:widget` the docs list.
     */
    widgets?: RegistryWidgetsType
    /** Extra rjsf templates merged over the kernel set (`schemaFormTemplates`). */
    templates?: Partial<TemplatesType>
    /**
     * Live data hookups for `"ui:widget": "entityRef"` fields, keyed by the
     * uiSchema's `reference` name (see EntityRefWidget). Reaches widgets via
     * rjsf's formContext.
     */
    referenceResolvers?: SchemaFormReferenceResolvers
}

/**
 * Backend-driven form renderer: @rjsf/core + ajv8 validation with all widgets
 * and templates re-skinned using design-system primitives and theme tokens.
 *
 * Widget surface (all token-styled): text/email/url/password/number inputs,
 * textarea, date / datetime / time pickers, single select, radio group
 * (`"ui:widget": "radio"`), checkbox, switch (`"ui:widget": "switch"`),
 * multi-select checkbox groups (uniqueItems enum arrays), and editable
 * object/array lists with add, remove, and reorder controls.
 *
 * Layout: nested objects render as titled sections; `"ui:options": {
 * "columns": 2 }` on an object lays its scalar fields in a two-column grid
 * (textareas, arrays, and nested objects keep the full row; opt any field
 * out with `"ui:options": { "fullWidth": true } }`).
 *
 * Flows: a root-level `"ui:steps": [{ title, description?, fields }]`
 * renders the form as a wizard — a numbered step header, one page of fields
 * at a time, per-step validation on Next, one submit at the end.
 */
export function SchemaFormRuntime({
    id,
    schemaForm,
    formData,
    onFormDataChange,
    onSubmit,
    disabled,
    hideSubmitButton = true,
    onWizardStateChange,
    widgets,
    templates,
    referenceResolvers,
}: SchemaFormRuntimeProps): React.ReactElement {
    const steps = useMemo(() => parseWizardSteps(schemaForm.uiSchema), [schemaForm.uiSchema])
    const [stepIndex, setStepIndex] = useState(0)

    const formContext = useMemo(() => ({ referenceResolvers }), [referenceResolvers])

    const derivedRules = useMemo(
        () => parseDerivedRules(schemaForm.uiSchema as Record<string, unknown>),
        [schemaForm.uiSchema],
    )
    const summaryConfig = useMemo(
        () => parseSummaryConfig(schemaForm.uiSchema as Record<string, unknown>),
        [schemaForm.uiSchema],
    )

    /** Runs the `ui:derived` rules over outgoing data (identity when there are none). */
    const derive = useCallback(
        (data: SchemaFormData): SchemaFormData =>
            derivedRules.length === 0 ? data : applyDerivations(derivedRules, data).formData,
        [derivedRules],
    )

    // Derive over the initial/default data too (auto refs should show before
    // the first keystroke). applyDerivations is idempotent, so this settles
    // after one extra change notification.
    useEffect(() => {
        if (derivedRules.length === 0) {
            return
        }
        const result = applyDerivations(derivedRules, formData)
        if (result.changed) {
            onFormDataChange(result.formData)
        }
    }, [derivedRules, formData, onFormDataChange])

    const mergedWidgets = useMemo(
        () => (widgets === undefined ? schemaFormWidgets : { ...schemaFormWidgets, ...widgets }),
        [widgets],
    )
    const mergedTemplates = useMemo(
        () => (templates === undefined ? schemaFormTemplates : { ...schemaFormTemplates, ...templates }),
        [templates],
    )

    useEffect(() => {
        setStepIndex(0)
    }, [schemaForm])

    useEffect(() => {
        onWizardStateChange?.(
            steps === null
                ? null
                : { step: stepIndex, stepCount: steps.length, isLastStep: stepIndex === steps.length - 1 },
        )
    }, [steps, stepIndex, onWizardStateChange])

    const uiSchema = useMemo(() => {
        let base = schemaForm.uiSchema as Record<string, unknown>
        if (derivedRules.length > 0) {
            // visibleWhen / enabledWhen / read-only marks recompute with the data.
            base = mergeUiSchema(base, derivedUiSchemaOverlay(derivedRules, formData))
        }
        const submitOptions = (base["ui:submitButtonOptions"] as Record<string, unknown> | undefined) ?? {}
        return {
            ...base,
            "ui:submitButtonOptions": { ...submitOptions, norender: hideSubmitButton },
        }
    }, [schemaForm.uiSchema, hideSubmitButton, derivedRules, formData])

    // The surrounding chrome (dialog header, page heading) owns the form title;
    // rendering the schema's root title as well would duplicate it.
    const schema = useMemo(() => {
        const { title: _rootTitle, ...rest } = schemaForm.schema
        return rest
    }, [schemaForm.schema])

    if (steps === null) {
        return (
            <>
                <Form
                    id={id}
                    className={styles.form}
                    schema={schema}
                    uiSchema={uiSchema}
                    formData={formData}
                    validator={validator}
                    widgets={mergedWidgets}
                    templates={mergedTemplates}
                    formContext={formContext}
                    onChange={(event) => onFormDataChange(derive((event.formData ?? {}) as SchemaFormData))}
                    onSubmit={(event) => onSubmit?.(derive((event.formData ?? {}) as SchemaFormData))}
                    disabled={disabled}
                    transformErrors={transformErrors}
                    showErrorList={false}
                    noHtml5Validate
                />
                {summaryConfig !== null ? (
                    <SchemaFormSummaryTable config={summaryConfig} formData={formData} />
                ) : null}
            </>
        )
    }

    const step = steps[Math.min(stepIndex, steps.length - 1)]!
    const isLastStep = stepIndex === steps.length - 1
    const stepSchema = schemaForStep(schema, step)
    // Only the step's slice rides through rjsf, so ajv validates exactly this
    // page's fields; the merged whole lives in the host's formData.
    const stepData: SchemaFormData = {}
    for (const field of step.fields) {
        if (formData[field] !== undefined) {
            stepData[field] = formData[field]
        }
    }

    return (
        <div className={styles.wizard}>
            <ol className={styles.stepHeader} aria-label="Form steps">
                {steps.map((entry, index) => (
                    <li
                        key={entry.title}
                        className={styles.stepEntry}
                        data-state={index === stepIndex ? "current" : index < stepIndex ? "done" : "todo"}
                        aria-current={index === stepIndex ? "step" : undefined}
                    >
                        <span className={styles.stepIndex}>
                            {index < stepIndex ? <StepCheckIcon /> : index + 1}
                        </span>
                        <span className={styles.stepTitle}>{entry.title}</span>
                    </li>
                ))}
            </ol>
            {step.description !== undefined ? (
                <p className={styles.stepDescription}>{step.description}</p>
            ) : null}
            <Form
                // Remount per step, so ajv's error state never leaks across pages.
                key={stepIndex}
                id={id}
                className={styles.form}
                schema={stepSchema}
                uiSchema={uiSchema}
                formData={stepData}
                validator={validator}
                widgets={mergedWidgets}
                templates={mergedTemplates}
                formContext={formContext}
                onChange={(event) =>
                    onFormDataChange(derive({ ...formData, ...((event.formData ?? {}) as SchemaFormData) }))
                }
                onSubmit={(event) => {
                    const merged = derive({ ...formData, ...((event.formData ?? {}) as SchemaFormData) })
                    if (isLastStep) {
                        onSubmit?.(merged)
                    } else {
                        onFormDataChange(merged)
                        setStepIndex(stepIndex + 1)
                    }
                }}
                disabled={disabled}
                transformErrors={transformErrors}
                showErrorList={false}
                noHtml5Validate
            />
            {summaryConfig !== null ? (
                <SchemaFormSummaryTable config={summaryConfig} formData={formData} />
            ) : null}
            {stepIndex > 0 ? (
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setStepIndex(stepIndex - 1)}
                >
                    ← Back to {steps[stepIndex - 1]!.title}
                </Button>
            ) : null}
        </div>
    )
}

function StepCheckIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
            <path
                d="M2.5 6.5 L5 9 L9.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** ajv's messages are for developers ("must have required property 'Name'");
 * rewrite the common ones into user-facing copy. */
function transformErrors(errors: RJSFValidationError[]): RJSFValidationError[] {
    return errors.map((error) => {
        if (error.name === "required") {
            return { ...error, message: "This field is required." }
        }
        if (error.name === "format" && error.params?.format === "email") {
            return { ...error, message: "Enter a valid email address." }
        }
        if (error.name === "format" && error.params?.format === "uri") {
            return { ...error, message: "Enter a valid URL (https://…)." }
        }
        return error
    })
}

/** Reads and sanity-checks `ui:steps`; anything malformed falls back to a flat form. */
function parseWizardSteps(uiSchema: UiSchema): SchemaFormWizardStep[] | null {
    const raw = (uiSchema as Record<string, unknown>)["ui:steps"]
    if (!Array.isArray(raw) || raw.length < 2) {
        return null
    }
    const steps: SchemaFormWizardStep[] = []
    for (const entry of raw) {
        if (typeof entry !== "object" || entry === null) return null
        const candidate = entry as Record<string, unknown>
        if (typeof candidate.title !== "string" || !Array.isArray(candidate.fields)) return null
        steps.push({
            title: candidate.title,
            description: typeof candidate.description === "string" ? candidate.description : undefined,
            fields: candidate.fields.filter((field): field is string => typeof field === "string"),
        })
    }
    return steps
}

/** The root schema narrowed to one step's properties (and their requireds). */
function schemaForStep(schema: RJSFSchema, step: SchemaFormWizardStep): RJSFSchema {
    const properties: Record<string, unknown> = {}
    const allProperties = (schema.properties ?? {}) as Record<string, unknown>
    for (const field of step.fields) {
        if (allProperties[field] !== undefined) {
            properties[field] = allProperties[field]
        }
    }
    const required = Array.isArray(schema.required)
        ? schema.required.filter((field) => step.fields.includes(field))
        : undefined
    return { ...schema, properties, required } as RJSFSchema
}

//
// Widgets
//

function TextWidget(props: WidgetProps): React.ReactElement {
    const inputType = resolveInputType(props)
    return (
        <Input
            id={props.id}
            type={inputType}
            value={displayValue(valueToString(props.value), inputType)}
            placeholder={props.placeholder}
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            onBlur={(event) => props.onBlur(props.id, event.target.value)}
            onFocus={(event) => props.onFocus(props.id, event.target.value)}
            onChange={(event) => props.onChange(coerceInputValue(event.target.value, props, inputType))}
        />
    )
}

function TextareaWidget(props: WidgetProps): React.ReactElement {
    return (
        <TextArea
            id={props.id}
            value={valueToString(props.value)}
            placeholder={props.placeholder}
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            rows={typeof props.options.rows === "number" ? props.options.rows : 4}
            onBlur={(event) => props.onBlur(props.id, event.target.value)}
            onFocus={(event) => props.onFocus(props.id, event.target.value)}
            onChange={(event) =>
                props.onChange(event.target.value === "" ? props.options.emptyValue : event.target.value)
            }
        />
    )
}

function SelectWidget(props: WidgetProps): React.ReactElement {
    // rjsf routes uniqueItems enum arrays here as `multiple`; a dropdown
    // that holds several values hides the selection, so the checkbox group
    // renders instead — every choice and every pick visible at once.
    if (props.multiple === true) {
        return <CheckboxesWidget {...props} />
    }
    const enumOptions = props.options.enumOptions ?? []
    // Radix Select values must be strings; index-encode so enum values keep their original type.
    const options = enumOptions.map((option, index) => ({
        value: String(index),
        label: String(option.label),
        disabled: Array.isArray(props.options.enumDisabled)
            ? props.options.enumDisabled.includes(option.value as string | number | boolean)
            : false,
    }))
    const selectedIndex = enumOptions.findIndex((option) => option.value === props.value)
    return (
        <Select
            id={props.id}
            aria-label={props.label}
            value={selectedIndex >= 0 ? String(selectedIndex) : undefined}
            options={options}
            placeholder={
                props.placeholder !== undefined && props.placeholder !== "" ? props.placeholder : "Select..."
            }
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            onValueChange={(nextValue) => {
                const option = enumOptions[Number(nextValue)]
                props.onChange(option ? option.value : undefined)
            }}
        />
    )
}

/** `"ui:widget": "radio"` — every option visible; best for 2–5 choices. */
function RadioWidget(props: WidgetProps): React.ReactElement {
    const enumOptions = props.options.enumOptions ?? []
    const selectedIndex = enumOptions.findIndex((option) => option.value === props.value)
    return (
        <RadioGroup
            aria-label={props.label}
            value={selectedIndex >= 0 ? String(selectedIndex) : undefined}
            orientation={props.options.inline === true ? "horizontal" : "vertical"}
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            options={enumOptions.map((option, index) => ({
                value: String(index),
                label: String(option.label),
                disabled: Array.isArray(props.options.enumDisabled)
                    ? props.options.enumDisabled.includes(option.value as string | number | boolean)
                    : false,
            }))}
            onValueChange={(nextValue) => {
                const option = enumOptions[Number(nextValue)]
                props.onChange(option ? option.value : undefined)
            }}
        />
    )
}

function CheckboxWidget(props: WidgetProps): React.ReactElement {
    return (
        <Checkbox
            id={props.id}
            checked={props.value === true}
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            label={props.label}
            // Booleans skip the field template's description slot (displayLabel
            // is false), so the control renders its own secondary line.
            description={props.schema.description}
            onCheckedChange={(checked) => props.onChange(checked)}
        />
    )
}

/** `"ui:widget": "switch"` on a boolean — the toggle idiom for settings-like fields. */
function SwitchWidget(props: WidgetProps): React.ReactElement {
    return (
        <Switch
            id={props.id}
            checked={props.value === true}
            disabled={props.disabled || props.readonly}
            label={props.label}
            onCheckedChange={(checked) => props.onChange(checked)}
        />
    )
}

/** Multi-select: rjsf's default for `uniqueItems` arrays over an enum. */
function CheckboxesWidget(props: WidgetProps): React.ReactElement {
    const enumOptions = props.options.enumOptions ?? []
    const selected: unknown[] = Array.isArray(props.value) ? props.value : []
    const toggle = (optionValue: unknown, checked: boolean): void => {
        if (checked) {
            // Preserve the enum's declared order so submissions are stable.
            const next = enumOptions
                .map((option) => option.value)
                .filter((value) => selected.includes(value) || value === optionValue)
            props.onChange(next)
        } else {
            props.onChange(selected.filter((value) => value !== optionValue))
        }
    }
    return (
        <div
            className={props.options.inline === true ? styles.checkboxGroupInline : styles.checkboxGroup}
            role="group"
            aria-label={props.label}
        >
            {enumOptions.map((option, index) => (
                <Checkbox
                    key={index}
                    checked={selected.includes(option.value)}
                    disabled={
                        props.disabled ||
                        props.readonly ||
                        (Array.isArray(props.options.enumDisabled) &&
                            props.options.enumDisabled.includes(option.value as string | number | boolean))
                    }
                    invalid={(props.rawErrors ?? []).length > 0}
                    label={String(option.label)}
                    onCheckedChange={(checked) => toggle(option.value, checked)}
                />
            ))}
        </div>
    )
}

export const schemaFormWidgets: RegistryWidgetsType = {
    TextWidget,
    TextareaWidget,
    SelectWidget,
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    // Format-driven defaults (schema `format`) all route through the themed
    // text input, which renders the right native picker per type.
    DateWidget: TextWidget,
    DateTimeWidget: TextWidget,
    TimeWidget: TextWidget,
    EmailWidget: TextWidget,
    URLWidget: TextWidget,
    PasswordWidget: TextWidget,
    UpDownWidget: TextWidget,
    // Opt-in via `"ui:widget": "switch"`.
    switch: SwitchWidget,
    // Opt-in via `"ui:widget": "entityRef"` — searchable reference picker
    // over app-supplied resolvers (see EntityRefWidget).
    entityRef: EntityRefWidget,
}

//
// Templates
//

function FieldTemplate(props: FieldTemplateProps): React.ReactElement {
    if (props.hidden) {
        return <div style={{ display: "none" }}>{props.children}</div>
    }
    // `"ui:hidden": true` comes from visibleWhen derivation rules: the field
    // (scalar, object, or array) renders nothing but its data is kept.
    if ((props.uiSchema as Record<string, unknown> | undefined)?.["ui:hidden"] === true) {
        return <React.Fragment />
    }
    const rawErrors = props.rawErrors ?? []
    return (
        <div className={styles.field}>
            {props.displayLabel && props.label ? (
                <Label htmlFor={props.id} required={props.required}>
                    {props.label}
                </Label>
            ) : null}
            {props.children}
            {props.displayLabel && props.rawDescription ? (
                <p className={styles.description}>{props.rawDescription}</p>
            ) : null}
            {rawErrors.map((error) => (
                <p key={error} className={styles.fieldError}>
                    {error}
                </p>
            ))}
        </div>
    )
}

function ObjectFieldTemplate(props: ObjectFieldTemplateProps): React.ReactElement {
    // Nested objects read as titled sections; the root object is invisible
    // chrome (the dialog or page heading owns the form's title).
    const isSection = props.idSchema.$id !== "root"
    // Objects inside arrays get auto-generated "Title-0" names from rjsf;
    // the entry card and its controls already delineate items.
    const isArrayItem = /_\d+$/.test(props.idSchema.$id)
    const uiOptions = (props.uiSchema?.["ui:options"] ?? {}) as Record<string, unknown>
    const twoColumn = uiOptions.columns === 2
    const properties = (props.schema.properties ?? {}) as Record<string, Record<string, unknown>>
    return (
        <div className={isSection && !isArrayItem ? styles.objectSection : styles.objectContainer}>
            {props.title && !isArrayItem ? <h4 className={styles.sectionTitle}>{props.title}</h4> : null}
            {props.description ? <p className={styles.description}>{props.description}</p> : null}
            <div className={twoColumn ? styles.objectGridTwoColumn : styles.objectGrid}>
                {props.properties.map((property) => (
                    <div
                        key={property.name}
                        className={
                            twoColumn && fieldWantsFullRow(property.name, props.uiSchema, properties)
                                ? styles.gridItemFull
                                : undefined
                        }
                    >
                        {property.content}
                    </div>
                ))}
            </div>
        </div>
    )
}

/** In a two-column grid, big fields (textareas, nested structures) keep the full row. */
function fieldWantsFullRow(
    name: string,
    uiSchema: ObjectFieldTemplateProps["uiSchema"],
    properties: Record<string, Record<string, unknown>>,
): boolean {
    const fieldUi = ((uiSchema as Record<string, unknown> | undefined)?.[name] ?? {}) as Record<
        string,
        unknown
    >
    const fieldOptions = (fieldUi["ui:options"] ?? {}) as Record<string, unknown>
    if (fieldOptions.fullWidth === true) return true
    if (fieldOptions.fullWidth === false) return false
    if (fieldUi["ui:widget"] === "textarea") return true
    const type = properties[name]?.type
    return type === "object" || type === "array"
}

function ArrayFieldTemplate(props: ArrayFieldTemplateProps): React.ReactElement {
    // `"ui:options": { "addLabel": "+ Product" }` overrides the derived label.
    const uiOptions = (props.uiSchema?.["ui:options"] ?? {}) as Record<string, unknown>
    const addLabel =
        typeof uiOptions.addLabel === "string" ? uiOptions.addLabel : `+ Add ${itemNoun(props.title)}`
    return (
        <div className={styles.arrayContainer}>
            {props.title ? <h4 className={styles.sectionTitle}>{props.title}</h4> : null}
            {props.schema.description ? (
                <p className={styles.description}>{props.schema.description}</p>
            ) : null}
            {props.items.length === 0 ? <p className={styles.arrayEmpty}>Nothing here yet.</p> : null}
            {props.items.map((item) => (
                <div key={item.key} className={styles.arrayItem}>
                    <div className={styles.arrayItemBody}>{item.children}</div>
                    <div className={styles.arrayItemControls}>
                        {item.hasMoveUp || item.hasMoveDown ? (
                            <>
                                <button
                                    type="button"
                                    className={styles.arrayControlButton}
                                    aria-label="Move up"
                                    disabled={!item.hasMoveUp || props.disabled || props.readonly}
                                    onClick={item.onReorderClick(item.index, item.index - 1)}
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className={styles.arrayControlButton}
                                    aria-label="Move down"
                                    disabled={!item.hasMoveDown || props.disabled || props.readonly}
                                    onClick={item.onReorderClick(item.index, item.index + 1)}
                                >
                                    ↓
                                </button>
                            </>
                        ) : null}
                        {item.hasRemove ? (
                            <button
                                type="button"
                                className={`${styles.arrayControlButton} ${styles.arrayControlDanger}`}
                                aria-label="Remove item"
                                disabled={props.disabled || props.readonly}
                                onClick={item.onDropIndexClick(item.index)}
                            >
                                ✕
                            </button>
                        ) : null}
                    </div>
                </div>
            ))}
            {props.canAdd ? (
                <div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={props.disabled || props.readonly}
                        onClick={props.onAddClick}
                    >
                        {addLabel}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

/** "Team members" → "team member"; empty titles fall back to "item". */
function itemNoun(title: string | undefined): string {
    if (title === undefined || title.length === 0) return "item"
    const lower = title.toLowerCase()
    return lower.endsWith("s") ? lower.slice(0, -1) : lower
}

export const schemaFormTemplates: Partial<TemplatesType> = {
    FieldTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
}

//
// Helpers
//

function valueToString(value: unknown): string {
    return value === undefined || value === null ? "" : String(value)
}

function resolveInputType(props: WidgetProps): string {
    if (typeof props.options.inputType === "string") {
        return props.options.inputType
    }
    if (props.schema.type === "number" || props.schema.type === "integer") {
        return "number"
    }
    switch (props.schema.format) {
        case "email":
            return "email"
        case "date":
            return "date"
        case "date-time":
            return "datetime-local"
        case "time":
            return "time"
        case "uri":
            return "url"
        case "password":
            return "password"
        default:
            return "text"
    }
}

/** Stored value → what the native control shows (ISO datetimes → local wall time). */
function displayValue(value: string, inputType: string): string {
    if (value === "") {
        return value
    }
    if (inputType === "datetime-local") {
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) {
            return value
        }
        const pad = (part: number): string => String(part).padStart(2, "0")
        return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
    }
    if (inputType === "time") {
        // "14:30:00" (schema format) → the control's "14:30".
        return value.length >= 5 ? value.slice(0, 5) : value
    }
    return value
}

function coerceInputValue(rawValue: string, props: WidgetProps, inputType: string): unknown {
    if (rawValue === "") {
        return props.options.emptyValue
    }
    if (props.schema.type === "number" || props.schema.type === "integer") {
        const parsed = Number(rawValue)
        return Number.isFinite(parsed) ? parsed : rawValue
    }
    if (inputType === "datetime-local") {
        // The control yields local wall time without a zone; ajv's `date-time`
        // format requires full RFC 3339, so store the instant in UTC.
        const parsed = new Date(rawValue)
        return Number.isNaN(parsed.getTime()) ? rawValue : parsed.toISOString()
    }
    if (inputType === "time") {
        // The control yields "HH:MM"; the schema format wants seconds.
        return rawValue.length === 5 ? `${rawValue}:00` : rawValue
    }
    return rawValue
}
