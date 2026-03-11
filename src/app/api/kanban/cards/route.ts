import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST — cria novo card
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { coluna_id, titulo, descricao, etiquetas, imagem, ordem } = await request.json()

    if (!coluna_id || !titulo) {
      return NextResponse.json({ error: 'coluna_id e título obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        coluna_id,
        titulo,
        descricao: descricao || null,
        etiquetas: etiquetas || [],
        imagem:    imagem    || null,
        ordem:     ordem     ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message, needsSetup: true }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 })
  }
}

// PUT — atualiza card (campos parciais ou mover de coluna)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { id, coluna_id, titulo, descricao, etiquetas, imagem, ordem } = await request.json()

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (coluna_id  !== undefined) update.coluna_id  = coluna_id
    if (titulo     !== undefined) update.titulo     = titulo
    if (descricao  !== undefined) update.descricao  = descricao
    if (etiquetas  !== undefined) update.etiquetas  = etiquetas
    if (imagem     !== undefined) update.imagem     = imagem
    if (ordem      !== undefined) update.ordem      = ordem

    const { error } = await supabase.from('kanban_cards').update(update).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 500 })
  }
}

// DELETE — exclui card
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { error } = await supabase.from('kanban_cards').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir card' }, { status: 500 })
  }
}
