/**
 * The résumé pack's single content file: the person, the roles, the
 * education, the skills, the selected projects, and the links. Everything
 * the site renders comes from here — edit this file (not the page
 * components) to make the résumé yours. Paste a LinkedIn export or an
 * existing résumé at the agent and have it fill these fields (see PACK.md).
 *
 * Dates are data, never prose: a role carries `start` (and `end` when it's
 * over) as "YYYY-MM", and the page computes the rest at render time —
 * "2019 – Present · 6 yrs", the hero's total years of experience, and the
 * most-recent-first ordering (dates.ts). Never write a duration by hand.
 *
 * `landingCopy` holds the register-owned strings (section titles, CTA
 * labels): a remix seed retitles the whole page by re-valuing them — see
 * the resume-dev derived template.
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
    /** Where the work lives — a case study, a launch page, a repository.
     * Omit until it's a real page: the shipped demo destinations are
     * fiction, and a card that navigates to a dead page is worse than an
     * unlinked card. */
    url?: string
    /** Short trailing note beside the title, e.g. the host or the outcome. */
    meta?: string
}

export interface ProfileLink {
    label: string
    /** Display text, e.g. "linkedin.com/in/amarasethi". */
    value: string
    /** Omit until the profile is real: the shipped placeholder addresses
     * point nowhere, and a dead external link is worse than plain text. */
    url?: string
}

export const person = {
    name: "Amara Sethi",
    title: "Senior product manager",
    location: "Chicago, IL",
    email: "amara@sethi.example",
    /** Shown as the hero badge; empty string hides it. */
    availability: "Open to senior product roles",
    summary: [
        "I run discovery and delivery for products where the stakes are unambiguous — claims people depend on, money that has to reconcile to the cent. Small teams, clear bets, written decisions.",
        "The through-line: I'd rather kill a roadmap item with a two-week experiment than ship a quarter of guesswork.",
    ],
}

export const roles: Role[] = [
    {
        title: "Senior product manager",
        company: "Northbeam Health",
        start: "2022-04",
        summary:
            "Own the care-plan product across four payer integrations. Rebuilt intake around eligibility data the plans already had — enrollment now completes in one visit instead of three, and the team ships against a written product spec instead of a backlog of tickets.",
    },
    {
        title: "Product manager",
        company: "Ledgerline",
        start: "2019-01",
        end: "2022-03",
        summary:
            "Took reconciliation from a spreadsheet export to the product's reason to exist: instant matching over bank feeds, exceptions routed to humans, an audit trail accountants actually cite. Churn on the finance tier fell by a third in the year after launch.",
    },
    {
        title: "Associate product manager",
        company: "Brightside Labs",
        start: "2017-06",
        end: "2018-12",
        summary:
            "Ran experimentation for onboarding: fourteen A/B tests, four survivors, one rewrite of the first-run flow. Learned to write the decision memo before the test, not after.",
    },
    {
        title: "Product analyst",
        company: "Corvid Analytics",
        start: "2015-09",
        end: "2017-05",
        summary:
            "The SQL years. Built the retention model the sales team quoted for two funding rounds and the dashboards the product team argued over every Monday.",
    },
]

export const education: Education[] = [
    {
        credential: "B.S. Human–Computer Interaction",
        school: "University of Michigan",
        years: "2011 – 2015",
    },
    {
        credential: "Certified Scrum Product Owner",
        school: "Scrum Alliance",
        years: "2018",
    },
]

export const skillGroups: SkillGroup[] = [
    {
        title: "Product",
        skills: ["Discovery & research", "Roadmapping", "Experiment design", "Pricing & packaging"],
    },
    {
        title: "Evidence",
        skills: ["SQL", "Amplitude", "Cohort & retention analysis", "User interviews"],
    },
    {
        title: "Working style",
        skills: ["Written decision memos", "Design sprints", "Stakeholder alignment", "Roadmap reviews"],
    },
    {
        title: "Tools",
        skills: ["Figma", "Linear", "Notion", "Looker"],
    },
]

// Projects ship without `url`: the demo destinations are fiction, so the
// cards render unlinked until you point them at real case studies or repos.
export const projects: Project[] = [
    {
        title: "Care-plan builder",
        description:
            "The Northbeam flagship: assemble a compliant care plan from payer rules in minutes, not days. I own the product end to end.",
        year: "2024",
        meta: "Northbeam Health",
    },
    {
        title: "Instant reconciliation",
        description:
            "Ledgerline's bank-feed matching engine and the exception queue around it — the launch that moved the company upmarket.",
        year: "2021",
        meta: "Ledgerline",
    },
    {
        title: "The decision memo, in practice",
        description:
            "A talk on running product decisions as one-page written arguments — given at ProductCamp Chicago, notes published.",
        year: "2023",
        meta: "Talk & essay",
    },
]

// The non-email entries ship without `url`: the addresses are demo fiction,
// so they render as plain text until you replace them with your real
// profiles (set both `value` and `url`).
export const links: ProfileLink[] = [
    { label: "Email", value: "amara@sethi.example", url: "mailto:amara@sethi.example" },
    { label: "LinkedIn", value: "linkedin.com/in/amarasethi" },
    { label: "Website", value: "amarasethi.example" },
    { label: "Notes", value: "amarasethi.example/notes" },
]

/**
 * Register-owned strings: the words the PAGE says, as opposed to the words
 * the PERSON says. A remix seed (resume-dev) re-values these to retrade the
 * register — terminal-flavored titles over the same skeleton — without
 * touching the landing config.
 */
export const landingCopy = {
    /** The print CTA — the same page typesets to a one-page PDF. */
    printCta: "Download résumé",
    contactCta: "Email me",
    summary: { kicker: "Profile" },
    experience: { kicker: "Experience", title: "Where the years went" },
    stats: {
        experienceLabel: "of experience",
        rolesLabel: "roles held",
        projectsLabel: "selected projects",
    },
    skills: { kicker: "Skills", title: "What I bring" },
    projects: { kicker: "Selected work", title: "Work worth a click" },
    education: { kicker: "Education", title: "Credentials" },
    links: {
        kicker: "Links",
        title: "Find me elsewhere",
        body: "The long version lives on these profiles — or skip the clicking and just write.",
    },
}
