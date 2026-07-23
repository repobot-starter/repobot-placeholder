import { GqlCreateAccountFields, GqlCreateAccountInput } from "../../../generated/GraphqlResolverTypes.js"
import { newIdempotencyKey, randomName } from "./RandomValues.js"

export function buildCreateAccountFields(fields?: Partial<GqlCreateAccountFields>): GqlCreateAccountFields {
    return {
        name: randomName("Account"),
        ...fields,
    }
}

export function buildCreateAccountInput(input?: Partial<GqlCreateAccountInput>): GqlCreateAccountInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        fields: buildCreateAccountFields(),
        ...input,
    }
}
