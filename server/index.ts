import { createServer } from './app.ts'
import { env } from './config/env.ts'

const app = createServer()

app.listen(env.port, () => {
  console.log(`[server] Express server is running at http://127.0.0.1:${env.port}`)
})
