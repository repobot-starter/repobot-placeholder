import { AiChatThread, AppShell, type AppShellNavItem, type AppShellNavSection } from "@ui"
import React, { useCallback, useMemo, useState } from "react"
import { useAiChat } from "../../Ai/useAiChat"
import AgentDataPanel from "./AgentDataPanel"
import AgentVoicePanel from "./AgentVoicePanel"
import * as styles from "./AgentDeskPage.styles.css"

const SUGGESTIONS = [
    "What's number one, and why is it still famous?",
    "Put Fast Car by Tracy Chapman on the chart",
    "Who on this list would surprise a teenager?",
]

type DeskTab = "agent" | "voice" | "data"

/** Nav ids carry their meaning: the three desk surfaces plus the reset action. */
const NAV_ID_BY_TAB: Record<DeskTab, string> = {
    agent: "desk:agent",
    voice: "desk:voice",
    data: "desk:data",
}

const NAV_NEW_CHAT = "action:new-chat"

function ChartsBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="4.5" fill="currentColor" />
        </svg>
    )
}

/**
 * The agent pack's desk: Agent (chat), Voice (hold-to-talk), Data (the
 * living songs catalog). Dark, black-and-white, one page. ChatGPT is the
 * mind; ElevenLabs is the voice; both share the same table. The chrome is
 * the kernel AppShell (the old wordmark-and-tabs header became the shell's
 * brand slot and nav rail), so the theme contract restyles the desk too.
 */
export default function AgentDeskPage(): React.ReactElement {
    const [tab, setTab] = useState<DeskTab>("agent")
    const chat = useAiChat()

    const showNewChat = tab === "agent" && chat.responses.length > 0

    const navSections = useMemo((): AppShellNavSection[] => {
        const sections: AppShellNavSection[] = [
            {
                id: "desk",
                title: "Desk",
                items: [
                    {
                        id: NAV_ID_BY_TAB.agent,
                        label: "Agent",
                        icon: <span className={styles.navGlyph}>◆</span>,
                    },
                    {
                        id: NAV_ID_BY_TAB.voice,
                        label: "Voice",
                        icon: <span className={styles.navGlyph}>◉</span>,
                    },
                    {
                        id: NAV_ID_BY_TAB.data,
                        label: "Data",
                        icon: <span className={styles.navGlyph}>▤</span>,
                    },
                ],
            },
        ]
        if (showNewChat) {
            sections.push({
                id: "session",
                title: "Session",
                items: [
                    {
                        id: NAV_NEW_CHAT,
                        label: "New chat",
                        icon: <span className={styles.navGlyph}>＋</span>,
                    },
                ],
            })
        }
        return sections
    }, [showNewChat])

    const onNavSelect = useCallback(
        (item: AppShellNavItem): void => {
            if (item.id === NAV_NEW_CHAT) {
                chat.reset()
                return
            }
            const nextTab = (Object.keys(NAV_ID_BY_TAB) as DeskTab[]).find(
                (candidate) => NAV_ID_BY_TAB[candidate] === item.id,
            )
            if (nextTab !== undefined) {
                setTab(nextTab)
            }
        },
        [chat],
    )

    return (
        <AppShell
            title="The Charts"
            brandIcon={<ChartsBrandIcon />}
            sections={navSections}
            activeItemId={NAV_ID_BY_TAB[tab]}
            onItemSelect={onNavSelect}
        >
            <div className={styles.page}>
                <div className={styles.body}>
                    {tab === "agent" ? (
                        <div className={styles.chatBody}>
                            <AiChatThread
                                responses={chat.responses}
                                streaming={chat.streaming}
                                errorMessage={chat.errorMessage}
                                onSubmit={chat.submit}
                                onStop={chat.stop}
                                emptyTitle="Talk to the catalog"
                                emptyHint="Ask about the chart, add a song, or argue with the ranking. The agent reads the same table as the Data tab."
                                suggestions={SUGGESTIONS}
                            />
                        </div>
                    ) : null}
                    {tab === "voice" ? <AgentVoicePanel /> : null}
                    {tab === "data" ? <AgentDataPanel /> : null}
                </div>
            </div>
        </AppShell>
    )
}
