import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Verificar status das tabelas
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar tabela memorandos
    const { error: memoError } = await supabase
      .from('memorandos')
      .select('numero')
      .limit(1)
    
    // Tabela existe se não houver erro OU se o erro for apenas "sem dados"
    const memoExists = !memoError
    
    // Verificar tabela agenda
    const { error: agendaError } = await supabase
      .from('agenda')
      .select('id')
      .limit(1)
    
    const agendaExists = !agendaError

    return NextResponse.json({
      connected: true,
      tables: {
        memorandos: memoExists,
        agenda: agendaExists
      },
      errors: {
        memorandos: memoError?.message || null,
        agenda: agendaError?.message || null
      }
    })
  } catch (error) {
    console.error('Erro ao verificar setup:', error)
    return NextResponse.json({ 
      connected: false, 
      error: String(error),
      tables: { memorandos: false, agenda: false }
    }, { status: 500 })
  }
}
