/**
 * Item identity for the platform's preview editor, the per-item sibling of
 * the section stamps in the app's LandingRenderer. A marketing component
 * stamps each element it maps from an ordered content list so hit-testing
 * can resolve a DOM point to "item N of section S's <list>" — that's what
 * lets the magic editor's move mode drag a nav link or feature card, not
 * just whole sections. `list` names the content field (e.g. "links",
 * "features", "tiers"); `index` is the RENDERED position, i.e. after the
 * landing document's `order` permutation has been applied to the content
 * array. A list rendered more than once in a section (e.g. a mobile menu
 * mirroring desktop nav links) must stamp only its primary rendering, so
 * (section, list, index) stays unique for geometry collection.
 */
export function marketingItemStamp(
    list: string,
    index: number,
): { "data-rb-item-list": string; "data-rb-item-index": number } {
    return { "data-rb-item-list": list, "data-rb-item-index": index }
}

/**
 * A link's stable identity for order storage. The shared shell chrome
 * filters the current page out of its own links, so its rendered indices
 * differ page to page — an index permutation stored on one page would
 * scramble on the next. Keys don't: the landing document's
 * `shell.nav.order.links` stores these, and the merge reorders whatever
 * subset a page renders consistently. Deliberately the RAW config target
 * (href / #anchor / label), never the BASE_PATH-prefixed render href, so
 * the stamped key equals the key the merge computes from config.
 */
export function marketingLinkKey(cta: { href?: string; anchor?: string; label: string }): string {
    return cta.href ?? (cta.anchor !== undefined ? `#${cta.anchor}` : cta.label)
}

/**
 * A replaceable photograph for the platform's preview editor. Distinct from
 * item stamps: FAQ rows and pricing tiers are items, not media. The magic
 * editor's hover-Replace and drop-an-image gestures hit-test this, so a
 * gallery tile, hero slide, collection cover, or content-split portrait
 * can take a user file without going through the agent. `list` names the
 * content field (`items`, `slides`, or `media`); `index` is the RENDERED
 * position after any document `order` permutation.
 */
export function marketingMediaStamp(
    list: string,
    index: number,
): { "data-rb-media-list": string; "data-rb-media-index": number } {
    return { "data-rb-media-list": list, "data-rb-media-index": index }
}

/**
 * An editable piece of copy for the platform's preview editor — the text
 * sibling of the media stamp. A component stamps each element whose text
 * comes straight from a string in its content config, so the editor's text
 * mode can resolve a click to "section S's `headline`" (or, with
 * `list`/`index`, "the `title` of item N of `features`") and write the
 * edit back as a landing-document text override. `field` is the dotted
 * path WITHIN the item (or the section content for scalar fields) — e.g.
 * "headline", "cta.label", "question". `index` is the RENDERED position,
 * i.e. after the document's `order` permutation; the platform composes it
 * back to the code index exactly as it does for media. Only stamp elements
 * whose visible text IS the config string verbatim — decorated text (the
 * hero headline's accent spans) is fine, injected/derived text is not.
 */
export function marketingTextStamp(
    field: string,
    list?: string,
    index?: number,
): Record<string, string | number> {
    const stamp: Record<string, string | number> = { "data-rb-text-field": field }
    if (list !== undefined && index !== undefined) {
        stamp["data-rb-text-list"] = list
        stamp["data-rb-text-index"] = index
    }
    return stamp
}
