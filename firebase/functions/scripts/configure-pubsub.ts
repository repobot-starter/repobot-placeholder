// Post-deploy PubSub configuration (dead-letter policies etc.).
// Usage: GOOGLE_CLOUD_PROJECT=<project> npx tsx scripts/configure-pubsub.ts
import { configurePubSub } from "../src/ConfigurePubSub.js"

configurePubSub().catch((error) => {
    console.error(error)
    process.exit(1)
})
