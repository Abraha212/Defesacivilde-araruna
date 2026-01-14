'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Edit2, 
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
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
  created_at: string
}

export default function AgendaPage() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [useLocal, setUseLocal] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: '09:00',
    hora_fim: '',
  })

  const loadCompromissos = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/agenda')
      const result = await response.json()
      
      if (result.needsSetup || result.error) {
        loadFromLocalStorage()
      } else if (result.data) {
        setCompromissos(result.data)
        setUseLocal(false)
      } else {
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Erro ao carregar agenda:', error)
      loadFromLocalStorage()
    }
    
    setLoading(false)
  }, [])

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('agenda_defesacivil')
    if (saved) {
      setCompromissos(JSON.parse(saved))
    }
    setUseLocal(true)
  }

  const saveToLocalStorage = (data: Compromisso[]) => {
    localStorage.setItem('agenda_defesacivil', JSON.stringify(data))
  }

  useEffect(() => { loadCompromissos() }, [loadCompromissos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const novoCompromisso: Compromisso = {
      id: editingId || `agenda-${Date.now()}`,
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      data: formData.data,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim || null,
      created_at: new Date().toISOString()
    }

    if (useLocal) {
      let updated: Compromisso[]
      if (editingId) {
        updated = compromissos.map(c => c.id === editingId ? novoCompromisso : c)
      } else {
        updated = [...compromissos, novoCompromisso]
      }
      updated.sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio))
      setCompromissos(updated)
      saveToLocalStorage(updated)
    } else {
      try {
        let response: Response
        if (editingId) {
          response = await fetch('/api/agenda', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingId, ...formData })
          })
        } else {
          response = await fetch('/api/agenda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
        }
        
        if (!response.ok) throw new Error('Erro ao salvar')
        
        await loadCompromissos()
      } catch (error) {
        console.error('Erro ao salvar no banco, usando local:', error)
        let updated = editingId
          ? compromissos.map(c => c.id === editingId ? novoCompromisso : c)
          : [...compromissos, novoCompromisso]
        updated.sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio))
        setCompromissos(updated)
        saveToLocalStorage(updated)
      }
    }

    setShowModal(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este compromisso?')) return
    
    if (useLocal) {
      const updated = compromissos.filter(c => c.id !== id)
      setCompromissos(updated)
      saveToLocalStorage(updated)
    } else {
      try {
        const response = await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Erro ao excluir')
        await loadCompromissos()
      } catch (error) {
        console.error('Erro ao excluir do banco, removendo local:', error)
        const updated = compromissos.filter(c => c.id !== id)
        setCompromissos(updated)
        saveToLocalStorage(updated)
      }
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const compromissosDodia = compromissos.filter(c => 
    isSameDay(new Date(c.data + 'T00:00:00'), selectedDate)
  )

  const hasCompromisso = (date: Date) => 
    compromissos.some(c => isSameDay(new Date(c.data + 'T00:00:00'), date))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Agenda Institucional</h1>
          <p className="text-xs text-slate-500">
            {useLocal ? 'Salvamento Local Ativo' : 'Sincronizado com Nuvem'}
          </p>
        </div>
        <button onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#0f2744] text-white rounded-lg transition-all font-bold text-sm">
          <Plus className="w-4 h-4" />
          Novo Compromisso
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#1e3a5f]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#1e3a5f]">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map(day => {
              const active = isSameDay(day, selectedDate)
              const today = isSameDay(day, new Date())
              const hasEvents = hasCompromisso(day)
              
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center gap-0.5
                    ${active ? 'bg-[#1e3a5f] text-white' : isSameMonth(day, currentMonth) ? 'hover:bg-slate-100 text-[#1e3a5f]' : 'text-slate-300'}
                    ${today && !active ? 'ring-2 ring-[#e87722] ring-inset' : ''}`}>
                  {format(day, 'd')}
                  {hasEvents && <div className={`w-1 h-1 rounded-full ${active ? 'bg-[#e87722]' : 'bg-[#e87722]'}`} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista do dia */}
        <div className="bg-[#1e3a5f] rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold capitalize">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <CalendarIcon className="w-5 h-5 text-[#e87722]" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#e87722]" />
              <p className="text-xs text-slate-400">Carregando...</p>
            </div>
          ) : compromissosDodia.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-white/20 rounded-lg">
              <p className="text-slate-400 text-sm">Nenhuma atividade neste dia.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {compromissosDodia.map(c => (
                <div key={c.id} className="bg-white/10 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{c.titulo}</h4>
                      {c.descricao && <p className="text-xs text-slate-300 mt-1 line-clamp-2">{c.descricao}</p>}
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#e87722] font-bold">
                        <Clock className="w-3 h-3" />
                        {c.hora_inicio}{c.hora_fim && ` - ${c.hora_fim}`}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1e3a5f] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">{editingId ? 'Editar' : 'Novo'} Compromisso</h3>
                <p className="text-xs text-white/60">Preencha os dados</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título</label>
                <input type="text" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="Ex: Vistoria na Zona Rural" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                <textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none"
                  placeholder="Detalhes..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data</label>
                  <input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-2 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Início</label>
                  <input type="time" value={formData.hora_inicio} onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                    className="w-full px-2 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Fim</label>
                  <input type="time" value={formData.hora_fim} onChange={e => setFormData({ ...formData, hora_fim: e.target.value })}
                    className="w-full px-2 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#0f2744] transition-all text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
