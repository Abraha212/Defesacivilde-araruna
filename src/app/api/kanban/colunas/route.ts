import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET — busca todas as colunas com seus cards
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kanban_colunas')
      .select(`
        *,
        kanban_cards (*)
      `)
      .order('ordem', { ascending: true })
      .order('ordem', { referencedTable: 'kanban_cards', ascending: true })

    if (error) return NextResponse.json({ data: [], needsSetup: true, error: error.message })
    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ data: [], needsSetup: true, error: 'Erro de conexão' })
  }
}

// POST — cria nova coluna
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { titulo, cor, ordem } = await request.json()

    if (!titulo) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

    const { data, error } = await supabase
      .from('kanban_colunas')
      .insert({ titulo, cor: cor || '#1e3a5f', ordem: ordem ?? 0 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message, needsSetup: true }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar coluna' }, { status: 500 })
  }
}

// PUT — atualiza coluna (título, cor ou ordem)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { id, titulo, cor, ordem } = await request.json()

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (titulo !== undefined) update.titulo = titulo
    if (cor    !== undefined) update.cor    = cor
    if (ordem  !== undefined) update.ordem  = ordem

    const { error } = await supabase
      .from('kanban_colunas')
      .update(update)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar coluna' }, { status: 500 })
  }
}

// DELETE — exclui coluna (e todos os cards via CASCADE)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { error } = await supabase.from('kanban_colunas').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir coluna' }, { status: 500 })
  }
}
