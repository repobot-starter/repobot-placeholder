import { buildPublicFileUrl, resolveStorageUrl } from "@base/core"
import { AppShell, Spinner, type AppShellNavItem, type AppShellNavSection } from "@ui"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useApolloClient } from "@apollo/client"
import { runtime } from "../../Config/Runtime"
import {
    collectDroppedFiles,
    driveStorageEndpoint,
    useDriveUploader,
    type DriveUploadJob,
} from "../../Drive/driveUpload"
import { maybeSeedDriveLibrary, markDriveLibraryCleared } from "../../Drive/driveSeed"
import { drivePreviewKind, driveTypeTag, formatBytes, formatEntryDate } from "../../Drive/driveFormat"
import {
    useClearDriveLibraryMutation,
    useCreateDriveFolderMutation,
    useDeleteDriveEntryMutation,
    useDriveEntriesQuery,
    useMoveDriveEntryMutation,
    useRenameDriveEntryMutation,
    useRestoreDriveEntryMutation,
    useSetDriveEntryStarredMutation,
    useShareDriveEntryMutation,
    useTrashDriveEntryMutation,
    type DriveEntryFieldsFragment,
} from "../../generated/graphql/types"
import { filesContent, filesSeedManifest } from "./filesContent"
import * as styles from "./FilesPage.styles.css"

type Entry = DriveEntryFieldsFragment

/** What the main panel lists: a folder, the starred lens, or the trash. */
type ViewMode = "folder" | "starred" | "trash"

type SortKey = "name" | "newest"

const sortInputs = {
    name: [{ fieldName: "name", direction: "asc" as const }],
    newest: [{ fieldName: "rowCreatedAt", direction: "desc" as const }],
}

const PAGE_SIZE = 200

/** Nav ids carry their meaning: fixed views, folder ids, and actions. */
const NAV_ALL = "view:all"
const NAV_STARRED = "view:starred"
const NAV_TRASH = "view:trash"
const NAV_CLEAR = "action:clear"
const FOLDER_PREFIX = "folder:"

function LockerBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
                d="M2.75 6.25a1.5 1.5 0 0 1 1.5-1.5h3.6l1.9 1.9h5.75a1.5 1.5 0 0 1 1.5 1.5v6.1a1.5 1.5 0 0 1-1.5 1.5h-11.25a1.5 1.5 0 0 1-1.5-1.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** The folder hierarchy as shell nav entries (children expand in the rail). */
function buildFolderNavItems(folders: Entry[], parentId: string | null): AppShellNavItem[] {
    return folders
        .filter((folder) => (folder.parentId ?? null) === parentId)
        .map((folder): AppShellNavItem => {
            const children = buildFolderNavItems(folders, folder.id)
            return {
                id: `${FOLDER_PREFIX}${folder.id}`,
                label: folder.name,
                ...(children.length > 0 ? { children } : {}),
            }
        })
}

/**
 * Session gate: the library is owner-scoped, so establish a session first
 * (anonymous for preview visitors — their library is theirs alone), then
 * mount the locker. Real accounts sign in through the auth kernel's /login.
 */
