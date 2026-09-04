import { Button, EmptyState, Input, Label, Spinner, useToast } from "@ui"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    usePitchCreateDeckMutation,
    usePitchDeleteDeckMutation,
    usePitchDecksQuery,
} from "../../generated/graphql/types"
import { pitchPaths } from "./pitchShared"
import * as shared from "./pitchStyles.css"
import * as styles from "./DecksPage.styles.css"

/**
 * The deck roster (manifest destination `/decks`, packs/pitch): create a
 * deck, open one in the builder, or delete one. Slide copy defaults come
 * from the live books when they're connected.
 */
export default function DecksPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const decksQuery = usePitchDecksQuery()
    const [createDeck, createState] = usePitchCreateDeckMutation()
    const [deleteDeck] = usePitchDeleteDeckMutation()

    const [name, setName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [tagline, setTagline] = useState("")

    const create = async (): Promise<void> => {
        try {
            const result = await createDeck({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        name: name.trim(),
                        companyName: companyName.trim(),
                        tagline: tagline.trim() === "" ? undefined : tagline.trim(),
                    },
                },
                refetchQueries: ["PitchDecks"],
            })
            const deckId = result.data?.pitchCreateDeck.id
            setName("")
            setCompanyName("")
            setTagline("")
            if (deckId !== undefined) {
                navigate(`${pitchPaths.builder}?deck=${deckId}`)
            }
        } catch (caught) {
            toast.publish({
                title: "Creating the deck failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const remove = async (deckId: string): Promise<void> => {
        try {
            await deleteDeck({
                variables: { input: { deckId } },
                refetchQueries: ["PitchDecks"],
            })
            toast.publish({ title: "Deck deleted", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Deleting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (decksQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    if (decksQuery.error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{decksQuery.error.message}</p>
                </div>
            </section>
        )
    }

    const decks = decksQuery.data?.pitchDecks ?? []
    const canCreate = name.trim() !== "" && companyName.trim() !== "" && !createState.loading

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Decks</h1>
                <p className={shared.subtitle}>
                    Investor decks that fill themselves from your live books — edit the copy, keep the numbers
                    current.
                </p>
            </header>

            <div className={shared.card}>
                <h2 className={shared.cardTitle}>New deck</h2>
                <div className={styles.createRow}>
                    <div className={styles.createField}>
                        <Label htmlFor="pitch-deck-name">Deck name</Label>
                        <Input
                            id="pitch-deck-name"
                            value={name}
                            placeholder="Seed round"
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    <div className={styles.createField}>
                        <Label htmlFor="pitch-company-name">Company</Label>
                        <Input
                            id="pitch-company-name"
                            value={companyName}
                            placeholder="Acme Analytics"
                            onChange={(event) => setCompanyName(event.target.value)}
                        />
                    </div>
                    <div className={styles.createField}>
                        <Label htmlFor="pitch-tagline">Tagline (optional)</Label>
                        <Input
                            id="pitch-tagline"
                            value={tagline}
                            placeholder="Numbers that sell themselves"
                            onChange={(event) => setTagline(event.target.value)}
                        />
                    </div>
                    <Button onClick={() => void create()} disabled={!canCreate}>
                        {createState.loading ? "Creating..." : "Create deck"}
                    </Button>
                </div>
            </div>

            {decks.length === 0 ? (
                <EmptyState
                    title="No decks yet"
                    description="Create your first deck above — the slides arrive pre-filled from your books."
                />
            ) : (
                <div className={styles.deckGrid}>
                    {decks.map((deck) => (
                        <div key={deck.id} className={shared.card}>
                            <div className={shared.cardHeader}>
                                <h2 className={shared.cardTitle}>{deck.name}</h2>
                                <span className={styles.accentDot} style={{ background: deck.accentColor }} />
                            </div>
                            <p className={shared.mutedText}>
                                {deck.companyName}
                                {deck.tagline ? ` — ${deck.tagline}` : ""}
                            </p>
                            <div className={shared.row}>
                                <Button onClick={() => navigate(`${pitchPaths.builder}?deck=${deck.id}`)}>
                                    Open builder
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => void remove(deck.id)}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
