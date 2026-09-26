import React from "react"
import { Navigate } from "react-router-dom"
import { defaultRoutePath } from "./Router"

/**
 * Production scoped builds replace inactive template pages with this
 * redirect-only component, so inactive template trees stay out of the bundle.
 */
export default function ScopedTemplatePageStub(): React.ReactElement {
    return <Navigate to={defaultRoutePath} replace />
}
