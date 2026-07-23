import { OpenAiToolDefinition } from "../../DependencyWrappers/OpenAiWrapper/index.js"

/**
 * The assistant's tools. The starter ships one exemplar — a clock — to
 * demonstrate the full tool-call loop end to end (model requests the tool,
 * the service runs it, the output feeds the next model turn, and both steps
 * stream to the UI). Add a tool by extending this list and giving it a case
 * in executeAiChatTool; keep outputs as JSON strings.
 */
export const aiChatTools: OpenAiToolDefinition[] = [
    {
        type: "function",
        name: "get_current_time",
        description:
            "Returns the current date and time. Use whenever the user asks about the " +
            "current time, date, or day of the week.",
        parameters: {
            type: "object",
            properties: {
                timezone: {
                    type: "string",
                    description: 'Optional IANA timezone, e.g. "America/Los_Angeles". Defaults to UTC.',
                },
            },
            additionalProperties: false,
        },
    },
]

/**
 * Runs a tool and returns its JSON-encoded output. Failures are returned as
 * JSON error payloads (never thrown) so the model can recover gracefully and
 * the stream stays alive.
 */
export function executeAiChatTool(name: string, argumentsJson: string): string {
    try {
        switch (name) {
            case "get_current_time":
                return getCurrentTime(argumentsJson)
            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` })
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed."
        return JSON.stringify({ error: message })
    }
}

function getCurrentTime(argumentsJson: string): string {
    let timezone = "UTC"
    try {
        const parsed = JSON.parse(argumentsJson) as { timezone?: unknown }
        if (typeof parsed.timezone === "string" && parsed.timezone !== "") {
            timezone = parsed.timezone
        }
    } catch {
        // Malformed arguments fall back to UTC.
    }
    const now = new Date()
    let formatted: string
    try {
        formatted = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            dateStyle: "full",
            timeStyle: "long",
        }).format(now)
    } catch {
        return JSON.stringify({ error: `Unknown timezone: ${timezone}` })
    }
    return JSON.stringify({ iso: now.toISOString(), timezone, formatted })
}
