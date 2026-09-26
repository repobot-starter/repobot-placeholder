import { marketingSrc } from "@ui"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { BookingWidget } from "../../../src/View/Wedding/BookingWidget"
import { booking, codeAppointments } from "../../../src/View/Wedding/content"

/**
 * The wedding /book widget fronts each session card with a real
 * photograph. Those srcs must go through the landing kernel's
 * `marketingSrc` (the same helper MarketingImage uses) so baked template
 * previews served under /previews/<pack>/ resolve `/wedding/…` against
 * the bundle, not the host origin. A raw `<img src={image.src}>` is the
 * broken-icon bug this suite pins.
 */
describe("wedding BookingWidget session cards", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders each session type through MarketingImage with a base-aware src", async () => {
        render(
            <BookingWidget
                appointments={codeAppointments}
                sessionImages={booking.sessionImages}
                inquireHref="/inquire"
            />,
        )

        for (const type of codeAppointments.types) {
            await waitFor(() => {
                expect(screen.getByText(type.name)).toBeTruthy()
            })
            const image = booking.sessionImages[type.typeId]
            expect(image, `sessionImages[${type.typeId}]`).toBeDefined()
            if (image === undefined) continue
            const img = screen.getByAltText(image.alt)
            expect(img.getAttribute("src")).toBe(marketingSrc(image.src))
            const srcSet = img.getAttribute("srcset") ?? ""
            for (const entry of image.srcSet) {
                expect(srcSet).toContain(`${marketingSrc(entry.src)} ${entry.width}w`)
            }
        }
    })
})
