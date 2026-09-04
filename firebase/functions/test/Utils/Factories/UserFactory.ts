import {
    GqlCreateUserFields,
    GqlCreateUserInput,
    GqlUpdateUserFields,
    GqlUpdateUserInput,
} from "../../../generated/GraphqlResolverTypes.js"
import { newIdempotencyKey, randomEmail, randomName } from "./RandomValues.js"

export function buildCreateUserFields(
    fields: Partial<GqlCreateUserFields> & Pick<GqlCreateUserFields, "accountId">,
): GqlCreateUserFields {
    return {
        email: randomEmail(),
        displayName: randomName("User"),
        ...fields,
    }
}

export function buildCreateUserInput(
    input: Partial<GqlCreateUserInput> & Pick<GqlCreateUserInput, "fields">,
): GqlCreateUserInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        ...input,
    }
}

export function buildUpdateUserFields(fields?: Partial<GqlUpdateUserFields>): GqlUpdateUserFields {
    return {
        displayName: randomName("User"),
        ...fields,
    }
}

export function buildUpdateUserInput(
    input: Partial<GqlUpdateUserInput> & Pick<GqlUpdateUserInput, "objectId">,
): GqlUpdateUserInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        fields: buildUpdateUserFields(),
        ...input,
    }
}
