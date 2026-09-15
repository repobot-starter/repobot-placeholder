/**
 * The bridge between content files and the generated demo-loop waveforms.
 *
 * Content modules (View/<Pack>/content.ts) must stay PURE DATA: the
 * workspace content service evaluates a pack's content module standalone
 * (transpiled per-file, run in a bare vm), so a value import of another
 * TypeScript module — demoLoops.gen.ts included — is a Content-panel load
 * error, not just bad taste. Tracks therefore carry the demo-loop KEY, and
 * the pages merge the generated `seconds`/`peaks` here, at render level,
 * where importing generated code is fine.
 */

import type { PlayableTrack } from "./AudioPlayer"
import { DEMO_LOOPS } from "./demoLoops.gen"

export type DemoLoopKey = keyof typeof DEMO_LOOPS

/**
 * A track as a content file declares it: everything the player needs
 * except the generated waveform, which `loop` names in demoLoops.gen.ts.
 */
export interface ContentTrack extends Omit<PlayableTrack, "seconds" | "peaks"> {
    loop: DemoLoopKey
}

/** The playable track: the content declaration plus its generated loop. */
export function withDemoLoop<T extends ContentTrack>(track: T): T & PlayableTrack {
    const { seconds, peaks } = DEMO_LOOPS[track.loop]
    return { ...track, seconds, peaks }
}
