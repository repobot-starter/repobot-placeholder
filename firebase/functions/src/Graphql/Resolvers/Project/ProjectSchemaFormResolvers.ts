import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { projectService } from "../../../Services/Project/ProjectService.js"
import { buildSchemaForm } from "../../../Utils/SchemaForms.js"

const descriptionOverride = {
    uiSchema: { "ui:widget": "textarea" },
}

export const projectSchemaFormResolvers: GqlResolvers = {
    Query: {
        projectCreateFormSchema: () => {
            return buildSchemaForm({
                baseSchemaKey: "CreateProjectFields",
                title: "Create Project",
                displayOrder: ["name", "description"],
                overrides: {
                    description: descriptionOverride,
                },
            })
        },

        projectUpdateFormSchema: async (_parent, { input }) => {
            const project = await projectService.getProjectByIdOrThrow(input.objectId)
            return buildSchemaForm({
                baseSchemaKey: "UpdateProjectFields",
                title: "Update Project",
                displayOrder: ["name", "description", "doArchive"],
                overrides: {
                    description: descriptionOverride,
                    // Archiving is an explicit action, not a form field.
                    doArchive: { omit: true },
                },
                defaultData: {
                    name: project.name,
                    description: project.description ?? undefined,
                },
            })
        },
    },
}
