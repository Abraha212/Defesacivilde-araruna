'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Check, Loader2, RefreshCw } from 'lucide-react'

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

  const loadMemorandos = useCallback(() => {
    setLoading(true)
    const saved = localStorage.getItem('memorandos_defesacivil')
    if (saved) {
      setMemorandos(JSON.parse(saved))
    } else {
      const initial: Memorando[] = Array.from({ length: 100 }, (_, i) => ({
        id: `memo-${i + 1}`, numero: i + 1, status: 'pendente' as const,
        observacao: null, updated_at: new Date().toISOString()
      }))
      setMemorandos(initial)
      localStorage.setItem('memorandos_defesacivil', JSON.stringify(initial))
    }
    setLoading(false)
  }, [])

  const saveToLocalStorage = useCallback((data: Memorando[]) => {
    localStorage.setItem('memorandos_defesacivil', JSON.stringify(data))
  }, [])

  useEffect(() => { loadMemorandos() }, [loadMemorandos])

  const toggleStatus = async (memorando: Memorando) => {
    setSaving(memorando.numero)
    const novoStatus = memorando.status === 'pendente' ? 'concluido' : 'pendente'
    await new Promise(resolve => setTimeout(resolve, 150))
    const updated = memorandos.map(m => 
      m.id === memorando.id ? { ...m, status: novoStatus as 'pendente' | 'concluido', updated_at: new Date().toISOString() } : m
    )
    setMemorandos(updated)
    saveToLocalStorage(updated)
    setSaving(null)
  }

  const resetAll = () => {
    if (confirm('Resetar todos os memorandos para "Pendente"?')) {
      const reset = memorandos.map(m => ({ ...m, status: 'pendente' as const, updated_at: new Date().toISOString() }))
      setMemorandos(reset)
      saveToLocalStorage(reset)
    }
  }

  const filteredMemorandos = memorandos.filter(m => filter === 'todos' ? true : m.status === filter)
  const stats = {
    total: memorandos.length,
    concluidos: memorandos.filter(m => m.status === 'concluido').length,
    pendentes: memorandos.filter(m => m.status === 'pendente').length,
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
        <p className="text-slate-500 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1e3a5f]">Controle de Memorandos</h1>
          <p className="text-xs text-slate-500">Numeração oficial da Defesa Civil</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Resetar">
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
            {(['todos', 'pendente', 'concluido'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase
                  ${filter === f ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:text-[#1e3a5f]'}`}>
                {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pend.' : 'Conc.'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#1e3a5f]' },
          { label: 'Concluídos', value: stats.concluidos, color: 'text-[#1e3a5f]' },
          { label: 'Pendentes', value: stats.pendentes, color: 'text-[#e87722]' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">Progresso</span>
          <span className="text-xs font-bold text-[#1e3a5f]">{Math.round((stats.concluidos / stats.total) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1e3a5f] rounded-full transition-all duration-500" style={{ width: `${(stats.concluidos / stats.total) * 100}%` }} />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {filteredMemorandos.map(m => (
            <button key={m.id} onClick={() => toggleStatus(m)} disabled={saving === m.numero}
              className={`relative aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all
                ${m.status === 'concluido' ? 'bg-[#1e3a5f] text-white' : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'}
                ${saving === m.numero ? 'opacity-50 scale-95' : 'active:scale-95'}`}>
              {saving === m.numero ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {m.numero}
                  {m.status === 'concluido' && (
                    <div className="absolute -top-1 -right-1 bg-[#e87722] rounded-full p-0.5">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {filteredMemorandos.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Nenhum resultado</p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-slate-300" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#1e3a5f]" />
          <span>Concluído</span>
        </div>
      </div>
    </div>
  )
}
