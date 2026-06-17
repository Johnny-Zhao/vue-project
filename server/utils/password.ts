import { compare, hash } from 'bcryptjs'

const PASSWORD_HASH_ROUNDS = 10

export function isHashedPassword(value: string) {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')
}

export async function hashPassword(password: string) {
  return hash(password, PASSWORD_HASH_ROUNDS)
}

export async function verifyPassword(password: string, storedPassword: string) {
  if (!isHashedPassword(storedPassword)) {
    return password === storedPassword
  }

  return compare(password, storedPassword)
}
