import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _RegisterPushDevice = gql`
    mutation RegisterPushDevice($input: RegisterPushDeviceInput!) {
        registerPushDevice(input: $input) {
            id
            platform
            endpoint
            createdTime
            rotatedTime
        }
    }
`

export const _UnregisterPushDevice = gql`
    mutation UnregisterPushDevice($input: UnregisterPushDeviceInput!) {
        unregisterPushDevice(input: $input)
    }
`
