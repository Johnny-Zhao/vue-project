import process from 'node:process'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  chromium,
  devices,
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
  type Request,
} from '@playwright/test'
import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const DEFAULT_BASE_URL = process.env.LOCAL_BROWSER_BASE_URL ?? 'http://127.0.0.1:5173'
const DEFAULT_API_BASE_URL = process.env.LOCAL_BROWSER_API_BASE_URL ?? 'http://127.0.0.1:3001/api'
const LOCAL_SESSION_KEY = 'vue-project.auth.local-session'
const SESSION_SESSION_KEY = 'vue-project.auth.session-session'
const SESSION_TTL_MS = 30 * 60 * 1000

const MOBILE_PRESETS = {
  iphone12: devices['iPhone 12'],
  pixel5: devices['Pixel 5'],
} as const

type ViewportMode = 'desktop' | keyof typeof MOBILE_PRESETS
type Role = 'admin' | 'viewer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const screenshotDir = path.join(__dirname, '..', '.tmp', 'mcp-browser')

let browser: Browser | null = null
let context: BrowserContext | null = null
let page: Page | null = null
let currentViewport: ViewportMode = 'desktop'
let consoleErrors: string[] = []
let failedRequests: string[] = []

function isSafeUrl(target: string) {
  return (
    target.startsWith(DEFAULT_BASE_URL) ||
    target.startsWith('http://127.0.0.1:5173') ||
    target.startsWith('http://localhost:5173')
  )
}

function resolveAppUrl(targetPath = '/') {
  const resolved = new URL(targetPath, DEFAULT_BASE_URL).toString()
  if (!isSafeUrl(resolved)) {
    throw new Error(`Target URL is outside the allowed local app scope: ${resolved}`)
  }

  return resolved
}

function ensurePage() {
  if (!page) {
    throw new Error('Browser page is not initialized yet. Call open_page or login_as first.')
  }

  return page
}

function resetTelemetry() {
  consoleErrors = []
  failedRequests = []
}

function trackConsoleMessage(message: ConsoleMessage) {
  if (message.type() === 'error') {
    consoleErrors.push(message.text())
  }
}

function trackFailedRequest(request: Request) {
  failedRequests.push(
    `${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown failure'}`,
  )
}

async function createContext(mode: ViewportMode) {
  if (context) {
    await context.close()
  }

  const config =
    mode === 'desktop' ? { viewport: { width: 1440, height: 960 } } : { ...MOBILE_PRESETS[mode] }

  context = await (browser ??= await chromium.launch({ headless: true })).newContext(config)
  page = await context.newPage()
  page.on('console', trackConsoleMessage)
  page.on('requestfailed', trackFailedRequest)
  resetTelemetry()
  currentViewport = mode
  return page
}

async function ensureBrowserPage(mode: ViewportMode = currentViewport) {
  if (!browser) {
    browser = await chromium.launch({ headless: true })
  }

  if (!page || !context || currentViewport !== mode) {
    await createContext(mode)
  }

  return ensurePage()
}

function buildStoredSession(session: {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  user: { id: number; name: string; role: Role }
}) {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken ?? '',
    expiresAt: session.expiresAt ?? Date.now() + SESSION_TTL_MS,
    user: session.user,
  }
}

async function writeSessionToStorage(
  targetPage: Page,
  session: ReturnType<typeof buildStoredSession>,
  remember = true,
) {
  await targetPage.evaluate(
    ({ localKey, sessionKey, authSession, useLocal }) => {
      const browserWindow = globalThis as any
      browserWindow.localStorage.removeItem(localKey)
      browserWindow.sessionStorage.removeItem(sessionKey)
      const serialized = JSON.stringify(authSession)

      if (useLocal) {
        browserWindow.localStorage.setItem(localKey, serialized)
      } else {
        browserWindow.sessionStorage.setItem(sessionKey, serialized)
      }
    },
    {
      localKey: LOCAL_SESSION_KEY,
      sessionKey: SESSION_SESSION_KEY,
      authSession: session,
      useLocal: remember,
    },
  )
}

