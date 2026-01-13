'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Check, Loader2, Filter, AlertCircle, RefreshCw } from 'lucide-react'

interface Memorando {
  id: string
  numero: number
  status: 'pendente' | 'concluido'
  observacao: string | null
  user_id: string
  updated_at: string
}

export default function MemorandosPage() {
  const [memorandos, setMemorandos] = useState<Memorando[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos')
  const [saving, setSaving] = useState<number | null>(null)
  const supabase = createClient()

  const loadMemorandos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error: fetchError } = await supabase
        .from('memorandos')
        .select('*')
        .eq('user_id', user.id)
        .order('numero', { ascending: true })

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setMemorandos(data)
      } else {
        // Se não existirem, inicializar
        await initializeMemorandos(user.id)
      }
    } catch (err: any) {
      console.error('Erro ao carregar memorandos:', err)
      setError(err.message || 'Erro ao carregar os dados. Verifique se as tabelas foram criadas no Supabase.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadMemorandos()
  }, [loadMemorandos])

  const initializeMemorandos = async (userId: string) => {
    const novos = Array.from({ length: 100 }, (_, i) => ({
      numero: i + 1,
      status: 'pendente' as const,
      observacao: null,
      user_id: userId,
    }))

    const { data, error } = await supabase
      .from('memorandos')
      .insert(novos)
      .select()

    if (error) throw error
    if (data) setMemorandos(data)
  }

  const toggleStatus = async (memorando: Memorando) => {
    setSaving(memorando.numero)
    const novoStatus = memorando.status === 'pendente' ? 'concluido' : 'pendente'

    try {
      const { error: updateError } = await supabase
        .from('memorandos')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', memorando.id)

      if (updateError) throw updateError

      setMemorandos(prev => 
        prev.map(m => m.id === memorando.id ? { ...m, status: novoStatus } : m)
      )
    } catch (err: any) {
      alert('Erro ao salvar alteração: ' + err.message)
    } finally {
      setSaving(null)
    }
  }

  const filteredMemorandos = memorandos.filter(m => {
    if (filter === 'todos') return true
    return m.status === filter
  })

  const stats = {
    total: memorandos.length,
    concluidos: memorandos.filter(m => m.status === 'concluido').length,
    pendentes: memorandos.filter(m => m.status === 'pendente').length,
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
        <p className="text-slate-500 font-medium animate-pulse">Carregando memorandos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-red-700">Ops! Algo deu errado</h2>
        <p className="text-red-600 max-w-md">{error}</p>
        <button 
          onClick={() => loadMemorandos()}
          className="mt-2 flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight">Controle de Memorandos</h1>
          <p className="text-slate-500 font-medium">Gerencie a numeração oficial da Defesa Civil Araruna</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {(['todos', 'pendente', 'concluido'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 text-xs font-bold rounded-lg transition-all
                ${filter === f 
                  ? 'bg-[#1e3a5f] text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1e3a5f]'
                }
              `}
            >
              {f === 'todos' ? 'TODOS' : f === 'pendente' ? 'PENDENTES' : 'CONCLUÍDOS'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Registrado', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Concluídos', value: stats.concluidos, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pendentes', value: stats.pendentes, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color} mt-1`}>{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <FileText className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Grid Principal 1-100 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {filteredMemorandos.map(m => (
            <button
              key={m.id}
              onClick={() => toggleStatus(m)}
              disabled={saving === m.numero}
              className={`
                group relative aspect-square rounded-2xl flex flex-col items-center justify-center
                font-black text-xl transition-all duration-300 transform
                ${m.status === 'concluido'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-[#e87722] hover:text-[#e87722] hover:-translate-y-1 hover:shadow-lg'
                }
                ${saving === m.numero ? 'opacity-50 scale-95' : ''}
              `}
            >
              {saving === m.numero ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-bold opacity-50 absolute top-2 left-3">#</span>
                  {m.numero}
                  {m.status === 'concluido' && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {filteredMemorandos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Filter className="w-12 h-12" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Nenhum resultado para este filtro</p>
          </div>
        )}
      </div>

      {/* Legenda Moderna */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-white/20 border-2 border-white/40" />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Pendente</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Concluído</span>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 italic">
          * Clique em um card para alternar o status instantaneamente.
        </p>
      </div>
    </div>
  )
}
