import { deriveStorageEndpoint, putUploadBytes } from "@base/core"
import React, { useRef, useState } from "react"
import { useCreateUploadMutation, useFinalizeUploadMutation } from "../../generated/graphql/types"
import * as shared from "./creditStyles.css"

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

export interface PdfDropZoneProps {
    title: string
    hint: string
    busyLabel: string
    disabled?: boolean
    /** Called with the READY upload after the PDF is filed in storage. */
    onUploaded: (uploadId: string, fileName: string) => Promise<void>
    onError: (message: string) => void
}

/**
 * The pack's drag-and-drop surface: drop (or click to pick) a PDF and it is
 * filed as a PRIVATE upload through the storage kernel, then handed to the
 * caller to ingest. Rejects non-PDFs before uploading anything.
 */
export function PdfDropZone({
    title,
    hint,
    busyLabel,
    disabled = false,
    onUploaded,
    onError,
}: PdfDropZoneProps): React.ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [busy, setBusy] = useState(false)
    const [createUpload] = useCreateUploadMutation()
    const [finalizeUpload] = useFinalizeUploadMutation()

    const handleFile = async (file: File): Promise<void> => {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            onError("Only PDF files can be dropped here.")
            return
        }
        setBusy(true)
        try {
            const slotResult = await createUpload({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: {
                            contentType: "application/pdf",
                            sizeBytes: file.size,
                            visibility: "PRIVATE",
                        },
                    },
                },
            })
            const slot = slotResult.data?.createUpload
            if (slot === undefined) {
                throw new Error("The upload could not be created.")
            }
            await putUploadBytes({
                endpoint: storageEndpoint(),
                uploadUrl: slot.uploadUrl,
                headersJson: slot.headersJson,
                body: file,
            })
            await finalizeUpload({ variables: { input: { uploadId: slot.uploadId } } })
            await onUploaded(slot.uploadId, file.name)
        } catch (caught) {
            onError(caught instanceof Error ? caught.message : "The upload failed.")
        } finally {
            setBusy(false)
        }
    }

    const onDrop = (event: React.DragEvent): void => {
        event.preventDefault()
        setDragActive(false)
        if (disabled || busy) {
            return
        }
        const file = event.dataTransfer.files?.[0]
        if (file !== undefined) {
            void handleFile(file)
        }
    }

    const onPick = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (file !== undefined) {
            void handleFile(file)
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={title}
            className={`${shared.dropZone} ${dragActive ? shared.dropZoneActive : ""}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    inputRef.current?.click()
                }
            }}
            onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
        >
            <p className={shared.dropZoneTitle}>{busy ? busyLabel : title}</p>
            <p className={shared.dropZoneHint}>{hint}</p>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPick} />
        </div>
    )
}
