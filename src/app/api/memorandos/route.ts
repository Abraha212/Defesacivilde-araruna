import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Buscar todos os memorandos
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('memorandos')
      .select('*')
      .order('numero', { ascending: true })

    if (error) {
      console.error('Erro ao buscar memorandos:', error)
      // Qualquer erro indica problema com a tabela
      return NextResponse.json({ data: [], needsSetup: true, error: error.message })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Erro ao buscar memorandos:', error)
    return NextResponse.json({ data: [], needsSetup: true, error: 'Erro de conexão' })
  }
}

// POST - Criar/Atualizar um memorando
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { numero, status } = body

    if (!numero || !status) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Usar upsert para criar ou atualizar
    const { error } = await supabase
      .from('memorandos')
      .upsert(
        { numero, status, updated_at: new Date().toISOString() },
        { onConflict: 'numero' }
      )

    if (error) {
      console.error('Erro ao salvar memorando:', error)
      return NextResponse.json({ error: error.message, needsSetup: true }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar memorando:', error)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

// PUT - Resetar todos os memorandos
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { memorandos } = body

    if (!memorandos || !Array.isArray(memorandos)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Atualizar todos para pendente usando upsert
    const toUpsert = memorandos.map(m => ({
      numero: m.numero,
      status: m.status,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('memorandos')
      .upsert(toUpsert, { onConflict: 'numero' })

    if (error) {
      console.error('Erro ao resetar memorandos:', error)
      return NextResponse.json({ error: error.message, needsSetup: true }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar memorandos:', error)
    return NextResponse.json({ error: 'Erro ao resetar' }, { status: 500 })
  }
}
