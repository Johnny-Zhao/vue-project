import { createServer } from './app.js'
import { env } from './config/env.js'

const app = createServer()

app.listen(env.port, () => {
  console.log(`[server] Express server is running at http://127.0.0.1:${env.port}`)
})
