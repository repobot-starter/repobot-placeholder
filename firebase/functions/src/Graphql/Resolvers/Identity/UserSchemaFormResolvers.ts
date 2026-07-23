import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { userService } from "../../../Services/Identity/UserService.js"
import { buildSchemaForm } from "../../../Utils/SchemaForms.js"

export const userSchemaFormResolvers: GqlResolvers = {
    Query: {
        userCreateFormSchema: () => {
            return buildSchemaForm({
                baseSchemaKey: "CreateUserFields",
                title: "Create User",
                displayOrder: ["accountId", "email", "displayName"],
            })
        },

        userUpdateFormSchema: async (_parent, { input }) => {
            const user = await userService.getUserByIdOrThrow(input.objectId)
            return buildSchemaForm({
                baseSchemaKey: "UpdateUserFields",
                title: "Update User",
                defaultData: {
                    displayName: user.displayName,
                    status: user.status,
                },
            })
        },
    },
}
