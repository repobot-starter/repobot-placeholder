import type { SchemaFormPayload } from "./parseSchemaForm"

/**
 * Static sample matching the backend SchemaForm contract
 * ({jsonSchema, uiSchema, defaultData} JSON strings). Used by stories only.
 */
export const sampleSchemaFormPayload: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        required: ["displayName", "email"],
        properties: {
            displayName: { type: "string", title: "Display name" },
            email: { type: "string", title: "Email", format: "email" },
            bio: { type: "string", title: "Bio", description: "A short description shown on the profile." },
            status: { type: "string", title: "Status", enum: ["ACTIVE", "DISABLED"] },
            sendInvite: { type: "boolean", title: "Send invite email" },
        },
    }),
    uiSchema: JSON.stringify({
        bio: { "ui:widget": "textarea" },
        "ui:order": ["displayName", "email", "bio", "status", "sendInvite"],
    }),
    defaultData: JSON.stringify({
        displayName: "",
        email: "",
        status: "ACTIVE",
        sendInvite: true,
    }),
}
