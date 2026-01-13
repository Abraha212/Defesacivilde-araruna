'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Check, Loader2, Filter, RefreshCw } from 'lucide-react'

interface Memorando {
  id: string
  numero: number
  status: 'pendente' | 'concluido'
  observacao: string | null
  updated_at: string
}

export default function MemorandosPage() {
  const [memorandos, setMemorandos] = useState<Memorando[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos')
  const [saving, setSaving] = useState<number | null>(null)

  // Carregar do localStorage
  const loadMemorandos = useCallback(() => {
    setLoading(true)
    
    const saved = localStorage.getItem('memorandos_defesacivil')
    if (saved) {
      setMemorandos(JSON.parse(saved))
    } else {
      // Inicializar com 100 memorandos
      const initial: Memorando[] = Array.from({ length: 100 }, (_, i) => ({
        id: `memo-${i + 1}`,
        numero: i + 1,
        status: 'pendente' as const,
        observacao: null,
        updated_at: new Date().toISOString()
      }))
      setMemorandos(initial)
      localStorage.setItem('memorandos_defesacivil', JSON.stringify(initial))
    }
    
    setLoading(false)
  }, [])

  // Salvar no localStorage
  const saveToLocalStorage = useCallback((data: Memorando[]) => {
    localStorage.setItem('memorandos_defesacivil', JSON.stringify(data))
  }, [])

  useEffect(() => {
    loadMemorandos()
  }, [loadMemorandos])

  const toggleStatus = async (memorando: Memorando) => {
    setSaving(memorando.numero)
    const novoStatus = memorando.status === 'pendente' ? 'concluido' : 'pendente'

    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 200))

    const updated = memorandos.map(m => 
      m.id === memorando.id 
        ? { ...m, status: novoStatus as 'pendente' | 'concluido', updated_at: new Date().toISOString() } 
        : m
    )
    setMemorandos(updated)
    saveToLocalStorage(updated)
    setSaving(null)
  }

  const resetAll = () => {
    if (confirm('Deseja realmente resetar todos os memorandos para "Pendente"?')) {
      const reset = memorandos.map(m => ({
        ...m,
        status: 'pendente' as const,
        updated_at: new Date().toISOString()
      }))
      setMemorandos(reset)
      saveToLocalStorage(reset)
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight">Controle de Memorandos</h1>
          <p className="text-slate-500 font-medium">Gerencie a numeração oficial da Defesa Civil Araruna</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetAll}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resetar
          </button>
          
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

      {/* Barra de progresso */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-600">Progresso Geral</span>
          <span className="text-sm font-black text-[#1e3a5f]">
            {Math.round((stats.concluidos / stats.total) * 100)}%
          </span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${(stats.concluidos / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Grid Principal 1-100 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {filteredMemorandos.map(m => (
            <button
              key={m.id}
              onClick={() => toggleStatus(m)}
              disabled={saving === m.numero}
              className={`
                group relative aspect-square rounded-2xl flex flex-col items-center justify-center
                font-black text-lg transition-all duration-300 transform
                ${m.status === 'concluido'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-[#e87722] hover:text-[#e87722] hover:-translate-y-1 hover:shadow-lg'
                }
                ${saving === m.numero ? 'opacity-50 scale-95' : ''}
              `}
            >
              {saving === m.numero ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {m.numero}
                  {m.status === 'concluido' && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
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
          * Clique em um número para alternar o status. Dados salvos localmente.
        </p>
      </div>
    </div>
  )
}
