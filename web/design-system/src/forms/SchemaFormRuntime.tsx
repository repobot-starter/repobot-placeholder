import Form from "@rjsf/core"
import type {
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    RegistryWidgetsType,
    TemplatesType,
    WidgetProps,
} from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"
import React, { useMemo } from "react"
import { Input } from "../primitives/Input"
import { Label } from "../primitives/Label"
import { Select } from "../primitives/Select"
import { TextArea } from "../primitives/TextArea"
import type { ParsedSchemaForm } from "./parseSchemaForm"
import * as styles from "./SchemaFormRuntime.styles.css"

export type SchemaFormData = Record<string, unknown>

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
}

/**
 * Backend-driven form renderer: @rjsf/core + ajv8 validation with all widgets
 * and templates re-skinned using design-system primitives and theme tokens.
 */
export function SchemaFormRuntime({
    id,
    schemaForm,
    formData,
    onFormDataChange,
    onSubmit,
    disabled,
    hideSubmitButton = true,
}: SchemaFormRuntimeProps): React.ReactElement {
    const uiSchema = useMemo(() => {
        const base = schemaForm.uiSchema as Record<string, unknown>
        const submitOptions = (base["ui:submitButtonOptions"] as Record<string, unknown> | undefined) ?? {}
        return {
            ...base,
            "ui:submitButtonOptions": { ...submitOptions, norender: hideSubmitButton },
        }
    }, [schemaForm.uiSchema, hideSubmitButton])

    // The surrounding chrome (dialog header, page heading) owns the form title;
    // rendering the schema's root title as well would duplicate it.
    const schema = useMemo(() => {
        const { title: _rootTitle, ...rest } = schemaForm.schema
        return rest
    }, [schemaForm.schema])

    return (
        <Form
            id={id}
            className={styles.form}
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            validator={validator}
            widgets={schemaFormWidgets}
            templates={schemaFormTemplates}
            onChange={(event) => onFormDataChange((event.formData ?? {}) as SchemaFormData)}
            onSubmit={(event) => onSubmit?.((event.formData ?? {}) as SchemaFormData)}
            disabled={disabled}
            showErrorList={false}
            noHtml5Validate
        />
    )
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
            value={valueToString(props.value)}
            placeholder={props.placeholder}
            disabled={props.disabled || props.readonly}
            invalid={(props.rawErrors ?? []).length > 0}
            onBlur={(event) => props.onBlur(props.id, event.target.value)}
            onFocus={(event) => props.onFocus(props.id, event.target.value)}
            onChange={(event) => props.onChange(coerceInputValue(event.target.value, props))}
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

function CheckboxWidget(props: WidgetProps): React.ReactElement {
    return (
        <label className={styles.checkboxRow} htmlFor={props.id}>
            <input
                id={props.id}
                type="checkbox"
                className={styles.checkbox}
                checked={props.value === true}
                disabled={props.disabled || props.readonly}
                onChange={(event) => props.onChange(event.target.checked)}
            />
            <span>{props.label}</span>
        </label>
    )
}

export const schemaFormWidgets: RegistryWidgetsType = {
    TextWidget,
    TextareaWidget,
    SelectWidget,
    CheckboxWidget,
}

//
// Templates
//

function FieldTemplate(props: FieldTemplateProps): React.ReactElement {
    if (props.hidden) {
        return <div style={{ display: "none" }}>{props.children}</div>
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
    return (
        <div className={styles.objectContainer}>
            {props.title ? <h4 className={styles.sectionTitle}>{props.title}</h4> : null}
            {props.description ? <p className={styles.description}>{props.description}</p> : null}
            {props.properties.map((property) => (
                <React.Fragment key={property.name}>{property.content}</React.Fragment>
            ))}
        </div>
    )
}

export const schemaFormTemplates: Partial<TemplatesType> = {
    FieldTemplate,
    ObjectFieldTemplate,
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
    if (props.schema.format === "email") {
        return "email"
    }
    return "text"
}

function coerceInputValue(rawValue: string, props: WidgetProps): unknown {
    if (rawValue === "") {
        return props.options.emptyValue
    }
    if (props.schema.type === "number" || props.schema.type === "integer") {
        const parsed = Number(rawValue)
        return Number.isFinite(parsed) ? parsed : rawValue
    }
    return rawValue
}
