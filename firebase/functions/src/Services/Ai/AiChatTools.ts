import { OpenAiToolDefinition } from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { blogKnowledgeService } from "../BlogKnowledge/index.js"
import { quickBooksService, SimulatedInvoiceStatus } from "../QuickBooks/index.js"
import { songsService } from "../Songs/index.js"

/**
 * The assistant's tools. The starter ships one exemplar — a clock — to
 * demonstrate the full tool-call loop end to end (model requests the tool,
 * the service runs it, the output feeds the next model turn, and both steps
 * stream to the UI), plus the QuickBooks domain tools that make the
 * accounting advisor useful. Add a tool by extending this list and giving it
 * a case in executeAiChatTool; keep outputs as JSON strings.
 */
export const aiChatTools: OpenAiToolDefinition[] = [
    {
        type: "function",
        name: "get_current_time",
        description:
            "Returns the current date and time. Use whenever the user asks about the " +
            "current time, date, or day of the week.",
        parameters: {
            type: "object",
            properties: {
                timezone: {
                    type: "string",
                    description: 'Optional IANA timezone, e.g. "America/Los_Angeles". Defaults to UTC.',
                },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "search_blog_posts",
        description:
            "Semantic search over the blog's published posts (the retrieval exemplar — " +
            "docs/ai.md). Returns the most relevant passages with each post's title and " +
            "slug. Use for questions about what the blog or its author has written; " +
            "ground the answer in the returned passages and cite the post titles.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "What to look for, in natural language.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "quickbooks_company_snapshot",
        description:
            "Returns the connected QuickBooks company's headline numbers: revenue (paid " +
            "invoices), outstanding and overdue balances, invoice counts by status, and the " +
            "customer count. Monetary amounts are in the currency's minor units (cents for USD). " +
            "Use for questions about overall revenue, cash owed, or business health.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "quickbooks_list_invoices",
        description:
            "Returns the connected QuickBooks company's invoices: document number, customer, " +
            "status (PAID, OPEN, or OVERDUE), issue and due dates, total, and unpaid balance. " +
            "Monetary amounts are in minor units (cents for USD). Use for questions about " +
            "specific invoices, what is due or late, or billing history.",
        parameters: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["PAID", "OPEN", "OVERDUE"],
                    description: "Optional status filter; omit to list every invoice.",
                },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "quickbooks_list_customers",
        description:
            "Returns the connected QuickBooks company's customers: name, company, email, " +
            "location, customer-since date, and open (unpaid) balance in minor units (cents " +
            "for USD). Use for questions about customers, who owes money, or the client list.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "quickbooks_profit_and_loss",
        description:
            "Returns thirteen trailing months of the connected company's profit & loss, oldest " +
            "first: income and expense lines by category with monthly totals and net income, in " +
            "minor units (cents for USD). Use for questions about profitability, margins, " +
            "spending by category, or month-over-month trends.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "quickbooks_balance_sheet",
        description:
            "Returns thirteen trailing month-end balance sheets for the connected company, " +
            "oldest first: asset, liability, and equity lines by category with totals, in minor " +
            "units (cents for USD). Use for questions about cash position, receivables, debt, " +
            "or overall financial position.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "list_songs",
        description:
            "Returns the living most-popular-songs chart in rank order (rank 1 is the top). " +
            "Each row has id, rank, title, artist, year, genre, lifetime streams in billions, " +
            "and curator notes. Use for 'what's number one', 'top ten', or the full list.",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "integer",
                    description: "How many rows to return, from the top. Defaults to 24, max 100.",
                },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "search_songs",
        description:
            "Finds songs on the chart by a case-insensitive substring across title, artist, " +
            "genre, and notes. Use when the user names a song, artist, or era.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "What to look for, in natural language or a name.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "get_song",
        description:
            "Returns one song by id, chart rank, or exact title. Use when you already know " +
            "which row to inspect before updating it.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The song's id (sng_…)." },
                rank: { type: "integer", description: "Chart rank; 1 is the top." },
                title: { type: "string", description: "Exact title match, case-insensitive." },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "add_song",
        description:
            "Adds a song to the chart. Rank must be free — if it is taken, pick another or " +
            "update the occupying song first. Confirm the new row to the user.",
        parameters: {
            type: "object",
            properties: {
                rank: { type: "integer", description: "Chart rank to occupy; 1 is the top." },
                title: { type: "string" },
                artist: { type: "string" },
                year: { type: "integer" },
                genre: { type: "string" },
                streamsBillions: {
                    type: "number",
                    description: "Lifetime streams in billions, if known.",
                },
                notes: {
                    type: "string",
                    description: "A short curator note — why this song belongs.",
                },
            },
            required: ["rank", "title", "artist", "year", "genre"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "update_song",
        description:
            "Updates a song on the chart (rank, title, artist, year, genre, streams, notes). " +
            "Identify it by id. A new rank must be free.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The song's id (sng_…)." },
                rank: { type: "integer" },
                title: { type: "string" },
                artist: { type: "string" },
                year: { type: "integer" },
                genre: { type: "string" },
                streamsBillions: { type: "number" },
                notes: { type: "string" },
            },
            required: ["id"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "remove_song",
        description: "Deletes a song from the chart by id. Other ranks stay as they are (gaps are fine).",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The song's id (sng_…)." },
            },
            required: ["id"],
            additionalProperties: false,
        },
    },
]

