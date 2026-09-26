import type { LandingConfig } from "@ui"
import { render } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { vi } from "vitest"
import { applyLandingDocument } from "../../src/View/Landing/landingDocument"
import { LandingRenderer } from "../../src/View/Landing/LandingRenderer"

/**
 * The preview editor's stamp check for one landing page: every text stamp
 * must name an authored string in its own section's content, and every
 * media stamp must be overridable through the same merge the site runs.
 * Shared by the kernel sweep (tests/View/Landing/stampResolution.test.tsx)
 * and the remix-seed sweep beside it.
 */

const PROBE = "/brand/stamp-probe.jpg"

export interface StampTally {
    text: number
    media: number
    /** Media-list stamp names seen, indices folded to `N`. */
    lists: Set<string>
}

export function newStampTally(): StampTally {
    return { text: 0, media: 0, lists: new Set<string>() }
}

/** Builders take (basePath, now, ...code-content defaults): call each with what it names. */
export function buildLandings(
    modules: Record<string, Record<string, unknown>>,
    now: Date,
): [string, LandingConfig][] {
    const out: [string, LandingConfig][] = []
    for (const [file, mod] of Object.entries(modules)) {
        for (const [name, value] of Object.entries(mod)) {
            if (!/Landing$/.test(name)) continue
            let config: unknown = value
            if (typeof value === "function") {
                const params = /^[^(]*\(([^)]*)\)/.exec(String(value))?.[1] ?? ""
                const args = params
                    .split(",")
                    .map((param) => param.trim().split(/[\s=:]/)[0])
                    .map((param) => (param === "basePath" ? "" : param === "now" ? now : undefined))
                try {
                    config = (value as (...args: unknown[]) => unknown)(...args)
                } catch {
                    continue
                }
            }
            if (isLanding(config)) out.push([`${file.replace(/^.*\/View\//, "")}#${name}`, config])
        }
    }
    return out
}

function isLanding(value: unknown): value is LandingConfig {
    return (
        typeof value === "object" &&
        value !== null &&
        Array.isArray((value as { sections?: unknown }).sections)
    )
}

function valueAt(root: unknown, path: string): unknown {
    let current = root
    for (const segment of path.split(".")) {
        if (Array.isArray(current)) current = current[Number(segment)]
        else if (typeof current === "object" && current !== null)
            current = (current as Record<string, unknown>)[segment]
        else return undefined
    }
    return current
}

/** Renders one page and returns its unresolvable stamps, tallying what it checked. */
export function stampProblems(config: LandingConfig, tally: StampTally): string[] {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { container } = render(
        <MemoryRouter>
            <LandingRenderer config={config} leadStorageKey="stamp-resolution-test" />
        </MemoryRouter>,
    )
    const problems: string[] = []
    for (const sectionElement of container.querySelectorAll<HTMLElement>("[data-rb-section]")) {
        const key = sectionElement.dataset.rbSection ?? ""
        const section = config.sections[Number(sectionElement.dataset.rbSectionIndex)]
        if (section === undefined || (section.id ?? section.type) !== key) continue
        const owned = (element: Element) => element.closest("[data-rb-section]") === sectionElement
        for (const element of sectionElement.querySelectorAll<HTMLElement>("[data-rb-text-field]")) {
            if (!owned(element)) continue
            const { rbTextField: field, rbTextList: list, rbTextIndex: index } = element.dataset
            const path = list !== undefined && index !== undefined ? `${list}.${index}.${field}` : `${field}`
            tally.text += 1
            if (typeof valueAt(section.content, path) !== "string") {
                problems.push(`${key}: text "${path}" is not an authored string`)
            }
        }
        for (const element of sectionElement.querySelectorAll<HTMLElement>("[data-rb-media-list]")) {
            if (!owned(element)) continue
            const { rbMediaList: list = "", rbMediaIndex: index = "" } = element.dataset
            tally.media += 1
            tally.lists.add(list.replace(/\.\d+\./g, ".N."))
            warn.mockClear()
            const merged = applyLandingDocument(config, {
                sections: [{ id: key, media: { [list]: { [index]: PROBE } } }],
            })
            const painted = merged.sections.find((candidate) => (candidate.id ?? candidate.type) === key)
            if (warn.mock.calls.length > 0 || !JSON.stringify(painted?.content).includes(PROBE)) {
                problems.push(`${key}: media "${list}"[${index}] is not overridable`)
            }
        }
    }
    warn.mockRestore()
    return problems
}
