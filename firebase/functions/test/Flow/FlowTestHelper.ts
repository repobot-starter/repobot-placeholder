import {
    GqlFlowAddLineInput,
    GqlFlowCreateTemplateInput,
    GqlFlowImportTemplateXlsxInput,
    GqlFlowLine,
    GqlFlowLinkableCategories,
    GqlFlowTemplate,
    GqlFlowUpdateLineInput,
    GqlUpload,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const flowLineGqlFields = `
    id
    position
    label
    section
    linkedCategory
    budgetsMinorUnits
    actualsMinorUnits
    variancesMinorUnits
`

export const flowTemplateGqlFields = `
    id
    name
    startMonth
    monthCount
    months
    currency
    createdTime
    lines { ${flowLineGqlFields} }
`

export class FlowTestHelper extends BaseTestHelper {
    async createTemplate(user: GqlUser, input: GqlFlowCreateTemplateInput): Promise<GqlFlowTemplate> {
        return await executeGqlAt(
            this.server,
            `mutation FlowCreateTemplate($input: FlowCreateTemplateInput!) {
                flowCreateTemplate(input: $input) { ${flowTemplateGqlFields} }
            }`,
            { input },
            "flowCreateTemplate",
            asUser(user),
        )
    }

    async listTemplates(user: GqlUser): Promise<GqlFlowTemplate[]> {
        return await executeGqlAt(
            this.server,
            `query FlowTemplates {
                flowTemplates { ${flowTemplateGqlFields} }
            }`,
            {},
            "flowTemplates",
            asUser(user),
        )
    }

    async getTemplate(user: GqlUser, templateId: string): Promise<GqlFlowTemplate> {
        return await executeGqlAt(
            this.server,
            `query FlowTemplate($templateId: Id!) {
                flowTemplate(templateId: $templateId) { ${flowTemplateGqlFields} }
            }`,
            { templateId },
            "flowTemplate",
            asUser(user),
        )
    }

    async getLinkableCategories(user: GqlUser): Promise<GqlFlowLinkableCategories> {
        return await executeGqlAt(
            this.server,
            `query FlowLinkableCategories {
                flowLinkableCategories { incomeCategories expenseCategories }
            }`,
            {},
            "flowLinkableCategories",
            asUser(user),
        )
    }

    async renameTemplate(user: GqlUser, templateId: string, name: string): Promise<GqlFlowTemplate> {
        return await executeGqlAt(
            this.server,
            `mutation FlowRenameTemplate($input: FlowRenameTemplateInput!) {
                flowRenameTemplate(input: $input) { ${flowTemplateGqlFields} }
            }`,
            { input: { templateId, name } },
            "flowRenameTemplate",
            asUser(user),
        )
    }

    async deleteTemplate(user: GqlUser, templateId: string): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation FlowDeleteTemplate($input: FlowDeleteTemplateInput!) {
                flowDeleteTemplate(input: $input)
            }`,
            { input: { templateId } },
            "flowDeleteTemplate",
            asUser(user),
        )
    }

    async addLine(user: GqlUser, input: GqlFlowAddLineInput): Promise<GqlFlowLine> {
        return await executeGqlAt(
            this.server,
            `mutation FlowAddLine($input: FlowAddLineInput!) {
                flowAddLine(input: $input) { ${flowLineGqlFields} }
            }`,
            { input },
            "flowAddLine",
            asUser(user),
        )
    }

    async updateLine(user: GqlUser, input: GqlFlowUpdateLineInput): Promise<GqlFlowLine> {
        return await executeGqlAt(
            this.server,
            `mutation FlowUpdateLine($input: FlowUpdateLineInput!) {
                flowUpdateLine(input: $input) { ${flowLineGqlFields} }
            }`,
            { input },
            "flowUpdateLine",
            asUser(user),
        )
    }

    async removeLine(user: GqlUser, lineId: string): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation FlowRemoveLine($input: FlowRemoveLineInput!) {
                flowRemoveLine(input: $input)
            }`,
            { input: { lineId } },
            "flowRemoveLine",
            asUser(user),
        )
    }

    async exportTemplateXlsx(user: GqlUser, templateId: string, idempotencyKey: string): Promise<GqlUpload> {
        return await executeGqlAt(
            this.server,
            `mutation FlowExportTemplateXlsx($input: FlowExportTemplateXlsxInput!) {
                flowExportTemplateXlsx(input: $input) {
                    id
                    contentType
                    fileName
                    visibility
                    status
                    sizeBytes
                }
            }`,
            { input: { idempotencyKey, templateId } },
            "flowExportTemplateXlsx",
            asUser(user),
        )
    }

    async importTemplateXlsx(user: GqlUser, input: GqlFlowImportTemplateXlsxInput): Promise<GqlFlowTemplate> {
        return await executeGqlAt(
            this.server,
            `mutation FlowImportTemplateXlsx($input: FlowImportTemplateXlsxInput!) {
                flowImportTemplateXlsx(input: $input) { ${flowTemplateGqlFields} }
            }`,
            { input },
            "flowImportTemplateXlsx",
            asUser(user),
        )
    }
}
