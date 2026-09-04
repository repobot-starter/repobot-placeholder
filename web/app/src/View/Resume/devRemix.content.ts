/**
 * The developer remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the résumé pack from the product manager to
 * a staff engineer — same document shape, different trade. The derived
 * template `repobot-resume-dev` is composed from the resume pack with this
 * file copied over `content.ts` and the monochrome register overlays from
 * `packs/resume-dev/catalog.json` (the monolith preset's true-black dark
 * appearance + IBM Plex Mono + an achromatic white accent) merged over the
 * pack's editorial paper and archival ink-blue.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same shapes, dates as "YYYY-MM" data with
 * durations never written into prose (the page computes them — dates.ts).
 * The parity test (`tests/View/Resume/remixSeeds.test.ts`) pins the export
 * surface and the content rules against the real module, so the seed fails
 * CI the moment the pack's contract moves without it.
 *
 * `landingCopy` is where the remix retrades the register's voice: git-log
 * kickers and repository framing over the exact same skeleton.
 */

export interface Role {
    title: string
    company: string
    /** First month on the job, "YYYY-MM". */
    start: string
    /** Last month on the job, "YYYY-MM"; omit while you still work there. */
    end?: string
    /** Two or three lines on what you owned and what happened because of you. */
    summary: string
}

export interface Education {
    credential: string
    school: string
    /** Display years, e.g. "2011 – 2015" — no math runs on these. */
    years: string
}

export interface SkillGroup {
    title: string
    skills: string[]
}

export interface Project {
    title: string
    description: string
    /** Display year, e.g. "2024". */
    year: string
    /** Where the work lives — for a developer, the repository.
     * Omit until it's a real repo: the shipped demo destinations are
     * fiction, and a card that navigates to a dead page is worse than an
     * unlinked card. */
    url?: string
    /** Short trailing note beside the title, e.g. the language and license. */
    meta?: string
}

export interface ProfileLink {
    label: string
    /** Display text, e.g. "github.com/trivera". */
    value: string
    /** Omit until the profile is real: the shipped placeholder addresses
     * point nowhere, and a dead external link is worse than plain text. */
    url?: string
}

export const person = {
    name: "Tomás Rivera",
    title: "Staff software engineer",
    location: "Portland, OR",
    email: "tomas@rivera.example",
    /** Shown as the hero badge; empty string hides it. */
    availability: "Open to staff+ infrastructure roles",
    summary: [
        "I build the systems other engineers stand on — build pipelines, deploy machinery, the paved road. Mostly Go and TypeScript, always with a runbook.",
        "The through-line: boring technology, exciting uptime. If it can page at 3am, I want to be the one who wrote the doc that fixes it.",
    ],
}

export const roles: Role[] = [
    {
        title: "Staff software engineer",
        company: "Halyard",
        start: "2022-08",
        summary:
            "Own the deploy platform under four product teams: a build graph that caches honestly, canary rollouts with automatic rollback, and a paved road a new service joins in an afternoon. On-call pages fell by half after the first team moved on.",
    },
    {
        title: "Senior software engineer",
        company: "Cinder Data",
        start: "2019-02",
        end: "2022-07",
        summary:
            "Took ingestion from a nightly cron to streaming: exactly-once delivery over Kafka, schema contracts enforced in CI, and a backfill tool that made re-processing history a command instead of a project. The pipeline outlived two rewrites of everything around it.",
    },
    {
        title: "Software engineer",
        company: "Mapmaker",
        start: "2016-07",
        end: "2019-01",
        summary:
            "Shipped the routing engine's isochrone API and the tile pipeline behind it. Learned Postgres properly by breaking it in every way the documentation warns about, then wrote the internal guide so nobody had to repeat the course.",
    },
    {
        title: "Research systems programmer",
        company: "Cascade Lab, University of Washington",
        start: "2015-06",
        end: "2016-06",
        summary:
            "Kept a fleet of simulation nodes alive for climate researchers on a grant budget. First exposure to real operations: monitoring, batch scheduling, and the art of the polite outage email.",
    },
]

export const education: Education[] = [
    {
        credential: "B.S. Computer Science",
        school: "University of Washington",
        years: "2011 – 2015",
    },
    {
        credential: "Certified Kubernetes Administrator",
        school: "Cloud Native Computing Foundation",
        years: "2021",
    },
]

export const skillGroups: SkillGroup[] = [
    {
        title: "Languages",
        skills: ["Go", "TypeScript", "Rust", "SQL"],
    },
    {
        title: "Infrastructure",
        skills: ["Kubernetes", "Terraform", "Postgres", "Kafka"],
    },
    {
        title: "Practices",
        skills: ["Incident command", "Design docs", "Code review", "Observability"],
    },
    {
        title: "Tooling",
        skills: ["Bazel", "Nix", "GitHub Actions", "Grafana"],
    },
]

// Projects ship without `url`: the demo repositories are fiction, so the
// cards render unlinked until you point them at your real repos.
export const projects: Project[] = [
    {
        title: "queuecraft",
        description:
            'A backpressure-aware Postgres job queue: transactional enqueue, fair scheduling across tenants, and a dashboard that answers "why is my job late".',
        year: "2024",
        meta: "Go · MIT",
    },
    {
        title: "planprint",
        description:
            "Terraform plans summarized for pull requests — what changes, what gets destroyed, what it costs — as the one comment reviewers actually read.",
        year: "2023",
        meta: "Rust · MIT",
    },
    {
        title: "sqlsketch",
        description:
            "Live schema diagrams from a connection string: point it at Postgres, get a readable ER diagram and the migration history that built it.",
        year: "2025",
        meta: "TypeScript · MIT",
    },
]

// The non-email entries ship without `url`: the addresses are demo fiction,
// so they render as plain text until you replace them with your real
// profiles (set both `value` and `url`).
export const links: ProfileLink[] = [
    { label: "GitHub", value: "github.com/trivera" },
    { label: "Email", value: "tomas@rivera.example", url: "mailto:tomas@rivera.example" },
    { label: "Blog", value: "rivera.example/notes" },
    { label: "LinkedIn", value: "linkedin.com/in/tomasrivera" },
]

/**
 * Register-owned strings, re-valued for the terminal register: git-log
 * kickers, repository framing, the same one conversion. The skeleton and
 * the math stay the base pack's.
 */
export const landingCopy = {
    /** The print CTA — the same page typesets to a one-page PDF. */
    printCta: "Download résumé",
    contactCta: "Email me",
    summary: { kicker: "README" },
    experience: { kicker: "git log", title: "A history of shipping" },
    stats: {
        experienceLabel: "of experience",
        rolesLabel: "roles held",
        projectsLabel: "repos below",
    },
    skills: { kicker: "Stack", title: "The working set" },
    projects: { kicker: "Repositories", title: "Code you can read tonight" },
    education: { kicker: "Education", title: "The paper trail" },
    links: {
        kicker: "Links",
        title: "Elsewhere on the network",
        body: "The commit history says more than this page does — or skip the clicking and just write.",
    },
}
