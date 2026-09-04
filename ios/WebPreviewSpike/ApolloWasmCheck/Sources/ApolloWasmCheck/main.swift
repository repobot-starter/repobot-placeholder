// Touch real generated symbols so the linker can't dead-strip the check.
import ApolloAPI
import AppGraphqlApi

let query = GetCurrentUserQuery()
print("ApolloWasmCheck: \(type(of: query)) operation '\(GetCurrentUserQuery.operationName)' compiled for wasm")
