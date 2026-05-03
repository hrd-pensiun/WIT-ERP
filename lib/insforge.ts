import { createClient } from '@insforge/sdk'

const insForgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || process.env.INSFORGE_URL
const insForgeKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || process.env.INSFORGE_ANON_KEY

// Check if we have real credentials
const hasRealCredentials = insForgeUrl && insForgeKey && 
  !insForgeUrl.includes('your-project') && 
  insForgeKey.length > 20

if (!hasRealCredentials) {
  console.warn('[WIT-ERP] Running in MOCK MODE - No InsForge credentials found')
}

// Create client only if we have credentials, otherwise null
const client = hasRealCredentials
  ? createClient({
      baseUrl: insForgeUrl!,
      anonKey: insForgeKey!,
    })
  : null

// Proxy .from() to .database.from() for Supabase-compatible API
if (client) {
  // @ts-ignore
  client.from = client.database.from.bind(client.database)
}

export const insForge = client

export type InsForgeClient = NonNullable<typeof insForge>

// Helper to check if we're in mock mode
export const isMockMode = () => !insForge

// Mock database-like interface for when credentials are missing
export const createMockClient = () => {
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  }
}
