import { onRequest } from "firebase-functions/v2/https"
import { buildGraphqlExpressApp } from "../Graphql/GraphqlServer.js"

/**
 * The GraphQL API. The function name is part of the URL contract:
 * http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api
 */
export const graphql__request__api = onRequest({ cors: true }, buildGraphqlExpressApp())
