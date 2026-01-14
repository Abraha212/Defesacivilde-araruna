'use client'

import { useState, useEffect } from 'react'
import { Database, Check, X, Loader2, Copy, ExternalLink, RefreshCw } from 'lucide-react'

const SQL_MEMORANDOS = `-- Tabela de Memorandos
CREATE TABLE IF NOT EXISTS public.memorandos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE CHECK (numero >= 1 AND numero <= 100),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir acesso público (para funcionar sem autenticação)
ALTER TABLE public.memorandos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.memorandos;
CREATE POLICY "Allow all" ON public.memorandos FOR ALL USING (true) WITH CHECK (true);`

const SQL_AGENDA = `-- Tabela de Agenda
CREATE TABLE IF NOT EXISTS public.agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir acesso público
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.agenda;
CREATE POLICY "Allow all" ON public.agenda FOR ALL USING (true) WITH CHECK (true);`

export default function SetupPage() {
  const [status, setStatus] = useState<{
    loading: boolean
    connected: boolean
    memorandos: boolean
    agenda: boolean
    error?: string
  }>({
    loading: true,
    connected: false,
    memorandos: false,
    agenda: false
  })
  const [copied, setCopied] = useState<string | null>(null)

  const checkStatus = async () => {
    setStatus(s => ({ ...s, loading: true }))
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      setStatus({
        loading: false,
        connected: data.connected,
        memorandos: data.tables?.memorandos || false,
        agenda: data.tables?.agenda || false,
        error: data.error
      })
    } catch (error) {
      setStatus({
        loading: false,
        connected: false,
        memorandos: false,
        agenda: false,
        error: String(error)
      })
    }
  }

  useEffect(() => { checkStatus() }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const StatusIcon = ({ ok }: { ok: boolean }) => ok 
    ? <Check className="w-5 h-5 text-emerald-500" />
    : <X className="w-5 h-5 text-red-500" />

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Configuração do Banco de Dados</h1>
          <p className="text-slate-500 mt-1">Configure as tabelas do Supabase para salvar os dados</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1e3a5f]">Status das Tabelas</h2>
            <button onClick={checkStatus} disabled={status.loading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <RefreshCw className={`w-4 h-4 ${status.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {status.loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
              <span className="text-slate-500 text-sm">Verificando...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Conexão com Supabase</span>
                <StatusIcon ok={status.connected} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Tabela: memorandos</span>
                <StatusIcon ok={status.memorandos} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Tabela: agenda</span>
                <StatusIcon ok={status.agenda} />
              </div>
            </div>
          )}

          {status.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {status.error}
            </div>
          )}

          {status.connected && status.memorandos && status.agenda && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-700">Tudo configurado!</p>
              <p className="text-sm text-emerald-600 mt-1">Os dados serão salvos no banco de dados.</p>
              <a href="/dashboard" className="inline-block mt-3 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg font-medium text-sm hover:bg-[#0f2744] transition-colors">
                Ir para o Dashboard
              </a>
            </div>
          )}
        </div>

        {/* Instruções */}
        {(!status.memorandos || !status.agenda) && !status.loading && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-bold text-amber-800 mb-2">⚠️ Tabelas não encontradas</h3>
              <p className="text-sm text-amber-700">
                Execute os comandos SQL abaixo no <strong>Supabase SQL Editor</strong> para criar as tabelas.
              </p>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-amber-800 font-medium hover:underline">
                Abrir Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* SQL Memorandos */}
            {!status.memorandos && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <h3 className="font-bold text-[#1e3a5f]">1. Tabela Memorandos</h3>
                  <button onClick={() => copyToClipboard(SQL_MEMORANDOS, 'memo')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
                    {copied === 'memo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === 'memo' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-300 text-xs overflow-x-auto">
                  <code>{SQL_MEMORANDOS}</code>
                </pre>
              </div>
            )}

            {/* SQL Agenda */}
            {!status.agenda && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <h3 className="font-bold text-[#1e3a5f]">2. Tabela Agenda</h3>
                  <button onClick={() => copyToClipboard(SQL_AGENDA, 'agenda')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
                    {copied === 'agenda' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === 'agenda' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-300 text-xs overflow-x-auto">
                  <code>{SQL_AGENDA}</code>
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-800 mb-2">📋 Passos para configurar:</h3>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" className="underline">Supabase Dashboard</a></li>
                <li>Selecione seu projeto</li>
                <li>Vá em <strong>SQL Editor</strong> no menu lateral</li>
                <li>Copie e cole o SQL acima</li>
                <li>Clique em <strong>Run</strong></li>
                <li>Volte aqui e clique em <strong>Verificar novamente</strong></li>
              </ol>
            </div>
          </>
        )}

        {/* Voltar */}
        <div className="text-center">
          <a href="/dashboard" className="text-sm text-slate-500 hover:text-[#1e3a5f]">
            ← Voltar para o Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
