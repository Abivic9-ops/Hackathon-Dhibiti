/**
 * Dhibiti database schema types.
 *
 * Placeholder for the project's data model. When a real backend is wired up
 * (e.g. Supabase / Convex), replace these generics with the generated schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
