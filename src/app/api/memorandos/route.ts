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
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], needsSetup: true })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao buscar memorandos:', error)
    return NextResponse.json({ error: 'Erro ao buscar memorandos' }, { status: 500 })
  }
}

// POST - Criar/Atualizar memorando
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { numero, status } = body

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('memorandos')
      .select('id')
      .eq('numero', numero)
      .single()

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('memorandos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('numero', numero)

      if (error) throw error
    } else {
      // Criar
      const { error } = await supabase
        .from('memorandos')
        .insert({ numero, status })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar memorando:', error)
    return NextResponse.json({ error: 'Erro ao salvar memorando' }, { status: 500 })
  }
}

// PUT - Atualizar todos os memorandos (reset)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { memorandos } = body

    // Inserir/atualizar todos
    for (const memo of memorandos) {
      const { data: existing } = await supabase
        .from('memorandos')
        .select('id')
        .eq('numero', memo.numero)
        .single()

      if (existing) {
        await supabase
          .from('memorandos')
          .update({ status: memo.status, updated_at: new Date().toISOString() })
          .eq('numero', memo.numero)
      } else {
        await supabase
          .from('memorandos')
          .insert({ numero: memo.numero, status: memo.status })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar memorandos:', error)
    return NextResponse.json({ error: 'Erro ao resetar memorandos' }, { status: 500 })
  }
}
