import { expect } from "chai"
import {
    GqlConnectionInput,
    GqlCreateEntryFieldFields,
    GqlCreateEntryFieldInput,
} from "../../generated/GraphqlResolverTypes.js"
import { newIdempotencyKey, randomSuffix } from "../Utils/Factories/RandomValues.js"
import { executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"

// The contact-log seed from migrations/20260827T120000__create_entry.sql.
const seededFieldKeys = ["name", "company", "contacted", "follow_up", "notes"]

const newestFirst: GqlConnectionInput = {
    pagination: { first: 50 },
    sort: [{ fieldName: "rowCreatedAt", direction: "desc" }],
}

function buildCreateEntryFieldInput(fields: GqlCreateEntryFieldFields): GqlCreateEntryFieldInput {
    return { idempotencyKey: newIdempotencyKey(), fields }
}

describe("Entry", function () {
    it("lists the seeded contact-log fields in column order", async function () {
        const fields = await this.entryHelper.getEntryFields()

        expect(fields.map((field) => field.fieldKey)).to.deep.equal(seededFieldKeys)
        expect(fields.map((field) => field.position)).to.deep.equal([1, 2, 3, 4, 5])

        const nameField = fields[0]
        expect(nameField.label).to.equal("Name")
        expect(nameField.fieldType).to.equal("TEXT")
        expect(nameField.required).to.equal(true)

        const followUpField = fields[3]
        expect(followUpField.label).to.equal("Follow up")
        expect(followUpField.fieldType).to.equal("YESNO")
        expect(followUpField.required).to.equal(false)
    })

    it("derives the fieldKey from the label and appends to the column order", async function () {
        const created = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({ label: "  Priority   Level!  ", fieldType: "NUMBER" }),
        )
        expect(created.fieldKey).to.equal("priority_level")
        expect(created.label).to.equal("Priority   Level!")
        expect(created.required).to.equal(false)
        expect(created.position).to.equal(6)

        // A label colliding with the seeded "name" key dedupes with a suffix.
        const duplicate = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({ label: "Name", fieldType: "TEXT" }),
        )
        expect(duplicate.fieldKey).to.equal("name_2")
        expect(duplicate.position).to.equal(7)
    })

    it("keeps options only for SELECT fields and fieldKey is immutable on update", async function () {
        const selectField = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({
                label: "Stage",
                fieldType: "SELECT",
                options: ["Lead", "Active", "Closed"],
            }),
        )
        expect(selectField.options).to.deep.equal(["Lead", "Active", "Closed"])

        const textField = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({
                label: "Region",
                fieldType: "TEXT",
                options: ["ignored"],
            }),
        )
        expect(textField.options).to.equal(null)

        const updated = await this.entryHelper.updateEntryField({
            objectId: selectField.id,
            idempotencyKey: newIdempotencyKey(),
            fields: { label: "Deal Stage", required: true },
        })
        expect(updated.label).to.equal("Deal Stage")
        expect(updated.required).to.equal(true)
        expect(updated.fieldKey).to.equal("stage")
        expect(updated.options).to.deep.equal(["Lead", "Active", "Closed"])
    })

    it("creates a record via valuesJson and reads the cells back", async function () {
        const values = {
            name: `Recordo Test ${randomSuffix()}`,
            company: "Test Co",
            contacted: "2026-08-27",
            follow_up: true,
            notes: "Created from the test suite.",
        }
        const record = await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify(values) },
        })
        expect(JSON.parse(record.valuesJson)).to.deep.equal(values)
        expect(record.createdTime).to.be.a("string")
    })

    it("rejects valuesJson that is not a JSON object", async function () {
        const mutation = `mutation CreateEntryRecord($input: CreateEntryRecordInput!) {
            createEntryRecord(input: $input) { id }
        }`

        const malformed = await executeGql(this.apolloServer, mutation, {
            input: { idempotencyKey: newIdempotencyKey(), fields: { valuesJson: "{not json" } },
        })
        expect(firstGqlError(malformed).code).to.equal("INVALID_ARGUMENT")

        const nonObject = await executeGql(this.apolloServer, mutation, {
            input: { idempotencyKey: newIdempotencyKey(), fields: { valuesJson: "[1, 2, 3]" } },
        })
        expect(firstGqlError(nonObject).code).to.equal("INVALID_ARGUMENT")
    })

    it("filters the records connection with a case-insensitive search", async function () {
        const token = `needle-${randomSuffix()}`
        const match = await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify({ name: `Contact ${token}` }) },
        })
        await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify({ name: "Someone else entirely" }) },
        })

        const found = await this.entryHelper.getEntryRecords({
            filters: { search: token.toUpperCase() },
            connection: newestFirst,
        })
        expect(found.nodes.map((node) => node?.id)).to.deep.equal([match.id])

        const unfiltered = await this.entryHelper.getEntryRecords({ connection: newestFirst })
        // The 6 seeded contacts plus the two created above.
        expect(unfiltered.nodes.length).to.equal(8)
    })

    it("builds the dynamic record form schema from the live field definitions", async function () {
        const created = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({
                label: "T-Shirt Size",
                fieldType: "SELECT",
                required: true,
                options: ["S", "M", "L"],
            }),
        )
        expect(created.fieldKey).to.equal("t_shirt_size")

        const form = await this.entryHelper.getEntryRecordCreateFormSchema()
        const jsonSchema = JSON.parse(form.jsonSchema)
        const uiSchema = JSON.parse(form.uiSchema)

        // Properties keyed by fieldKey, typed from the field's EntryFieldType.
        expect(jsonSchema.properties.t_shirt_size).to.deep.equal({
            type: "string",
            enum: ["S", "M", "L"],
            title: "T-Shirt Size",
        })
        expect(jsonSchema.properties.name).to.deep.equal({ type: "string", title: "Name" })
        expect(jsonSchema.properties.contacted).to.deep.equal({
            type: "string",
            format: "date",
            title: "Contacted",
        })
        expect(jsonSchema.properties.follow_up).to.deep.equal({ type: "boolean", title: "Follow up" })

        // required mirrors the field flags; ui:order follows the positions.
        expect(jsonSchema.required).to.deep.equal(["name", "t_shirt_size"])
        expect(uiSchema["ui:order"]).to.deep.equal([...seededFieldKeys, "t_shirt_size"])
        expect(JSON.parse(form.defaultData)).to.deep.equal({})
    })

    it("pre-populates the update record form with the stored values", async function () {
        const values = { name: "Prefilled Person", follow_up: true }
        const record = await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify(values) },
        })

        const form = await this.entryHelper.getEntryRecordUpdateFormSchema(record.id)
        expect(JSON.parse(form.defaultData)).to.deep.equal(values)

        const updated = await this.entryHelper.updateEntryRecord({
            objectId: record.id,
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify({ ...values, notes: "Called back." }) },
        })
        const updatedForm = await this.entryHelper.getEntryRecordUpdateFormSchema(record.id)
        expect(JSON.parse(updatedForm.defaultData)).to.deep.equal(JSON.parse(updated.valuesJson))
    })

    it("deletes a record", async function () {
        const token = `deletable-${randomSuffix()}`
        const record = await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify({ name: token }) },
        })

        const deleted = await this.entryHelper.deleteEntryRecord({ objectId: record.id })
        expect(deleted).to.equal(true)

        const found = await this.entryHelper.getEntryRecords({
            filters: { search: token },
            connection: newestFirst,
        })
        expect(found.nodes).to.deep.equal([])
    })

    it("hard-deletes a field while records keep their orphaned cells", async function () {
        const field = await this.entryHelper.createEntryField(
            buildCreateEntryFieldInput({ label: "Temporary", fieldType: "TEXT" }),
        )
        const record = await this.entryHelper.createEntryRecord({
            idempotencyKey: newIdempotencyKey(),
            fields: { valuesJson: JSON.stringify({ name: "Keeper", temporary: "orphan me" }) },
        })

        const deleted = await this.entryHelper.deleteEntryField({ objectId: field.id })
        expect(deleted).to.equal(true)

        const fields = await this.entryHelper.getEntryFields()
        expect(fields.map((entry) => entry.fieldKey)).to.deep.equal(seededFieldKeys)

        // The orphaned cell survives in storage but gets no form widget.
        const form = await this.entryHelper.getEntryRecordUpdateFormSchema(record.id)
        expect(JSON.parse(form.defaultData)).to.deep.equal({ name: "Keeper" })

        const records = await this.entryHelper.getEntryRecords({
            filters: { search: "orphan me" },
            connection: newestFirst,
        })
        expect(records.nodes.map((node) => node?.id)).to.deep.equal([record.id])
    })
})
