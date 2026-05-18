import type { InsForgeClient as InsForgeClientBase } from "@insforge/sdk";

type DatabaseFrom = InsForgeClientBase["database"] extends {
  from: infer F;
}
  ? F
  : never;

declare module "@insforge/sdk" {
  interface InsForgeClient {
    /** Assigned in lib/insforge.ts — Supabase-style alias for database.from */
    from: DatabaseFrom;
  }
}