async function loginByApi(role: Role) {
  const targetPage = await ensureBrowserPage()
  const credentials =
    role === 'admin'
      ? { username: 'admin', password: '123456', remember: true }
      : { username: 'viewer', password: '123456', remember: true }

  const response = await fetch(`${DEFAULT_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error(`Login request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as {
    succeed: boolean
    message: string
    data: {
      accessToken: string
      refreshToken: string
      expiresAt: number
      user: { id: number; name: string; role: Role }
    } | null
  }

  if (!payload.succeed || !payload.data) {
    throw new Error(payload.message || 'Login failed')
  }

  const session = buildStoredSession(payload.data)
  await targetPage.goto(resolveAppUrl('/login'), { waitUntil: 'networkidle' })
  await writeSessionToStorage(targetPage, session, credentials.remember)
  await targetPage.goto(resolveAppUrl('/'), { waitUntil: 'networkidle' })

  return {
    role,
    url: targetPage.url(),
    user: session.user,
    mode: 'api',
  }
}

async function loginByUi(role: Role) {
  const targetPage = await ensureBrowserPage()
  const credentials =
    role === 'admin'
      ? { username: 'admin', password: '123456' }
      : { username: 'viewer', password: '123456' }

  await targetPage.goto(resolveAppUrl('/login'), { waitUntil: 'networkidle' })
  await targetPage.locator('input').nth(0).fill(credentials.username)
  await targetPage.locator('input[type="password"]').fill(credentials.password)
  await targetPage.getByRole('button').last().click()
  await targetPage.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 })

  return {
    role,
    url: targetPage.url(),
    mode: 'ui',
  }
}

async function takeScreenshot(fileName?: string) {
  const targetPage = ensurePage()
  await mkdir(screenshotDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const finalName = fileName ?? `browser-${stamp}.png`
  const fullPath = path.join(screenshotDir, finalName)
  await targetPage.screenshot({ path: fullPath, fullPage: true })
  return fullPath
}

const server = new McpServer({
  name: 'local-browser',
  version: '1.0.0',
})

server.registerTool(
  'open_page',
  {
    description: 'Open a local app page under the allowed localhost scope.',
    inputSchema: {
      path: z.string().optional().describe('Path like /login or /user-management. Defaults to /.'),
      viewport: z
        .enum(['desktop', 'iphone12', 'pixel5'])
        .optional()
        .describe('Viewport preset. Defaults to the current viewport.'),
    },
    annotations: {
      title: 'Open Page',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ path: targetPath, viewport }) => {
    const targetPage = await ensureBrowserPage(viewport ?? currentViewport)
    const url = resolveAppUrl(targetPath ?? '/')
    await targetPage.goto(url, { waitUntil: 'networkidle' })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { url: targetPage.url(), viewport: viewport ?? currentViewport },
            null,
            2,
          ),
        },
      ],
      structuredContent: { url: targetPage.url(), viewport: viewport ?? currentViewport },
    }
  },
)

server.registerTool(
  'set_viewport',
  {
    description: 'Recreate the browser context with a desktop or mobile viewport preset.',
    inputSchema: {
      viewport: z.enum(['desktop', 'iphone12', 'pixel5']).describe('Viewport preset to use.'),
    },
    annotations: {
      title: 'Set Viewport',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ viewport }) => {
    await ensureBrowserPage(viewport)

    return {
      content: [{ type: 'text', text: JSON.stringify({ viewport }, null, 2) }],
      structuredContent: { viewport },
    }
  },
)

server.registerTool(
  'login_as',
  {
    description:
      'Log in as admin or viewer. API mode is more stable; UI mode exercises the login form.',
    inputSchema: {
      role: z.enum(['admin', 'viewer']).describe('Which demo role to use.'),
      mode: z.enum(['api', 'ui']).optional().describe('Login mode. Defaults to api.'),
    },
    annotations: {
      title: 'Login As',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ role, mode }) => {
    const result = mode === 'ui' ? await loginByUi(role) : await loginByApi(role)

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    }
  },
)

server.registerTool(
  'click',
  {
    description: 'Click the first element matching a CSS selector.',
    inputSchema: {
      selector: z.string().describe('CSS selector to click.'),
    },
    annotations: {
      title: 'Click',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ selector }) => {
    const targetPage = ensurePage()
    await targetPage.locator(selector).first().click()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ clicked: selector, url: targetPage.url() }, null, 2),
        },
      ],
      structuredContent: { clicked: selector, url: targetPage.url() },
    }
  },
)

