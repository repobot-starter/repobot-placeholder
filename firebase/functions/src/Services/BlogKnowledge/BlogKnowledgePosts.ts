/**
 * The blog pack's posts, mirrored for the retrieval exemplar ("chat with
 * your data" — docs/ai.md, Retrieval). The blog pack already mirrors its
 * posts per platform (web/app/src/View/Blog/content.ts, BlogContent.swift,
 * BlogContent.kt); this is the backend mirror, carrying only what indexing
 * and citations need. When you edit the blog's posts, update this mirror
 * too — the retrieval index re-embeds changed content automatically on the
 * next search.
 *
 * A real publishing workflow (posts in the database) replaces this file
 * with the posts domain's own rows; the indexing call stays the same.
 */

export interface BlogKnowledgePost {
    slug: string
    title: string
    summary: string
    body: string
}

export const blogKnowledgePosts: BlogKnowledgePost[] = [
    {
        slug: "twenty-minute-design-review",
        title: "The 20-minute design review",
        summary:
            "Most design reviews fail because they try to do three jobs at once. Split them, cap the clock, and the meeting fixes itself.",
        body: `Every bad design review I've sat through was three meetings wearing one calendar slot: a status update, a brainstorm, and a decision. Nobody agreed which one we were in, so we did all three badly.

The fix that stuck for my team was embarrassingly small: **one review, one job, twenty minutes.**

### The format

1. Five minutes: the author walks the problem, not the solution
2. Ten minutes: questions that start with "what happens when"
3. Five minutes: the author says what they'll change, out loud

That last step matters most. The author summarizes — not the loudest reviewer. If the author leaves the room saying *"so I'll flatten the settings tree and drop the modal"*, the review produced a decision. If they leave with a page of sticky notes, it produced homework.

### What we stopped doing

- No pixel feedback in review — that goes async, in comments
- No new scope — "what if it also" gets parked by the note-taker
- No attendance over six people — spectators turn reviews into theater

> A review is a tool for changing the work while it's still cheap to change. Everything else is a meeting about a meeting.

We've run this for about a year. The twenty-minute cap gets broken maybe one review in ten, and when it does, it's because the problem statement was fuzzy — which is exactly the thing worth finding out early.`,
    },
    {
        slug: "small-parsers",
        title: "Write the small parser",
        summary:
            "You probably don't need the 40 kB library. A constrained input format plus eighty lines of scanner is often the sturdier choice.",
        body: `There's a reflex, when a feature needs to render formatted text, to reach for the biggest markdown library on the registry. Sometimes that's right. But when *you* control the input — config files, release notes, docs your own team writes — the calculus flips.

A full parser is built to survive adversarial input from strangers. Your input isn't adversarial. It's six kinds of block written by people you can talk to.

### What a subset buys you

- **Predictability.** Every construct the renderer sees is one you chose to support
- **Portability.** Eighty lines of scanner ports to Swift or Kotlin in an afternoon; a dependency doesn't
- **Debuggability.** When rendering looks wrong, you read one file, not a plugin pipeline

The trick is refusing features. No nested emphasis. No tables. No HTML passthrough. Each "no" is a bug class that can't exist.

When you genuinely need CommonMark — user-generated content, imported documents — take the dependency and don't look back. But notice how rarely that's the situation you're actually in.`,
    },
    {
        slug: "field-notes-system",
        title: "My field-notes system",
        summary:
            "One append-only text file per project, three prefixes, and a Friday sweep. It has outlived every app I've tried.",
        body: `I've tried every notes app with a keyboard shortcut and a dark mode. What survived is a text file.

One file per project, append-only, newest at the bottom. Every line gets one of three prefixes:

- \`?\` — an open question I can't answer yet
- \`!\` — a decision, with one line of why
- \`~\` — a loose observation that might matter later

### Why prefixes beat structure

Notes die when filing them costs more than writing them. A prefix costs one keystroke and makes the file *scannable*: grep for \`!\` and you have a decision log; grep for \`?\` and you have your open threads.

> The value of a note is set when you read it, not when you write it. Optimize for the future reader — who is you, tired, six weeks from now.

### The Friday sweep

Fifteen minutes, end of week. Walk the \`?\` lines: answer what's answerable, delete what stopped mattering, promote what's grown into real work. The sweep is the system — without it the file is a diary, with it it's a tool.

I keep the file in the repo, next to the code it describes. It goes through review like everything else, which has a nice side effect: teammates correct my decision log while the context is still warm.`,
    },
    {
        slug: "shipping-weekend-projects",
        title: "Shipping a weekend project without hating Monday",
        summary:
            "The weekend project graveyard is full of second Sundays. Scope to one sitting, cut the login page, and publish something embarrassing.",
        body: `The failure mode of the weekend project isn't running out of skill. It's running out of *weekend* — arriving at Sunday night with an auth flow, an empty README, and no feature.

Rules I now follow, learned the slow way:

1. Scope to **one sitting**, not one weekend — if the core loop doesn't run by the first evening, the project is mis-scoped
2. Cut the login page — nobody's identity needs protecting on a toy with zero users
3. Hardcode the content — a config UI is a second project wearing the first one's clothes
4. Publish before polishing — a live URL creates gravity that a local branch never does

### The embarrassment budget

Every project gets an *embarrassment budget*: the list of things I'm willing to ship broken. Spending it is the point. The unstyled settings page, the emoji favicon, the README that's three sentences — those aren't debt, they're proof the important part got the hours.

> Finished and modest beats ambitious and abandoned, every single time.

The projects that grew into something real were, without exception, the ones that shipped small first. The graveyard is full of the other kind.`,
    },
    {
        slug: "reading-time-is-a-promise",
        title: "Reading time is a promise",
        summary:
            "That little '4 min read' label is a contract with the reader. Breaking it costs more than leaving it off.",
        body: `A reading-time label looks like a convenience feature. It's actually a promise: *this is how much of your attention I'm asking for.*

Which means it can be broken. The essay labeled four minutes that's really eleven — dense with footnotes, detours, a comment section masquerading as a conclusion — doesn't just run long. It teaches the reader that your labels lie.

### Keeping the promise

- Compute it honestly: word count over a real reading pace, around 220 words per minute — no rounding down to look snappy
- Let it discipline the writing: if the label says seven minutes and the point fits in four, the label is a code review comment
- Leave it off ephemeral pages — a changelog entry doesn't need a contract

The deeper habit is treating *all* metadata as promises. The date says this is current. The tag says this is about what it claims. The summary says the middle won't surprise you. Small labels, honestly kept, are most of what trust in a publication is made of.`,
    },
]
