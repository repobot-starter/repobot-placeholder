// Every deployed Cloud Function is exported from here (firebase.json points
// the functions source at this package; main = lib/src/index.js).
//
// Name budget: deployed environments prefix every export with
// "{functionPrefix}__" (up to 32 chars for a max-length deploy slug), and GCP
// caps function names at 62 chars — so export names must stay <= 30 chars.
// test/Deploy/FunctionNameBudgetTest.ts enforces this.
export { ai__request__chat } from "./CloudFunctions/Ai.js"
export { auth__request__api } from "./CloudFunctions/Auth.js"
export { graphql__request__api } from "./CloudFunctions/Graphql.js"
export { project__message__created } from "./CloudFunctions/Project.js"
export { messages__message__dead_letter } from "./CloudFunctions/Messages.js"
