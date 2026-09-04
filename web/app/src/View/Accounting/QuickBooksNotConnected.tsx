import { Button, EmptyState } from "@ui"
import React from "react"
import { useNavigate } from "react-router-dom"
import { accountingPaths } from "./accountingShared"

/**
 * The shared "connect first" state for the accounting data tables: the
 * connect flow itself lives on the overview page, so this just points there.
 */
export function QuickBooksNotConnected({ noun }: { noun: string }): React.ReactElement {
    const navigate = useNavigate()
    return (
        <EmptyState
            title="QuickBooks is not connected"
            description={`Connect QuickBooks from the overview and your ${noun} show up here.`}
            action={
                <Button variant="secondary" onClick={() => void navigate(accountingPaths.overview)}>
                    Go to overview
                </Button>
            }
        />
    )
}
