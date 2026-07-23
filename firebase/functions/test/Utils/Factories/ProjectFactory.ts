import {
    GqlAddProjectMemberFields,
    GqlAddProjectMemberInput,
    GqlCreateProjectFields,
    GqlCreateProjectInput,
    GqlUpdateProjectInput,
} from "../../../generated/GraphqlResolverTypes.js"
import { newIdempotencyKey, randomName } from "./RandomValues.js"

export function buildCreateProjectFields(fields?: Partial<GqlCreateProjectFields>): GqlCreateProjectFields {
    return {
        name: randomName("Project"),
        description: `Description ${randomName("of project")}`,
        ...fields,
    }
}

export function buildCreateProjectInput(input?: Partial<GqlCreateProjectInput>): GqlCreateProjectInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        fields: buildCreateProjectFields(),
        ...input,
    }
}

export function buildUpdateProjectInput(
    input: Partial<GqlUpdateProjectInput> & Pick<GqlUpdateProjectInput, "objectId">,
): GqlUpdateProjectInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        fields: {},
        ...input,
    }
}

export function buildAddProjectMemberInput(
    fields: GqlAddProjectMemberFields,
    input?: Partial<GqlAddProjectMemberInput>,
): GqlAddProjectMemberInput {
    return {
        idempotencyKey: newIdempotencyKey(),
        fields,
        ...input,
    }
}
