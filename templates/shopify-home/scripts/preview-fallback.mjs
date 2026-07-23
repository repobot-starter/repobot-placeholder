// Static preview served when no Shopify store is connected: the workspace
// preview panel still renders, and explains how to get the live storefront.
import { createServer } from "node:http"

const port = Number(process.env.PORT ?? 9292)

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shopify theme preview</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; background: #f9fafb; color: #111827; }
      main { max-width: 32rem; padding: 2rem; text-align: center; }
      code { background: #eef2ff; padding: 0.15em 0.4em; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connect a Shopify store to preview</h1>
      <p>
        This project is a Shopify theme. Connect your store on the
        <strong>Integrations</strong> page (store domain + Theme Access token)
        and relaunch the workspace to get a live storefront preview via
        <code>shopify theme dev</code>.
      </p>
      <p>Until then, edit sections, templates, and styles — Theme Check (<code>npm run check</code>) keeps you honest.</p>
    </main>
  </body>
</html>`

createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    response.end(page)
}).listen(port, "127.0.0.1", () => {
    console.log(`preview fallback listening on http://127.0.0.1:${port}`)
})