server.registerTool(
  'type_text',
  {
    description: 'Fill text into the first element matching a CSS selector.',
    inputSchema: {
      selector: z.string().describe('CSS selector to fill.'),
      value: z.string().describe('Value to fill into the field.'),
    },
    annotations: {
      title: 'Type Text',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ selector, value }) => {
    const targetPage = ensurePage()
    await targetPage.locator(selector).first().fill(value)

    return {
      content: [{ type: 'text', text: JSON.stringify({ selector, value }, null, 2) }],
      structuredContent: { selector, value },
    }
  },
)

server.registerTool(
  'wait_for',
  {
    description: 'Wait for a selector to become visible.',
    inputSchema: {
      selector: z.string().describe('CSS selector to wait for.'),
      timeoutMs: z
        .number()
        .int()
        .min(100)
        .max(20000)
        .optional()
        .describe('Timeout in milliseconds. Defaults to 5000.'),
    },
    annotations: {
      title: 'Wait For',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ selector, timeoutMs }) => {
    const targetPage = ensurePage()
    await targetPage
      .locator(selector)
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs ?? 5000 })

    return {
      content: [{ type: 'text', text: JSON.stringify({ selector, visible: true }, null, 2) }],
      structuredContent: { selector, visible: true },
    }
  },
)

server.registerTool(
  'get_text',
  {
    description: 'Read visible text from the first element matching a CSS selector.',
    inputSchema: {
      selector: z.string().describe('CSS selector to read from.'),
    },
    annotations: {
      title: 'Get Text',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ selector }) => {
    const targetPage = ensurePage()
    const text = (await targetPage.locator(selector).first().innerText()).trim()

    return {
      content: [{ type: 'text', text }],
      structuredContent: { selector, text },
    }
  },
)

server.registerTool(
  'screenshot',
  {
    description: 'Take a full-page screenshot of the current page.',
    inputSchema: {
      fileName: z.string().optional().describe('Optional file name like login-page.png.'),
    },
    annotations: {
      title: 'Screenshot',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ fileName }) => {
    const savedPath = await takeScreenshot(fileName)

    return {
      content: [{ type: 'text', text: JSON.stringify({ savedPath }, null, 2) }],
      structuredContent: { savedPath },
    }
  },
)

server.registerTool(
  'list_console_errors',
  {
    description: 'List console error messages captured in the current page session.',
    annotations: {
      title: 'List Console Errors',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    return {
      content: [{ type: 'text', text: JSON.stringify({ consoleErrors }, null, 2) }],
      structuredContent: { consoleErrors },
    }
  },
)

server.registerTool(
  'list_failed_requests',
  {
    description: 'List failed network requests captured in the current page session.',
    annotations: {
      title: 'List Failed Requests',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    return {
      content: [{ type: 'text', text: JSON.stringify({ failedRequests }, null, 2) }],
      structuredContent: { failedRequests },
    }
  },
)

server.registerTool(
  'close_browser',
  {
    description: 'Close the current Playwright browser and reset captured state.',
    annotations: {
      title: 'Close Browser',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async () => {
    await context?.close().catch(() => undefined)
    await browser?.close().catch(() => undefined)
    browser = null
    context = null
    page = null
    currentViewport = 'desktop'
    resetTelemetry()

    return {
      content: [{ type: 'text', text: JSON.stringify({ closed: true }, null, 2) }],
      structuredContent: { closed: true },
    }
  },
)

function printHelp() {
  console.log(`local-browser MCP server

Usage:
  node --import jiti/register mcp/local-browser.ts

Notes:
  - Uses Playwright Chromium in headless mode
  - Only allows localhost app URLs under ${DEFAULT_BASE_URL}
  - Exposes local app verification tools for UI, auth, mobile, and error inspection
`)
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp()
    return
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(`[local-browser] MCP server started for ${DEFAULT_BASE_URL}`)
}

process.on('SIGINT', () => {
  void context?.close().catch(() => undefined)
  void browser?.close().catch(() => undefined)
})

process.on('SIGTERM', () => {
  void context?.close().catch(() => undefined)
  void browser?.close().catch(() => undefined)
})

main().catch(async (error) => {
  console.error('[local-browser] server error:', error)
  await context?.close().catch(() => undefined)
  await browser?.close().catch(() => undefined)
  process.exit(1)
})
