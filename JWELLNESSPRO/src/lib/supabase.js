
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhfnxzupohcixoyrrele.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZm54enVwb2hjaXhveXJyZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTEzNTYsImV4cCI6MjA2NTMyNzM1Nn0.eCFMG7xNHQG_PxTbex4We_rtV8bLLUlxK8e1r-MYTlU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  