import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingGlyph } from "./MarketingGlyph"
import * as styles from "./MarketingTeam.styles.css"

export type MarketingTeamVariant = "grid" | "list" | "portraits"

export interface MarketingTeamMember {
    media?: MarketingMedia
    name: string
    role: string
    bio?: string
}

export interface MarketingTeamContent {
    kicker?: string
    title?: string
    members: MarketingTeamMember[]
}

export interface MarketingTeamProps extends MarketingTeamContent {
    variant?: MarketingTeamVariant
    anchorId?: string
}

// Emoji avatars render as seeded glyphs too — platform emoji read as
// template filler — so the character only differentiates the artwork.
function TeamAvatar({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={styles.avatarEmoji} aria-hidden>
                <MarketingGlyph seed={seed} size={56} />
            </div>
        )
    }
    return <MarketingImage className={styles.avatarImg} {...marketingImageProps(media)} sizes="112px" />
}

// The portraits variant renders the member's photograph as a full 3:4
// frame — the photography-led treatment; glyph/emoji stand-ins keep the
// frame so a half-bound team doesn't collapse the rhythm.
function TeamPortrait({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={styles.portraitEmoji} aria-hidden>
                <MarketingGlyph seed={seed} size={72} />
            </div>
        )
    }
    return (
        <MarketingImage
            className={styles.portraitImg}
            {...marketingImageProps(media)}
            sizes="(max-width: 700px) 100vw, 25vw"
        />
    )
}

/**
 * "Who's behind this?" — the people, three ways. `grid` centers circled
 * faces in cells and `list` is a narrow column of rows with room for
 * longer bios; `portraits` gives each member their photograph as a full
 * 3:4 frame with the caption set beneath — the treatment for studios
 * whose photography carries the page (coaches, instructors, artists).
 */
export function MarketingTeam({
    variant = "grid",
    anchorId,
    kicker,
    title,
    members,
}: MarketingTeamProps): React.ReactElement {
    if (variant === "portraits") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Team"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={styles.portraits}>
                    {members.map((member) => (
                        <article key={member.name} className={styles.portraitFigure}>
                            {member.media !== undefined ? (
                                <TeamPortrait media={member.media} seedHint={member.name} />
                            ) : null}
                            <h3 className={styles.portraitName}>{member.name}</h3>
                            <span className={styles.portraitRole}>{member.role}</span>
                            {member.bio !== undefined ? (
                                <p className={styles.portraitBio}>{member.bio}</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            </section>
        )
    }
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Team"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "list" ? (
                <div className={styles.list}>
                    {members.map((member) => (
                        <article key={member.name} className={styles.listRow}>
                            {member.media !== undefined ? (
                                <TeamAvatar media={member.media} seedHint={member.name} />
                            ) : null}
                            <div>
                                <h3 className={styles.name}>{member.name}</h3>
                                <span className={styles.role}>{member.role}</span>
                                {member.bio !== undefined ? <p className={styles.bio}>{member.bio}</p> : null}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {members.map((member) => (
                        <article key={member.name} className={styles.gridMember}>
                            {member.media !== undefined ? (
                                <TeamAvatar media={member.media} seedHint={member.name} />
                            ) : null}
                            <h3 className={styles.name}>{member.name}</h3>
                            <span className={styles.role}>{member.role}</span>
                            {member.bio !== undefined ? <p className={styles.bio}>{member.bio}</p> : null}
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