export default function FilesPage(): React.ReactElement {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string>()

    useEffect(() => {
        let cancelled = false
        const ensureSession = async (): Promise<void> => {
            const existing = await runtime.authClient.getToken()
            if (existing === null) {
                await runtime.authClient.signInAnonymously()
            }
            if (!cancelled) {
                setReady(true)
            }
        }
        ensureSession().catch((caught: unknown) => {
            if (!cancelled) {
                setError(caught instanceof Error ? caught.message : "Sign-in failed.")
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    if (error !== undefined) {
        return <p role="alert">{error}</p>
    }
    if (!ready) {
        return (
            <div className={styles.centeredGate}>
                <Spinner size="lg" />
            </div>
        )
    }
    return <LockerApp />
}

function LockerApp(): React.ReactElement {
    const client = useApolloClient()

    const [viewMode, setViewMode] = useState<ViewMode>("folder")
    const [folderId, setFolderId] = useState<string | null>(null)
    const [layout, setLayout] = useState<"list" | "grid">("list")
    const [search, setSearch] = useState("")
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [notice, setNotice] = useState<string>()
    const [actionError, setActionError] = useState<string>()
    const [seeding, setSeeding] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [previewEntry, setPreviewEntry] = useState<Entry>()
    const [renameTarget, setRenameTarget] = useState<Entry>()
    const [moveTarget, setMoveTarget] = useState<Entry>()
    const [newFolderOpen, setNewFolderOpen] = useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragDepthRef = useRef(0)

    const trimmedSearch = search.trim()

    // Every folder, once: the tree, the breadcrumbs, and the move dialog
    // all derive from this single list.
    const foldersQuery = useDriveEntriesQuery({
        variables: {
            input: {
                filters: { kind: "FOLDER" },
                connection: { pagination: { first: 500 }, sort: sortInputs.name },
            },
        },
    })

    const entriesQuery = useDriveEntriesQuery({
        variables: {
            input: {
                filters:
                    viewMode === "trash"
                        ? { inTrash: true }
                        : viewMode === "starred"
                          ? { starred: true }
                          : trimmedSearch.length > 0
                            ? { search: trimmedSearch }
                            : folderId !== null
                              ? { folderId }
                              : { rootOnly: true },
                connection: { pagination: { first: PAGE_SIZE }, sort: sortInputs[sortKey] },
            },
        },
        fetchPolicy: "cache-and-network",
    })

    const refetchLibrary = useCallback((): void => {
        void entriesQuery.refetch()
        void foldersQuery.refetch()
    }, [entriesQuery, foldersQuery])

    const uploader = useDriveUploader(refetchLibrary)

    const [createFolder] = useCreateDriveFolderMutation()
    const [renameEntry] = useRenameDriveEntryMutation()
    const [moveEntry] = useMoveDriveEntryMutation()
    const [trashEntry] = useTrashDriveEntryMutation()
    const [restoreEntry] = useRestoreDriveEntryMutation()
    const [deleteEntry] = useDeleteDriveEntryMutation()
    const [setStarred] = useSetDriveEntryStarredMutation()
    const [shareEntry] = useShareDriveEntryMutation()
    const [clearLibrary] = useClearDriveLibraryMutation()

    // First sign-in: push the curated demo library through the normal
    // upload flow, then refetch. Never returns after "Clear demo library".
    useEffect(() => {
        let cancelled = false
        setSeeding(true)
        maybeSeedDriveLibrary(client, filesSeedManifest)
            .then((seeded) => {
                if (!cancelled && seeded) {
                    refetchLibrary()
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) {
                    setSeeding(false)
                }
            })
        return () => {
            cancelled = true
        }
        // Run once on mount; refetchLibrary identity churn must not re-seed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client])

    const folders = useMemo(
        () => (foldersQuery.data?.driveEntries.nodes ?? []).filter((node): node is Entry => node !== null),
        [foldersQuery.data],
    )
    const entries = useMemo(
        () => (entriesQuery.data?.driveEntries.nodes ?? []).filter((node): node is Entry => node !== null),
        [entriesQuery.data],
    )

    const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])

    const breadcrumbs = useMemo((): Entry[] => {
        const chain: Entry[] = []
        let cursor = folderId !== null ? folderById.get(folderId) : undefined
        while (cursor !== undefined) {
            chain.unshift(cursor)
            cursor = cursor.parentId !== null ? folderById.get(cursor.parentId ?? "") : undefined
        }
        return chain
    }, [folderId, folderById])

    const act = useCallback(async (action: () => Promise<unknown>): Promise<void> => {
        setActionError(undefined)
        try {
            await action()
        } catch (caught) {
            setActionError(caught instanceof Error ? caught.message : "The action failed.")
        }
    }, [])

    const openFolder = useCallback((nextFolderId: string | null): void => {
        setViewMode("folder")
        setSearch("")
        setFolderId(nextFolderId)
    }, [])

    const uploadFileList = useCallback(
        (files: File[]): void => {
            if (files.length === 0) {
                return
            }
            void uploader.uploadFiles({
                files: files.map((file) => ({ file, pathSegments: [] })),
                parentId: viewMode === "folder" ? folderId : null,
            })
        },
        [folderId, uploader, viewMode],
    )

    const onDrop = useCallback(
        (event: React.DragEvent): void => {
            event.preventDefault()
            dragDepthRef.current = 0
            setDragActive(false)
            void collectDroppedFiles(event.dataTransfer).then((incoming) => {
                if (incoming.length > 0) {
                    void uploader.uploadFiles({
                        files: incoming,
                        parentId: viewMode === "folder" ? folderId : null,
                    })
                }
            })
        },
        [folderId, uploader, viewMode],
    )

    const copyShareLink = useCallback(
        (entry: Entry): void => {
            void act(async () => {
                if (!entry.shared) {
                    await shareEntry({ variables: { input: { objectId: entry.id, shared: true } } })
                }
                if (entry.uploadId != null) {
                    const url = buildPublicFileUrl(driveStorageEndpoint(), entry.uploadId)
                    await navigator.clipboard.writeText(url)
                    setNotice(`Share link copied — anyone with it can read "${entry.name}".`)
                }
                refetchLibrary()
            })
        },
        [act, refetchLibrary, shareEntry],
    )

    const unshare = useCallback(
        (entry: Entry): void => {
            void act(async () => {
                await shareEntry({ variables: { input: { objectId: entry.id, shared: false } } })
                setNotice(`"${entry.name}" is private again; the old link stops working.`)
                refetchLibrary()
            })
        },
        [act, refetchLibrary, shareEntry],
    )

    const download = useCallback((entry: Entry): void => {
        if (entry.fileUrl == null) {
            return
        }
        const anchor = document.createElement("a")
        anchor.href = resolveStorageUrl(driveStorageEndpoint(), entry.fileUrl)
        anchor.download = entry.name
        anchor.target = "_blank"
        anchor.rel = "noreferrer"
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
    }, [])

    const runClearLibrary = useCallback((): void => {
        setClearConfirmOpen(false)
        void act(async () => {
            await clearLibrary()
            markDriveLibraryCleared(filesSeedManifest)
            setFolderId(null)
            setViewMode("folder")
            setNotice("The library is empty.")
            refetchLibrary()
        })
    }, [act, clearLibrary, refetchLibrary])

    const listBusy = entriesQuery.loading && entries.length === 0

    const navSections = useMemo((): AppShellNavSection[] => {
        const folderItems = buildFolderNavItems(folders, null)
        return [
            {
                id: "library",
                title: "Library",
                items: [
                    { id: NAV_ALL, label: "All files", icon: <span className={styles.navGlyph}>▤</span> },
                    {
                        id: NAV_STARRED,
                        label: "Starred",
                        icon: <span className={styles.navGlyph}>★</span>,
                    },
                    { id: NAV_TRASH, label: "Trash", icon: <span className={styles.navGlyph}>✕</span> },
                ],
            },
            ...(folderItems.length > 0 ? [{ id: "folders", title: "Folders", items: folderItems }] : []),
            {
                id: "demo",
                title: "Demo",
                items: [
                    {
                        id: NAV_CLEAR,
                        label: filesContent.clearDemoLabel,
                        icon: <span className={styles.navGlyph}>⌫</span>,
                    },
                ],
            },
        ]
    }, [folders])

    const activeItemId =
        viewMode === "starred"
            ? NAV_STARRED
            : viewMode === "trash"
              ? NAV_TRASH
              : folderId !== null
                ? `${FOLDER_PREFIX}${folderId}`
                : NAV_ALL

    const onNavSelect = useCallback(
        (item: AppShellNavItem): void => {
            if (item.id === NAV_ALL) {
                openFolder(null)
            } else if (item.id === NAV_STARRED) {
                setViewMode("starred")
                setSearch("")
            } else if (item.id === NAV_TRASH) {
                setViewMode("trash")
                setSearch("")
            } else if (item.id === NAV_CLEAR) {
                setClearConfirmOpen(true)
            } else if (item.id.startsWith(FOLDER_PREFIX)) {
                openFolder(item.id.slice(FOLDER_PREFIX.length))
            }
        },
        [openFolder],
    )

    const emptyMessage =
        viewMode === "trash"
            ? filesContent.emptyTrash
            : viewMode === "starred"
              ? filesContent.emptyStarred
              : trimmedSearch.length > 0
                ? filesContent.emptySearch
                : folderId !== null
                  ? filesContent.emptyFolder
                  : filesContent.emptyLibrary

    return (
        <AppShell
            title={filesContent.appName}
            brandIcon={<LockerBrandIcon />}
            sections={navSections}
            activeItemId={activeItemId}
            onItemSelect={onNavSelect}
        >
            <div
                className={styles.page}
                onDragEnter={(event) => {
                    event.preventDefault()
                    dragDepthRef.current += 1
                    setDragActive(true)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => {
                    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
                    if (dragDepthRef.current === 0) {
                        setDragActive(false)
                    }
                }}
                onDrop={onDrop}
            >
                <div className={styles.toolbar}>
                    <input
                        className={styles.searchInput}
                        type="search"
                        placeholder="Search names and captions…"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            if (event.target.value.trim().length > 0) {
                                setViewMode("folder")
                            }
                        }}
                        aria-label="Search the library"
                    />
                    <div className={styles.toolbarActions}>
                        <div className={styles.segmented} role="group" aria-label="Sort">
                            {(["name", "newest"] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`${styles.segmentButton} ${sortKey === key ? styles.segmentButtonActive : ""}`}
                                    onClick={() => setSortKey(key)}
                                >
                                    {key === "name" ? "A–Z" : "New"}
                                </button>
                            ))}
                        </div>
                        <div className={styles.segmented} role="group" aria-label="Layout">
                            {(["list", "grid"] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`${styles.segmentButton} ${layout === key ? styles.segmentButtonActive : ""}`}
                                    onClick={() => setLayout(key)}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => setNewFolderOpen(true)}
                        >
                            New folder
                        </button>
                        <button
                            type="button"
                            className={styles.buttonPrimary}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploader.uploading}
                        >
                            {uploader.uploading ? "Uploading…" : "Upload"}
                        </button>
                    </div>
                </div>

                {viewMode === "folder" && trimmedSearch.length === 0 ? (
                    <div className={styles.crumbs}>
                        <button type="button" className={styles.crumbButton} onClick={() => openFolder(null)}>
                            All files
                        </button>
                        {breadcrumbs.map((crumb) => (
                            <React.Fragment key={crumb.id}>
                                <span aria-hidden="true">/</span>
                                <button
                                    type="button"
                                    className={styles.crumbButton}
                                    onClick={() => openFolder(crumb.id)}
                                >
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className={styles.crumbs}>
                        <span>
                            {viewMode === "trash"
                                ? "Trash"
                                : viewMode === "starred"
                                  ? "Starred"
                                  : `Search: "${trimmedSearch}"`}
                        </span>
                    </div>
                )}

                <div className={styles.statusLine}>
                    {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </div>

                {seeding ? <div className={styles.noticeBar}>{filesContent.seeding}</div> : null}
                {notice !== undefined ? <div className={styles.noticeBar}>{notice}</div> : null}
                {actionError !== undefined ? <div className={styles.errorBar}>{actionError}</div> : null}

                {listBusy ? (
                    <Spinner size="lg" />
                ) : entries.length === 0 ? (
                    <div className={styles.emptyState}>{emptyMessage}</div>
                ) : layout === "list" ? (
                    <EntryTable
                        entries={entries}
                        inTrash={viewMode === "trash"}
                        onOpen={(entry) =>
                            entry.kind === "FOLDER" ? openFolder(entry.id) : setPreviewEntry(entry)
                        }
                        onToggleStar={(entry) =>
                            void act(() =>
                                setStarred({
                                    variables: {
                                        input: { objectId: entry.id, starred: !entry.starred },
                                    },
                                }),
                            )
                        }
                        onCopyLink={copyShareLink}
                        onUnshare={unshare}
                        onDownload={download}
                        onRename={setRenameTarget}
                        onMove={setMoveTarget}
                        onTrash={(entry) =>
                            void act(async () => {
                                await trashEntry({ variables: { input: { objectId: entry.id } } })
                                refetchLibrary()
                            })
                        }
                        onRestore={(entry) =>
                            void act(async () => {
                                await restoreEntry({ variables: { input: { objectId: entry.id } } })
                                refetchLibrary()
                            })
                        }
                        onDelete={(entry) =>
                            void act(async () => {
                                await deleteEntry({ variables: { input: { objectId: entry.id } } })
                                refetchLibrary()
                            })
                        }
                    />
                ) : (
                    <div className={styles.grid}>
                        {entries.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                className={styles.gridCard}
                                onClick={() =>
                                    entry.kind === "FOLDER" ? openFolder(entry.id) : setPreviewEntry(entry)
                                }
                            >
                                <GridThumb entry={entry} />
                                <span className={styles.gridMeta}>
                                    <span className={styles.gridName}>{entry.name}</span>
                                    <span className={styles.gridSub}>
                                        {entry.kind === "FOLDER"
                                            ? "Folder"
                                            : `${formatBytes(entry.sizeBytes)} · ${formatEntryDate(entry.updatedTime)}`}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        event.target.value = ""
                        uploadFileList(files)
                    }}
                />

                {dragActive ? (
                    <div className={styles.dropOverlay}>
                        <div className={styles.dropOverlayCard}>
                            Drop to upload
                            {viewMode === "folder" && breadcrumbs.length > 0
                                ? ` into ${breadcrumbs[breadcrumbs.length - 1].name}`
                                : ""}
                        </div>
                    </div>
                ) : null}

                {uploader.jobs.length > 0 ? (
                    <UploadTray
                        jobs={uploader.jobs}
                        uploading={uploader.uploading}
                        onClose={uploader.clearJobs}
                    />
                ) : null}

                {previewEntry !== undefined ? (
                    <PreviewModal
                        entry={previewEntry}
                        onClose={() => setPreviewEntry(undefined)}
                        onDownload={download}
                    />
                ) : null}

                {renameTarget !== undefined ? (
                    <NameDialog
                        title={`Rename "${renameTarget.name}"`}
                        initialValue={renameTarget.name}
                        submitLabel="Rename"
                        onSubmit={(name) => {
                            const target = renameTarget
                            setRenameTarget(undefined)
                            void act(async () => {
                                await renameEntry({
                                    variables: {
                                        input: {
                                            objectId: target.id,
                                            idempotencyKey: crypto.randomUUID(),
                                            name,
                                        },
                                    },
                                })
                                refetchLibrary()
                            })
                        }}
                        onClose={() => setRenameTarget(undefined)}
                    />
                ) : null}

                {newFolderOpen ? (
                    <NameDialog
                        title="New folder"
                        initialValue=""
                        submitLabel="Create"
                        onSubmit={(name) => {
                            setNewFolderOpen(false)
                            void act(async () => {
                                await createFolder({
                                    variables: {
                                        input: {
                                            idempotencyKey: crypto.randomUUID(),
                                            fields: {
                                                name,
                                                parentId: viewMode === "folder" ? folderId : null,
                                            },
                                        },
                                    },
                                })
                                refetchLibrary()
                            })
                        }}
                        onClose={() => setNewFolderOpen(false)}
                    />
                ) : null}

                {moveTarget !== undefined ? (
                    <MoveDialog
                        entry={moveTarget}
                        folders={folders}
                        onSubmit={(destinationId) => {
                            const target = moveTarget
                            setMoveTarget(undefined)
                            void act(async () => {
                                await moveEntry({
                                    variables: {
                                        input: {
                                            objectId: target.id,
                                            idempotencyKey: crypto.randomUUID(),
                                            parentId: destinationId,
                                        },
                                    },
                                })
                                refetchLibrary()
                            })
                        }}
                        onClose={() => setMoveTarget(undefined)}
                    />
                ) : null}

                {clearConfirmOpen ? (
                    <div className={styles.dialogBackdrop} onClick={() => setClearConfirmOpen(false)}>
                        <div className={styles.dialogCard} onClick={(event) => event.stopPropagation()}>
                            <h2 className={styles.dialogTitle}>{filesContent.clearDemoLabel}</h2>
                            <p className={styles.dialogBodyText}>{filesContent.clearDemoConfirm}</p>
                            <div className={styles.dialogActions}>
                                <button
                                    type="button"
                                    className={styles.buttonGhost}
                                    onClick={() => setClearConfirmOpen(false)}
                                >
                                    Keep everything
                                </button>
                                <button
                                    type="button"
                                    className={styles.buttonDanger}
                                    onClick={runClearLibrary}
                                >
                                    Clear the library
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AppShell>
    )
}

function EntryTable(props: {
    entries: Entry[]
    inTrash: boolean
    onOpen: (entry: Entry) => void
    onToggleStar: (entry: Entry) => void
    onCopyLink: (entry: Entry) => void
    onUnshare: (entry: Entry) => void
    onDownload: (entry: Entry) => void
    onRename: (entry: Entry) => void
    onMove: (entry: Entry) => void
    onTrash: (entry: Entry) => void
    onRestore: (entry: Entry) => void
    onDelete: (entry: Entry) => void
}): React.ReactElement {
    return (
        <table className={styles.listTable}>
            <thead>
                <tr>
                    <th className={styles.listHeadCell} style={{ width: "45%" }}>
                        Name
                    </th>
                    <th className={styles.listHeadCell}>Size</th>
                    <th className={styles.listHeadCell}>Modified</th>
                    <th className={styles.listHeadCell} aria-label="Actions" />
                </tr>
            </thead>
            <tbody>
                {props.entries.map((entry) => (
                    <tr key={entry.id} className={styles.listRow}>
                        <td className={styles.listCell} onClick={() => props.onOpen(entry)}>
                            <span className={styles.nameCell}>
                                <button
                                    type="button"
                                    className={`${styles.starButton} ${entry.starred ? styles.starButtonOn : ""}`}
                                    aria-label={entry.starred ? "Unstar" : "Star"}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        props.onToggleStar(entry)
                                    }}
                                >
                                    {entry.starred ? "★" : "☆"}
                                </button>
                                <span className={styles.typeTag}>
                                    {driveTypeTag(entry.kind, entry.contentType)}
                                </span>
                                <span className={styles.entryName}>{entry.name}</span>
                                {entry.shared ? <span className={styles.sharedBadge}>Shared</span> : null}
                            </span>
                        </td>
                        <td className={styles.listCellMuted} onClick={() => props.onOpen(entry)}>
                            {entry.kind === "FOLDER" ? "—" : formatBytes(entry.sizeBytes)}
                        </td>
                        <td className={styles.listCellMuted} onClick={() => props.onOpen(entry)}>
                            {formatEntryDate(entry.updatedTime)}
                        </td>
                        <td className={`${styles.listCell} ${styles.actionsCell}`}>
                            {props.inTrash ? (
                                <>
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => props.onRestore(entry)}
                                    >
                                        Restore
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => props.onDelete(entry)}
                                    >
                                        Delete forever
                                    </button>
                                </>
                            ) : (
                                <>
                                    {entry.kind === "FILE" ? (
                                        <>
                                            <button
                                                type="button"
                                                className={styles.rowActionButton}
                                                onClick={() => props.onDownload(entry)}
                                            >
                                                Download
                                            </button>
                                            {entry.shared ? (
                                                <button
                                                    type="button"
                                                    className={styles.rowActionButton}
                                                    onClick={() => props.onUnshare(entry)}
                                                >
                                                    Unshare
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.rowActionButton}
                                                    onClick={() => props.onCopyLink(entry)}
                                                >
                                                    Share link
                                                </button>
                                            )}
                                        </>
                                    ) : null}
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => props.onRename(entry)}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => props.onMove(entry)}
                                    >
                                        Move
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => props.onTrash(entry)}
                                    >
                                        Trash
                                    </button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function GridThumb({ entry }: { entry: Entry }): React.ReactElement {
    const imageUrl =
        entry.thumbUrl ?? (drivePreviewKind(entry.contentType) === "image" ? entry.fileUrl : null)
    if (entry.kind === "FILE" && imageUrl != null) {
        return (
            <img
                className={styles.gridThumb}
                src={resolveStorageUrl(driveStorageEndpoint(), imageUrl)}
                alt={entry.name}
                loading="lazy"
            />
        )
    }
    return (
        <span className={styles.gridThumbFallback}>
            {entry.kind === "FOLDER" ? "DIR" : driveTypeTag(entry.kind, entry.contentType)}
        </span>
    )
}

function UploadTray(props: {
    jobs: DriveUploadJob[]
    uploading: boolean
    onClose: () => void
}): React.ReactElement {
    const done = props.jobs.filter((job) => job.status === "done").length
    return (
        <aside className={styles.uploadTray} aria-label="Uploads">
            <div className={styles.uploadTrayHeader}>
                <span>
                    Uploads {done}/{props.jobs.length}
                </span>
                {!props.uploading ? (
                    <button type="button" className={styles.uploadTrayClose} onClick={props.onClose}>
                        Dismiss
                    </button>
                ) : null}
            </div>
            {props.jobs.map((job) => (
                <div key={job.key} className={styles.uploadJobRow}>
                    <span className={styles.uploadJobName}>{job.fileName}</span>
                    <span className={jobStatusClass(job)}>{jobLabel(job)}</span>
                </div>
            ))}
        </aside>
    )
}

function jobStatusClass(job: DriveUploadJob): string {
    return job.status === "error" ? styles.uploadJobError : styles.uploadJobStatus
}

function jobLabel(job: DriveUploadJob): string {
    switch (job.status) {
        case "queued":
            return "Queued"
        case "uploading":
            return `Uploading ${formatBytes(job.sizeBytes)}`
        case "done":
            return "Done"
        case "error":
            return job.error ?? "Failed"
    }
}

function PreviewModal(props: {
    entry: Entry
    onClose: () => void
    onDownload: (entry: Entry) => void
}): React.ReactElement {
    const { entry } = props
    const kind = drivePreviewKind(entry.contentType)
    const resolvedUrl =
        entry.fileUrl != null ? resolveStorageUrl(driveStorageEndpoint(), entry.fileUrl) : undefined
    const [text, setText] = useState<string>()

    useEffect(() => {
        if (kind !== "text" || resolvedUrl === undefined) {
            return
        }
        let cancelled = false
        void fetch(resolvedUrl)
            .then((response) => response.text())
            .then((content) => {
                if (!cancelled) {
                    setText(content.slice(0, 20_000))
                }
            })
            .catch(() => undefined)
        return () => {
            cancelled = true
        }
    }, [kind, resolvedUrl])

    return (
        <div className={styles.previewBackdrop} onClick={props.onClose}>
            <div className={styles.previewCard} onClick={(event) => event.stopPropagation()}>
                <div className={styles.previewHeader}>
                    <span className={styles.typeTag}>{driveTypeTag(entry.kind, entry.contentType)}</span>
                    <span className={styles.entryName}>{entry.name}</span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
                        <button
                            type="button"
                            className={styles.rowActionButton}
                            onClick={() => props.onDownload(entry)}
                        >
                            Download
                        </button>
                        <button type="button" className={styles.rowActionButton} onClick={props.onClose}>
                            Close
                        </button>
                    </span>
                </div>
                <div className={styles.previewBody}>
                    {resolvedUrl === undefined ? (
                        <span className={styles.previewUnavailable}>No preview available.</span>
                    ) : kind === "image" ? (
                        <img className={styles.previewImage} src={resolvedUrl} alt={entry.name} />
                    ) : kind === "pdf" ? (
                        <iframe className={styles.previewFrame} src={resolvedUrl} title={entry.name} />
                    ) : kind === "text" ? (
                        <pre className={styles.previewText}>{text ?? "Loading…"}</pre>
                    ) : kind === "audio" ? (
                        <audio controls src={resolvedUrl} />
                    ) : kind === "video" ? (
                        <video controls className={styles.previewImage} src={resolvedUrl} />
                    ) : (
                        <span className={styles.previewUnavailable}>
                            No inline preview for this type — download it instead.
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

function NameDialog(props: {
    title: string
    initialValue: string
    submitLabel: string
    onSubmit: (name: string) => void
    onClose: () => void
}): React.ReactElement {
    const [value, setValue] = useState(props.initialValue)
    return (
        <div className={styles.dialogBackdrop} onClick={props.onClose}>
            <form
                className={styles.dialogCard}
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => {
                    event.preventDefault()
                    const trimmed = value.trim()
                    if (trimmed.length > 0) {
                        props.onSubmit(trimmed)
                    }
                }}
            >
                <h2 className={styles.dialogTitle}>{props.title}</h2>
                <input
                    className={styles.dialogInput}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    autoFocus
                    aria-label="Name"
                />
                <div className={styles.dialogActions}>
                    <button type="button" className={styles.buttonGhost} onClick={props.onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.buttonPrimary}>
                        {props.submitLabel}
                    </button>
                </div>
            </form>
        </div>
    )
}

function MoveDialog(props: {
    entry: Entry
    folders: Entry[]
    onSubmit: (destinationId: string | null) => void
    onClose: () => void
}): React.ReactElement {
    const [destination, setDestination] = useState<string>("")

    // A folder cannot move into its own subtree; hide those destinations.
    const blockedIds = useMemo((): Set<string> => {
        if (props.entry.kind !== "FOLDER") {
            return new Set()
        }
        const blocked = new Set([props.entry.id])
        let changed = true
        while (changed) {
            changed = false
            for (const folder of props.folders) {
                if (folder.parentId != null && blocked.has(folder.parentId) && !blocked.has(folder.id)) {
                    blocked.add(folder.id)
                    changed = true
                }
            }
        }
        return blocked
    }, [props.entry, props.folders])

    return (
        <div className={styles.dialogBackdrop} onClick={props.onClose}>
            <form
                className={styles.dialogCard}
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => {
                    event.preventDefault()
                    props.onSubmit(destination === "" ? null : destination)
                }}
            >
                <h2 className={styles.dialogTitle}>Move &quot;{props.entry.name}&quot;</h2>
                <select
                    className={styles.dialogSelect}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    aria-label="Destination folder"
                >
                    <option value="">All files (root)</option>
                    {props.folders
                        .filter((folder) => !blockedIds.has(folder.id))
                        .map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                </select>
                <div className={styles.dialogActions}>
                    <button type="button" className={styles.buttonGhost} onClick={props.onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.buttonPrimary}>
                        Move
                    </button>
                </div>
            </form>
        </div>
    )
}
