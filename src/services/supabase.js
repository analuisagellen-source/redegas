// Conexão com o Supabase. Sem as variáveis de ambiente, o app roda no modo
// demonstração (dados no navegador).

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const temSupabase = Boolean(url && key)
export const supabase = temSupabase ? createClient(url, key) : null
