import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dbwudklbaakefrusvknx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3Vka2xiYWFrZWZydXN2a254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzE0MzIsImV4cCI6MjA4NjkwNzQzMn0.14rkQbqMVurgjKBreiLFvPgVh4HR7IQ6s2dQ00NW4BQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
