import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { FlowLine } from "../../../Data/Flow/FlowLine.js"
import { ComputedGridLine, flowService, monthsFor } from "../../../Services/Flow/FlowService.js"
import { RpcError } from "../../../Utils/RpcError.js"
import { GraphqlRequestContext } from "../../GraphqlServer.js"
import { PartiallyResolvedFlowLine } from "../PartiallyResolved.js"

/** The authenticated application user behind the request, or UNAUTHENTICATED. */
function requireUserId(context: GraphqlRequestContext, action: string): string {
    const userId = context.principal?.userId
    if (userId === undefined) {
        throw new RpcError("UNAUTHENTICATED", `${action} requires an authenticated user.`)
    }
    return userId
}

function toPartiallyResolvedLine(entry: ComputedGridLine): PartiallyResolvedFlowLine {
    return {
        ...entry.line,
        budgetsMinorUnits: entry.budgetsMinorUnits,
        actualsMinorUnits: entry.actualsMinorUnits,
        variancesMinorUnits: entry.variancesMinorUnits,
    }
}

/** One grid row with its computed per-month numbers, for mutations that return a line. */
async function computedLine(userId: string, line: FlowLine): Promise<PartiallyResolvedFlowLine> {
    const template = await flowService.getTemplate({ userId, templateId: line.templateId })
    const grid = await flowService.computeGrid(template)
    const match = grid.lines.find((entry) => entry.line.id === line.id)
    if (match === undefined) {
        throw new RpcError("NOT_FOUND", "There is no such line.")
    }
    return toPartiallyResolvedLine(match)
}

export const flowResolvers: GqlResolvers = {
    Query: {
        flowTemplates: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing budget templates")
            return await flowService.listTemplates(userId)
        },

        flowTemplate: async (_parent, { templateId }, context) => {
            const userId = requireUserId(context, "Reading a budget template")
            return await flowService.getTemplate({ userId, templateId })
        },

        flowLinkableCategories: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing linkable categories")
            return await flowService.linkableCategories(userId)
        },
    },

    Mutation: {
        flowCreateTemplate: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Creating a budget template")
            return await flowService.createTemplate({
                idempotencyKey: input.idempotencyKey,
                userId,
                name: input.name,
                startMonth: input.startMonth,
                monthCount: input.monthCount,
                seedFromActuals: input.seedFromActuals,
            })
        },

        flowRenameTemplate: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Renaming a budget template")
            return await flowService.renameTemplate({
                userId,
                templateId: input.templateId,
                name: input.name,
            })
        },

        flowDeleteTemplate: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Deleting a budget template")
            await flowService.deleteTemplate({ userId, templateId: input.templateId })
            return true
        },

        flowAddLine: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Adding a grid line")
            const line = await flowService.addLine({
                idempotencyKey: input.idempotencyKey,
                userId,
                templateId: input.templateId,
                label: input.label,
                section: input.section,
                linkedCategory: input.linkedCategory,
            })
            return await computedLine(userId, line)
        },

        flowUpdateLine: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Updating a grid line")
            const line = await flowService.updateLine({
                userId,
                lineId: input.lineId,
                label: input.label,
                linkedCategory: input.linkedCategory,
                budgetsMinorUnits: input.budgetsMinorUnits,
            })
            return await computedLine(userId, line)
        },

        flowRemoveLine: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Removing a grid line")
            await flowService.removeLine({ userId, lineId: input.lineId })
            return true
        },

        flowExportTemplateXlsx: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Exporting a budget template")
            return await flowService.exportTemplateXlsx({
                idempotencyKey: input.idempotencyKey,
                userId,
                templateId: input.templateId,
            })
        },

        flowImportTemplateXlsx: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Importing a budget template")
            return await flowService.importTemplateXlsx({
                idempotencyKey: input.idempotencyKey,
                userId,
                uploadId: input.uploadId,
                name: input.name,
            })
        },
    },

    FlowTemplate: {
        months: (template) => monthsFor(template.startMonth, template.monthCount),
        createdTime: (template) => template.rowCreatedAt,
        // The computed grid resolves lazily — the template list view selects
        // neither lines nor actuals and costs one query total.
        lines: async (template) => {
            const grid = await flowService.computeGrid(template)
            return grid.lines.map(toPartiallyResolvedLine)
        },
    },
}
