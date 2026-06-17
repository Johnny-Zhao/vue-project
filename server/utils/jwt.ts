import { createHmac, timingSafeEqual } from 'node:crypto'
import type { JwtPayload, UserRole } from '../types/auth.ts'

interface SignJwtInput {
  sub: number
  username: string
  name: string
  role: UserRole
}

const jwtHeader = {
  alg: 'HS256',
  typ: 'JWT',
} as const

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function decodeBase64UrlToUtf8(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64').toString('utf8')
}

function decodeBase64UrlToBuffer(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64')
}

function createSignature(unsignedToken: string, secret: string) {
  return createHmac('sha256', secret).update(unsignedToken).digest()
}

export function signJwt(payload: SignJwtInput, secret: string, expiresMinutes: number) {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresMinutes * 60

  const jwtPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp,
  }

  const header = encodeBase64Url(JSON.stringify(jwtHeader))
  const body = encodeBase64Url(JSON.stringify(jwtPayload))
  const unsignedToken = `${header}.${body}`
  const signature = encodeBase64Url(createSignature(unsignedToken, secret))

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: exp * 1000,
  }
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const [header, body, signature] = token.split('.')

  if (!header || !body || !signature) {
    return null
  }

  const unsignedToken = `${header}.${body}`
  const expectedSignature = createSignature(unsignedToken, secret)
  const actualSignature = decodeBase64UrlToBuffer(signature)

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64UrlToUtf8(body)) as JwtPayload

    if (payload.exp * 1000 <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
