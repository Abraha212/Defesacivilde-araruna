'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Edit2, 
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Database,
  Copy,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Compromisso {
  id: string
  titulo: string
  descricao: string | null
  data: string
  hora_inicio: string
  hora_fim: string | null
  user_id: string
  created_at: string
}

// SQL para criar a tabela
const SQL_CREATE_TABLE = `-- Execute este SQL no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agenda" ON public.agenda
    FOR ALL USING (auth.uid() = user_id);`

export default function AgendaPage() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: '09:00',
    hora_fim: '',
  })
  const supabase = createClient()

  // Funções de localStorage
  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('agenda_local')
    if (saved) {
      setCompromissos(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const saveToLocalStorage = useCallback((data: Compromisso[]) => {
    localStorage.setItem('agenda_local', JSON.stringify(data))
  }, [])

  const loadCompromissos = useCallback(async () => {
    if (useLocalStorage) {
      loadFromLocalStorage()
      return
    }

    setLoading(true)
    setError(null)
    setNeedsSetup(false)

    try {
      const { data, error: fetchError } = await supabase
        .from('agenda')
        .select('*')
        .order('data', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (fetchError) {
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
      if (data) setCompromissos(data)
    } catch (err: unknown) {
      console.error('Erro ao carregar agenda:', err)
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
    loadCompromissos()
  }, [loadCompromissos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (useLocalStorage) {
        const newCompromisso: Compromisso = {
          id: editingId || `local-${Date.now()}`,
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          data: formData.data,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim || null,
          user_id: 'local',
          created_at: new Date().toISOString()
        }

        let updated: Compromisso[]
        if (editingId) {
          updated = compromissos.map(c => c.id === editingId ? newCompromisso : c)
        } else {
          updated = [...compromissos, newCompromisso]
        }
        setCompromissos(updated)
        saveToLocalStorage(updated)
        setShowModal(false)
        resetForm()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data: formData.data,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim || null,
        user_id: user.id,
      }

      let error
      if (editingId) {
        const { error: updateError } = await supabase
          .from('agenda')
          .update(payload)
          .eq('id', editingId)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('agenda')
          .insert(payload)
        error = insertError
      }

      if (error) throw error

      setShowModal(false)
      resetForm()
      await loadCompromissos()
    } catch (err: unknown) {
      console.error('Erro ao salvar compromisso:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      alert('ERRO AO SALVAR: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este compromisso?')) return
    
    try {
      if (useLocalStorage) {
        const updated = compromissos.filter(c => c.id !== id)
        setCompromissos(updated)
        saveToLocalStorage(updated)
        return
      }

      const { error } = await supabase.from('agenda').delete().eq('id', id)
      if (error) throw error
      await loadCompromissos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      alert('Erro ao excluir: ' + errorMessage)
    }
  }

  const handleEdit = (compromisso: Compromisso) => {
    setFormData({
      titulo: compromisso.titulo,
      descricao: compromisso.descricao || '',
      data: compromisso.data,
      hora_inicio: compromisso.hora_inicio,
      hora_fim: compromisso.hora_fim || '',
    })
    setEditingId(compromisso.id)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      data: format(selectedDate, 'yyyy-MM-dd'),
      hora_inicio: '09:00',
      hora_fim: '',
    })
    setEditingId(null)
  }

  const openNewModal = () => {
    resetForm()
    setFormData(prev => ({ ...prev, data: format(selectedDate, 'yyyy-MM-dd') }))
    setShowModal(true)
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const compromissosDodia = compromissos.filter(c => 
    isSameDay(new Date(c.data + 'T00:00:00'), selectedDate)
  )

  const hasCompromisso = (date: Date) => 
    compromissos.some(c => isSameDay(new Date(c.data + 'T00:00:00'), date))

  // Tela de configuração
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
                A tabela de agenda ainda não foi criada no Supabase.
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
            onClick={() => loadCompromissos()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#1e3a5f] text-white rounded-xl hover:bg-[#0f2744] transition-all shadow-lg font-bold"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar novamente
          </button>
          <button 
            onClick={enableLocalMode}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold"
          >
            <CalendarIcon className="w-5 h-5" />
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
            onClick={() => { setUseLocalStorage(false); loadCompromissos(); }}
            className="text-blue-600 font-bold text-sm hover:underline"
          >
            Tentar conectar ao banco
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight">Agenda Institucional</h1>
          <p className="text-slate-500 font-medium">Cronograma de atividades e alertas da Defesa Civil</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-6 py-3 bg-[#e87722] hover:bg-[#c55a0a] text-white rounded-2xl transition-all shadow-lg shadow-orange-200 hover:-translate-y-0.5 font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Compromisso
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendário Moderno */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[#1e3a5f] capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-[#1e3a5f]"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-[#1e3a5f]"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
              <div key={day} className="text-center text-xs font-black text-slate-300 tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map(day => {
              const active = isSameDay(day, selectedDate)
              const today = isSameDay(day, new Date())
              const hasEvents = hasCompromisso(day)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-2xl text-sm font-bold transition-all relative flex flex-col items-center justify-center gap-1
                    ${active 
                      ? 'bg-[#1e3a5f] text-white shadow-xl shadow-blue-100 scale-105 z-10' 
                      : isSameMonth(day, currentMonth)
                        ? 'hover:bg-slate-50 text-[#1e3a5f]'
                        : 'text-slate-200'
                    }
                    ${today && !active ? 'border-2 border-[#f59d4d] text-[#f59d4d]' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {hasEvents && (
                    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#f59d4d]' : 'bg-[#e87722]'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0f2744] rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black capitalize">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <CalendarIcon className="w-6 h-6 text-[#f59d4d]" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#f59d4d]" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</p>
              </div>
            ) : compromissosDodia.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium italic">
                  Nenhuma atividade programada para este dia.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {compromissosDodia.map(c => (
                  <div 
                    key={c.id}
                    className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#f59d4d]" />
                          <h4 className="font-bold text-base leading-tight">{c.titulo}</h4>
                        </div>
                        {c.descricao && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{c.descricao}</p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#f59d4d] uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {c.hora_inicio}
                            {c.hora_fim && ` - ${c.hora_fim}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-[#e87722] rounded-3xl p-6 text-white shadow-lg flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Dica de Uso</p>
              <p className="text-sm font-bold">Clique nos dias com pontos laranja para ver os detalhes das missões.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Moderno */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f2744]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e3a5f] p-8 text-white relative">
              <h3 className="text-2xl font-black tracking-tight">
                {editingId ? 'Editar Compromisso' : 'Novo Registro'}
              </h3>
              <p className="text-white/60 text-sm font-medium mt-1">Preencha os dados oficiais da atividade</p>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Título da Missão / Atividade
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-bold text-[#1e3a5f]"
                  placeholder="Ex: Vistoria na Zona Rural"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Descrição Detalhada
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-medium text-slate-600 resize-none"
                  placeholder="Descreva os detalhes da atividade..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    Data Oficial
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-bold text-[#1e3a5f]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Início
                    </label>
                    <input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                      className="w-full px-3 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-bold text-[#1e3a5f]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={formData.hora_fim}
                      onChange={e => setFormData({ ...formData, hora_fim: e.target.value })}
                      className="w-full px-3 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-bold text-[#1e3a5f]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-8 py-4 bg-[#1e3a5f] hover:bg-[#0f2744] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{editingId ? 'Salvar Alterações' : 'Confirmar Registro'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
