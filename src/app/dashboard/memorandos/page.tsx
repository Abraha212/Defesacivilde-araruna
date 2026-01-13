'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Check, Loader2, Filter, AlertCircle, RefreshCw, Database, Copy, CheckCircle } from 'lucide-react'

interface Memorando {
  id: string
  numero: number
  status: 'pendente' | 'concluido'
  observacao: string | null
  user_id: string
  updated_at: string
}

// SQL para criar a tabela
const SQL_CREATE_TABLE = `-- Execute este SQL no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.memorandos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL CHECK (numero >= 1 AND numero <= 100),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, numero)
);

ALTER TABLE public.memorandos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memorandos" ON public.memorandos
    FOR ALL USING (auth.uid() = user_id);`

export default function MemorandosPage() {
  const [memorandos, setMemorandos] = useState<Memorando[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos')
  const [saving, setSaving] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const supabase = createClient()

  // Carregar do localStorage
  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('memorandos_local')
    if (saved) {
      setMemorandos(JSON.parse(saved))
    } else {
      // Inicializar com 100 memorandos
      const initial: Memorando[] = Array.from({ length: 100 }, (_, i) => ({
        id: `local-${i + 1}`,
        numero: i + 1,
        status: 'pendente' as const,
        observacao: null,
        user_id: 'local',
        updated_at: new Date().toISOString()
      }))
      setMemorandos(initial)
      localStorage.setItem('memorandos_local', JSON.stringify(initial))
    }
    setLoading(false)
  }, [])

  // Salvar no localStorage
  const saveToLocalStorage = useCallback((data: Memorando[]) => {
    localStorage.setItem('memorandos_local', JSON.stringify(data))
  }, [])

  const loadMemorandos = useCallback(async () => {
    if (useLocalStorage) {
      loadFromLocalStorage()
      return
    }

    setLoading(true)
    setError(null)
    setNeedsSetup(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error: fetchError } = await supabase
        .from('memorandos')
        .select('*')
        .eq('user_id', user.id)
        .order('numero', { ascending: true })

      if (fetchError) {
        // Verificar se é erro de tabela não encontrada
        if (fetchError.message.includes('relation') || 
            fetchError.message.includes('does not exist') ||
            fetchError.message.includes('schema cache') ||
            fetchError.code === '42P01') {
          setNeedsSetup(true)
          setError('Tabela não encontrada no banco de dados')
          return
        }
        throw fetchError
      }

      if (data && data.length > 0) {
        setMemorandos(data)
      } else {
        // Inicializar memorandos
        await initializeMemorandos(user.id)
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar memorandos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      
      if (errorMessage.includes('schema cache') || errorMessage.includes('does not exist')) {
        setNeedsSetup(true)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [supabase, useLocalStorage, loadFromLocalStorage])

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
      if (useLocalStorage) {
        const updated = memorandos.map(m => 
          m.id === memorando.id ? { ...m, status: novoStatus } : m
        )
        setMemorandos(updated as Memorando[])
        saveToLocalStorage(updated as Memorando[])
      } else {
        const { error: updateError } = await supabase
          .from('memorandos')
          .update({ status: novoStatus, updated_at: new Date().toISOString() })
          .eq('id', memorando.id)

        if (updateError) throw updateError

        setMemorandos(prev => 
          prev.map(m => m.id === memorando.id ? { ...m, status: novoStatus } : m)
        )
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      alert('Erro ao salvar alteração: ' + errorMessage)
    } finally {
      setSaving(null)
    }
  }

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_CREATE_TABLE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const enableLocalMode = () => {
    setUseLocalStorage(true)
    setNeedsSetup(false)
    setError(null)
    loadFromLocalStorage()
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

  // Tela de configuração do banco de dados
  if (needsSetup || (error && !useLocalStorage)) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Database className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-amber-800">Configuração Necessária</h2>
              <p className="text-amber-700 mt-1">
                A tabela de memorandos ainda não foi criada no Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm">1</span>
            Copie o SQL abaixo
          </h3>
          <div className="relative">
            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto max-h-64">
              {SQL_CREATE_TABLE}
            </pre>
            <button
              onClick={copySQL}
              className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm">2</span>
            Execute no Supabase
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" className="text-[#e87722] font-bold hover:underline">Dashboard do Supabase</a></li>
            <li>Vá em <strong>SQL Editor</strong></li>
            <li>Cole o SQL e clique em <strong>Run</strong></li>
            <li>Volte aqui e clique em &quot;Tentar novamente&quot;</li>
          </ol>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => loadMemorandos()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#1e3a5f] text-white rounded-xl hover:bg-[#0f2744] transition-all shadow-lg font-bold"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar novamente
          </button>
          <button 
            onClick={enableLocalMode}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold"
          >
            <FileText className="w-5 h-5" />
            Usar modo offline
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          O modo offline salva os dados no seu navegador (localStorage)
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {useLocalStorage && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Modo offline - dados salvos localmente</span>
          </div>
          <button 
            onClick={() => { setUseLocalStorage(false); loadMemorandos(); }}
            className="text-blue-600 font-bold text-sm hover:underline"
          >
            Tentar conectar ao banco
          </button>
        </div>
      )}

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
