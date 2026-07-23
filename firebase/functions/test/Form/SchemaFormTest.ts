import { expect } from "chai"
import { GqlSchemaForm } from "../../generated/GraphqlResolverTypes.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { addDefaults } from "../Utils/TestContext.js"

const schemaFormGqlFields = `
    jsonSchema
    uiSchema
    defaultData
`

describe("SchemaForms", function () {
    it("projectCreateFormSchema returns a parseable JSON Schema form", async function () {
        const form = await executeGqlAt<GqlSchemaForm>(
            this.apolloServer,
            `query { projectCreateFormSchema { ${schemaFormGqlFields} } }`,
            {},
            "projectCreateFormSchema",
        )

        const jsonSchema = JSON.parse(form.jsonSchema)
        expect(jsonSchema.type).to.equal("object")
        expect(Object.keys(jsonSchema.properties)).to.deep.equal(["name", "description"])
        expect(jsonSchema.properties.name).to.deep.include({ type: "string", title: "Name" })
        expect(jsonSchema.required).to.deep.equal(["name"])

        const uiSchema = JSON.parse(form.uiSchema)
        expect(uiSchema["ui:order"]).to.deep.equal(["name", "description"])
        expect(uiSchema.description).to.deep.equal({ "ui:widget": "textarea" })

        expect(JSON.parse(form.defaultData)).to.deep.equal({})
    })

    it("projectUpdateFormSchema carries defaultData from the existing row and hides doArchive", async function () {
        await addDefaults(this, ["account", "user", "project"])
        const project = this.defaults.project!

        const form = await executeGqlAt<GqlSchemaForm>(
            this.apolloServer,
            `query ProjectUpdateForm($input: SchemaFormUpdateInput!) {
                projectUpdateFormSchema(input: $input) { ${schemaFormGqlFields} }
            }`,
            { input: { objectId: project.id } },
            "projectUpdateFormSchema",
        )

        const jsonSchema = JSON.parse(form.jsonSchema)
        expect(Object.keys(jsonSchema.properties)).to.deep.equal(["name", "description"])
        expect(jsonSchema.properties).to.not.have.property("doArchive")

        const defaultData = JSON.parse(form.defaultData)
        expect(defaultData.name).to.equal(project.name)
        expect(defaultData.description).to.equal(project.description)
    })

    it("userCreateFormSchema exposes the CreateUserFields inputs", async function () {
        const form = await executeGqlAt<GqlSchemaForm>(
            this.apolloServer,
            `query { userCreateFormSchema { ${schemaFormGqlFields} } }`,
            {},
            "userCreateFormSchema",
        )

        const jsonSchema = JSON.parse(form.jsonSchema)
        expect(Object.keys(jsonSchema.properties)).to.deep.equal(["accountId", "email", "displayName"])
        expect(jsonSchema.required).to.have.members(["accountId", "email", "displayName"])
        // "accountId" is humanized with the Id suffix dropped.
        expect(jsonSchema.properties.accountId.title).to.equal("Account")

        const uiSchema = JSON.parse(form.uiSchema)
        expect(uiSchema["ui:order"]).to.deep.equal(["accountId", "email", "displayName"])
    })

    it("userUpdateFormSchema pre-populates the user's current values", async function () {
        await addDefaults(this, ["account", "user"])
        const user = this.defaults.user!

        const form = await executeGqlAt<GqlSchemaForm>(
            this.apolloServer,
            `query UserUpdateForm($input: SchemaFormUpdateInput!) {
                userUpdateFormSchema(input: $input) { ${schemaFormGqlFields} }
            }`,
            { input: { objectId: user.id } },
            "userUpdateFormSchema",
        )

        const jsonSchema = JSON.parse(form.jsonSchema)
        // The status enum comes straight from the GraphQL enum definition.
        expect(jsonSchema.properties.status.enum).to.deep.equal(["ACTIVE", "DISABLED"])

        const defaultData = JSON.parse(form.defaultData)
        expect(defaultData).to.deep.equal({ displayName: user.displayName, status: user.status })
    })
})
