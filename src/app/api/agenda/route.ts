import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Buscar todos os compromissos
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .order('data', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], needsSetup: true })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao buscar agenda:', error)
    return NextResponse.json({ error: 'Erro ao buscar agenda' }, { status: 500 })
  }
}

// POST - Criar novo compromisso
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { titulo, descricao, data, hora_inicio, hora_fim } = body

    const { data: inserted, error } = await supabase
      .from('agenda')
      .insert({
        titulo,
        descricao: descricao || null,
        data,
        hora_inicio,
        hora_fim: hora_fim || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: inserted })
  } catch (error) {
    console.error('Erro ao criar compromisso:', error)
    return NextResponse.json({ error: 'Erro ao criar compromisso' }, { status: 500 })
  }
}

// PUT - Atualizar compromisso
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { id, titulo, descricao, data, hora_inicio, hora_fim } = body

    const { error } = await supabase
      .from('agenda')
      .update({
        titulo,
        descricao: descricao || null,
        data,
        hora_inicio,
        hora_fim: hora_fim || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar compromisso:', error)
    return NextResponse.json({ error: 'Erro ao atualizar compromisso' }, { status: 500 })
  }
}

// DELETE - Excluir compromisso
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('agenda')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir compromisso:', error)
    return NextResponse.json({ error: 'Erro ao excluir compromisso' }, { status: 500 })
  }
}
