import { OpenAiApiWrapper } from "./OpenAiApiWrapper.js"
import { OpenAiWrapper } from "./OpenAiWrapper.js"

export * from "./OpenAiApiWrapper.js"
export * from "./OpenAiWrapper.js"

let instance: OpenAiWrapper | undefined

/**
 * The OpenAI client the Ai domain calls when AI_MODE=openai. Constructed
 * lazily so booting without an OPENAI_API_KEY never fails (every non-AI
 * deploy, and every local sandbox); the local simulated assistant never
 * touches this wrapper at all. Tests may replace it via
 * setOpenAiWrapperForTests.
 */
export function getOpenAiWrapper(): OpenAiWrapper {
    if (instance === undefined) {
        instance = new OpenAiApiWrapper()
    }
    return instance
}

/** Test-only: substitutes a fake and returns to the real client when undefined. */
export function setOpenAiWrapperForTests(wrapper: OpenAiWrapper | undefined): void {
    instance = wrapper
}