/**
 * Runs a tool and returns its JSON-encoded output. Failures are returned as
 * JSON error payloads (never thrown) so the model can recover gracefully and
 * the stream stays alive. Async because domain tools call services (and
 * through them, the database).
 */
export async function executeAiChatTool(name: string, argumentsJson: string): Promise<string> {
    try {
        switch (name) {
            case "get_current_time":
                return getCurrentTime(argumentsJson)
            case "search_blog_posts":
                return await searchBlogPosts(argumentsJson)
            case "quickbooks_company_snapshot":
                return JSON.stringify(await quickBooksService.getCompanySnapshot())
            case "quickbooks_list_invoices":
                return await listQuickBooksInvoices(argumentsJson)
            case "quickbooks_list_customers":
                return JSON.stringify({ customers: await quickBooksService.listCustomers() })
            case "quickbooks_profit_and_loss":
                return JSON.stringify({ periods: await quickBooksService.getProfitAndLoss() })
            case "quickbooks_balance_sheet":
                return JSON.stringify({ periods: await quickBooksService.getBalanceSheet() })
            case "list_songs":
                return await listSongsTool(argumentsJson)
            case "search_songs":
                return await searchSongsTool(argumentsJson)
            case "get_song":
                return await getSongTool(argumentsJson)
            case "add_song":
                return await addSongTool(argumentsJson)
            case "update_song":
                return await updateSongTool(argumentsJson)
            case "remove_song":
                return await removeSongTool(argumentsJson)
            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` })
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed."
        return JSON.stringify({ error: message })
    }
}

async function searchBlogPosts(argumentsJson: string): Promise<string> {
    let query = ""
    try {
        const parsed = JSON.parse(argumentsJson) as { query?: unknown }
        if (typeof parsed.query === "string") {
            query = parsed.query.trim()
        }
    } catch {
        // Malformed arguments fall through to the empty-query error below.
    }
    if (query === "") {
        return JSON.stringify({ error: "search_blog_posts needs a non-empty query." })
    }
    const results = await blogKnowledgeService.searchPosts(query)
    // Titles and slugs ride along so the model can cite ("from 'Write the
    // small parser'") and the UI could deep-link (?post=<slug>).
    return JSON.stringify({
        results: results.map((result) => ({
            title: result.title,
            slug: result.documentKey,
            passage: result.content,
            score: Number(result.score.toFixed(4)),
        })),
    })
}

const quickBooksInvoiceStatuses: readonly SimulatedInvoiceStatus[] = ["PAID", "OPEN", "OVERDUE"]

async function listQuickBooksInvoices(argumentsJson: string): Promise<string> {
    let status: SimulatedInvoiceStatus | undefined
    try {
        const parsed = JSON.parse(argumentsJson) as { status?: unknown }
        if (
            typeof parsed.status === "string" &&
            quickBooksInvoiceStatuses.includes(parsed.status as SimulatedInvoiceStatus)
        ) {
            status = parsed.status as SimulatedInvoiceStatus
        }
    } catch {
        // Malformed arguments fall back to listing every invoice.
    }
    const invoices = await quickBooksService.listInvoices({
        filters: status === undefined ? undefined : { statuses: [status] },
    })
    return JSON.stringify({ invoices })
}

function getCurrentTime(argumentsJson: string): string {
    let timezone = "UTC"
    try {
        const parsed = JSON.parse(argumentsJson) as { timezone?: unknown }
        if (typeof parsed.timezone === "string" && parsed.timezone !== "") {
            timezone = parsed.timezone
        }
    } catch {
        // Malformed arguments fall back to UTC.
    }
    const now = new Date()
    let formatted: string
    try {
        formatted = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            dateStyle: "full",
            timeStyle: "long",
        }).format(now)
    } catch {
        return JSON.stringify({ error: `Unknown timezone: ${timezone}` })
    }
    return JSON.stringify({ iso: now.toISOString(), timezone, formatted })
}

function songPayload(song: {
    id: string
    chartRank: number
    title: string
    artist: string
    year: number
    genre: string
    streamsBillions: number | null
    notes: string | null
}): Record<string, unknown> {
    return {
        id: song.id,
        rank: song.chartRank,
        title: song.title,
        artist: song.artist,
        year: song.year,
        genre: song.genre,
        streamsBillions: song.streamsBillions,
        notes: song.notes,
    }
}

async function listSongsTool(argumentsJson: string): Promise<string> {
    let limit = 24
    try {
        const parsed = JSON.parse(argumentsJson) as { limit?: unknown }
        if (typeof parsed.limit === "number" && Number.isFinite(parsed.limit)) {
            limit = parsed.limit
        }
    } catch {
        // Default limit.
    }
    const songs = await songsService.listSongsForAgent(limit)
    return JSON.stringify({ songs: songs.map(songPayload) })
}

async function searchSongsTool(argumentsJson: string): Promise<string> {
    let query = ""
    try {
        const parsed = JSON.parse(argumentsJson) as { query?: unknown }
        if (typeof parsed.query === "string") {
            query = parsed.query.trim()
        }
    } catch {
        // Fall through.
    }
    if (query === "") {
        return JSON.stringify({ error: "search_songs needs a non-empty query." })
    }
    const result = await songsService.listSongs({
        connection: {
            pagination: { first: 20 },
            sort: [{ fieldName: "chartRank", direction: "asc" }],
        },
        filters: { search: query },
    })
    return JSON.stringify({ songs: result.nodes.map(songPayload) })
}

async function getSongTool(argumentsJson: string): Promise<string> {
    let id: string | undefined
    let rank: number | undefined
    let title: string | undefined
    try {
        const parsed = JSON.parse(argumentsJson) as { id?: unknown; rank?: unknown; title?: unknown }
        if (typeof parsed.id === "string" && parsed.id !== "") id = parsed.id
        if (typeof parsed.rank === "number") rank = parsed.rank
        if (typeof parsed.title === "string" && parsed.title.trim() !== "") {
            title = parsed.title.trim()
        }
    } catch {
        // Fall through.
    }
    if (id !== undefined) {
        return JSON.stringify({ song: songPayload(await songsService.getSongByIdOrThrow(id)) })
    }
    if (rank !== undefined) {
        const song = await songsService.getSongByRank(rank)
        if (song === undefined) {
            return JSON.stringify({ error: `No song at rank ${rank}.` })
        }
        return JSON.stringify({ song: songPayload(song) })
    }
    if (title !== undefined) {
        const result = await songsService.listSongs({
            connection: {
                pagination: { first: 5 },
                sort: [{ fieldName: "chartRank", direction: "asc" }],
            },
            filters: { search: title },
        })
        const exact = result.nodes.find((song) => song.title.toLowerCase() === title.toLowerCase())
        if (exact === undefined) {
            return JSON.stringify({
                error: `No song titled "${title}".`,
                matches: result.nodes.map(songPayload),
            })
        }
        return JSON.stringify({ song: songPayload(exact) })
    }
    return JSON.stringify({ error: "get_song needs an id, rank, or title." })
}

async function addSongTool(argumentsJson: string): Promise<string> {
    let fields: {
        chartRank?: unknown
        title?: unknown
        artist?: unknown
        year?: unknown
        genre?: unknown
        streamsBillions?: unknown
        notes?: unknown
        rank?: unknown
    } = {}
    try {
        fields = JSON.parse(argumentsJson) as typeof fields
    } catch {
        return JSON.stringify({ error: "add_song needs JSON arguments." })
    }
    const rank = typeof fields.rank === "number" ? fields.rank : fields.chartRank
    if (typeof rank !== "number" || typeof fields.title !== "string" || typeof fields.artist !== "string") {
        return JSON.stringify({ error: "add_song needs rank, title, artist, year, and genre." })
    }
    if (typeof fields.year !== "number" || typeof fields.genre !== "string") {
        return JSON.stringify({ error: "add_song needs rank, title, artist, year, and genre." })
    }
    const song = await songsService.createSong({
        idempotencyKey: `tool-add-song-${Date.now()}`,
        fields: {
            chartRank: rank,
            title: fields.title,
            artist: fields.artist,
            year: fields.year,
            genre: fields.genre,
            streamsBillions: typeof fields.streamsBillions === "number" ? fields.streamsBillions : null,
            notes: typeof fields.notes === "string" ? fields.notes : null,
        },
    })
    return JSON.stringify({ song: songPayload(song) })
}

async function updateSongTool(argumentsJson: string): Promise<string> {
    let fields: {
        id?: unknown
        rank?: unknown
        title?: unknown
        artist?: unknown
        year?: unknown
        genre?: unknown
        streamsBillions?: unknown
        notes?: unknown
    } = {}
    try {
        fields = JSON.parse(argumentsJson) as typeof fields
    } catch {
        return JSON.stringify({ error: "update_song needs JSON arguments." })
    }
    if (typeof fields.id !== "string" || fields.id === "") {
        return JSON.stringify({ error: "update_song needs an id." })
    }
    const song = await songsService.updateSong({
        objectId: fields.id,
        idempotencyKey: `tool-update-song-${fields.id}-${Date.now()}`,
        fields: {
            chartRank: typeof fields.rank === "number" ? fields.rank : undefined,
            title: typeof fields.title === "string" ? fields.title : undefined,
            artist: typeof fields.artist === "string" ? fields.artist : undefined,
            year: typeof fields.year === "number" ? fields.year : undefined,
            genre: typeof fields.genre === "string" ? fields.genre : undefined,
            streamsBillions: typeof fields.streamsBillions === "number" ? fields.streamsBillions : undefined,
            notes: typeof fields.notes === "string" ? fields.notes : undefined,
        },
    })
    return JSON.stringify({ song: songPayload(song) })
}

async function removeSongTool(argumentsJson: string): Promise<string> {
    let id = ""
    try {
        const parsed = JSON.parse(argumentsJson) as { id?: unknown }
        if (typeof parsed.id === "string") id = parsed.id
    } catch {
        // Fall through.
    }
    if (id === "") {
        return JSON.stringify({ error: "remove_song needs an id." })
    }
    await songsService.deleteSong({ objectId: id })
    return JSON.stringify({ deleted: true, id })
}
