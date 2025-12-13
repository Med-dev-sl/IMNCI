import { createClient } from '@supabase/supabase-js'

// Supabase URL and anon key provided by the user
const SUPABASE_URL = 'https://rlldtclutanjnkqeppti.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbGR0Y2x1dGFuam5rcWVwcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODMxMjMsImV4cCI6MjA4MTE1OTEyM30.ZVIMQohJunchubcTIiIa483_D_4srMZE_e9H46zuMIQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
