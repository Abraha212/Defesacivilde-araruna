'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, X, Edit2, Trash2, Image as ImageIcon, Tag, MoreHorizontal, GripVertical, Check, Loader2, RefreshCw
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Label  { id: string; name: string; color: string; textColor: string }
interface Card   { id: string; coluna_id: string; titulo: string; descricao: string; etiquetas: string[]; imagem?: string; ordem: number }
interface Column { id: string; titulo: string; cor: string; ordem: number; kanban_cards: Card[] }

const DEFAULT_LABELS: Label[] = [
  { id: 'critico',    name: 'Crítico',          color: '#ef4444', textColor: '#fff' },
  { id: 'urgente',    name: 'Urgente',          color: '#f97316', textColor: '#fff' },
  { id: 'normal',     name: 'Normal',           color: '#3b82f6', textColor: '#fff' },
  { id: 'baixa',      name: 'Baixa Prioridade', color: '#22c55e', textColor: '#fff' },
  { id: 'revisao',    name: 'Revisão',          color: '#8b5cf6', textColor: '#fff' },
  { id: 'aguardando', name: 'Aguardando',       color: '#eab308', textColor: '#000' },
]

const COL_COLORS = ['#1e3a5f','#0891b2','#7c3aed','#059669','#dc2626','#d97706','#db2777']
const STORAGE_KEY = 'kanban_tarefas_v1'

const INITIAL_COLUMNS = [
  { id: 'col-1', titulo: 'A Fazer',      cor: '#1e3a5f', ordem: 0, kanban_cards: [] },
  { id: 'col-2', titulo: 'Em Andamento', cor: '#d97706', ordem: 1, kanban_cards: [] },
  { id: 'col-3', titulo: 'Concluído',    cor: '#059669', ordem: 2, kanban_cards: [] },
]

function uid() { return `local-${Date.now()}-${Math.random().toString(36).slice(2)}` }

export default function KanbanPage() {
  const [columns,    setColumns]    = useState<Column[]>([])
  const [loading,    setLoading]    = useState(true)
  const [useLocal,   setUseLocal]   = useState(false)
  const [dragging,   setDragging]   = useState<{ cardId: string; fromCol: string } | null>(null)
  const [dragOver,   setDragOver]   = useState<string | null>(null)
  const [cardModal,  setCardModal]  = useState<{ colId: string; card?: Card } | null>(null)
  const [colModal,   setColModal]   = useState<{ col?: Column } | null>(null)
  const [colMenuOpen,setColMenuOpen]= useState<string | null>(null)
  const [form,       setForm]       = useState({ title: '', description: '', labels: [] as string[], image: '' })
  const [colForm,    setColForm]    = useState({ title: '', color: COL_COLORS[0] })
  const imgRef = useRef<HTMLInputElement>(null)

  // ── Persistência local ────────────────────────────────────────────────
  const saveLocal = (cols: Column[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cols))
    setColumns(cols)
  }

  const loadLocal = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    setColumns(saved ? JSON.parse(saved) : INITIAL_COLUMNS)
    setUseLocal(true)
  }

  // ── Carregar do Supabase ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kanban/colunas')
      const result = await res.json()
      if (result.needsSetup || result.error) {
        loadLocal()
      } else if (result.data && result.data.length > 0) {
        setColumns(result.data)
        setUseLocal(false)
      } else if (result.data && result.data.length === 0) {
        // Banco ok mas vazio — criar colunas padrão
        await createDefaultColumns()
      }
    } catch {
      loadLocal()
    }
    setLoading(false)
  }, [])

  const createDefaultColumns = async () => {
    const defaults = [
      { titulo: 'A Fazer',      cor: '#1e3a5f', ordem: 0 },
      { titulo: 'Em Andamento', cor: '#d97706', ordem: 1 },
      { titulo: 'Concluído',    cor: '#059669', ordem: 2 },
    ]
    for (const col of defaults) {
      await fetch('/api/kanban/colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(col),
      })
    }
    await loadData()
  }

  useEffect(() => { loadData() }, [loadData])

  // ── Coluna: abrir modais ───────────────────────────────────────────────
  const openNewCol  = () => { setColForm({ title: '', color: COL_COLORS[0] }); setColModal({}) }
  const openEditCol = (col: Column) => { setColForm({ title: col.titulo, color: col.cor }); setColModal({ col }) }

  const saveCol = async () => {
    if (!colForm.title.trim()) return
    if (useLocal) {
      if (colModal?.col) {
        saveLocal(columns.map(c => c.id === colModal.col!.id ? { ...c, titulo: colForm.title, cor: colForm.color } : c))
      } else {
        saveLocal([...columns, { id: uid(), titulo: colForm.title, cor: colForm.color, ordem: columns.length, kanban_cards: [] }])
      }
      setColModal(null); return
    }
    if (colModal?.col) {
      await fetch('/api/kanban/colunas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: colModal.col.id, titulo: colForm.title, cor: colForm.color }),
      })
    } else {
      await fetch('/api/kanban/colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: colForm.title, cor: colForm.color, ordem: columns.length }),
      })
    }
    setColModal(null)
    await loadData()
  }

  const deleteCol = async (colId: string) => {
    if (!confirm('Deletar esta coluna e todos os seus cartões?')) return
    setColMenuOpen(null)
    if (useLocal) { saveLocal(columns.filter(c => c.id !== colId)); return }
    await fetch(`/api/kanban/colunas?id=${colId}`, { method: 'DELETE' })
    await loadData()
  }

  // ── Cartão: abrir modais ───────────────────────────────────────────────
  const openNewCard  = (colId: string) => { setForm({ title: '', description: '', labels: [], image: '' }); setCardModal({ colId }) }
  const openEditCard = (colId: string, card: Card) => {
    setForm({ title: card.titulo, description: card.descricao, labels: card.etiquetas, image: card.imagem ?? '' })
    setCardModal({ colId, card })
  }

  const saveCard = async () => {
    if (!form.title.trim() || !cardModal) return
    if (useLocal) {
      const cols = columns.map(col => {
        if (col.id !== cardModal.colId) return col
        if (cardModal.card) {
          return { ...col, kanban_cards: col.kanban_cards.map(c => c.id === cardModal.card!.id
            ? { ...c, titulo: form.title, descricao: form.description, etiquetas: form.labels, imagem: form.image }
            : c) }
        }
        const nc: Card = { id: uid(), coluna_id: col.id, titulo: form.title, descricao: form.description, etiquetas: form.labels, imagem: form.image, ordem: col.kanban_cards.length }
        return { ...col, kanban_cards: [...col.kanban_cards, nc] }
      })
      saveLocal(cols); setCardModal(null); return
    }
    if (cardModal.card) {
      await fetch('/api/kanban/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cardModal.card.id, titulo: form.title, descricao: form.description, etiquetas: form.labels, imagem: form.image || null }),
      })
    } else {
      const col = columns.find(c => c.id === cardModal.colId)
      await fetch('/api/kanban/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coluna_id: cardModal.colId, titulo: form.title, descricao: form.description, etiquetas: form.labels, imagem: form.image || null, ordem: col?.kanban_cards.length ?? 0 }),
      })
    }
    setCardModal(null)
    await loadData()
  }

  const deleteCard = async (colId: string, cardId: string) => {
    if (useLocal) {
      saveLocal(columns.map(col => col.id === colId ? { ...col, kanban_cards: col.kanban_cards.filter(c => c.id !== cardId) } : col))
      return
    }
    await fetch(`/api/kanban/cards?id=${cardId}`, { method: 'DELETE' })
    await loadData()
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────
  const onDragStart = (cardId: string, fromCol: string) => setDragging({ cardId, fromCol })
  const onDragEnd   = () => { setDragging(null); setDragOver(null) }

  const onDrop = async (toColId: string) => {
    if (!dragging || dragging.fromCol === toColId) { setDragOver(null); return }
    const fromCol = columns.find(c => c.id === dragging.fromCol)
    const card    = fromCol?.kanban_cards.find(c => c.id === dragging.cardId)
    if (!card) return
    // Atualiza UI imediatamente (otimista)
    setColumns(prev => prev.map(col => {
      if (col.id === dragging.fromCol) return { ...col, kanban_cards: col.kanban_cards.filter(c => c.id !== card.id) }
      if (col.id === toColId)          return { ...col, kanban_cards: [...col.kanban_cards, { ...card, coluna_id: toColId }] }
      return col
    }))
    setDragOver(null)
    if (!useLocal) {
      await fetch('/api/kanban/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card.id, coluna_id: toColId }),
      })
    } else {
      const updated = columns.map(col => {
        if (col.id === dragging.fromCol) return { ...col, kanban_cards: col.kanban_cards.filter(c => c.id !== card.id) }
        if (col.id === toColId)          return { ...col, kanban_cards: [...col.kanban_cards, { ...card, coluna_id: toColId }] }
        return col
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  }

  const toggleLabel = (id: string) =>
    setForm(f => ({ ...f, labels: f.labels.includes(id) ? f.labels.filter(l => l !== id) : [...f.labels, id] }))

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const labelMap = Object.fromEntries(DEFAULT_LABELS.map(l => [l.id, l]))
  const totalCards = columns.reduce((n, c) => n + c.kanban_cards.length, 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Carregando quadro...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Organização e Tarefas</h1>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            {totalCards} cartões · {columns.length} colunas
            {useLocal && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Modo local</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 text-slate-400 hover:text-[#1e3a5f] hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openNewCol}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#0f2744] text-white rounded-lg text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" /> Nova Coluna
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
        {columns.map(col => (
          <div key={col.id}
            className={`flex-shrink-0 w-72 rounded-xl flex flex-col transition-all ${dragOver === col.id ? 'ring-2 ring-[#e87722]' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDrop={() => onDrop(col.id)}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl" style={{ backgroundColor: col.cor }}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{col.titulo}</span>
                <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{col.kanban_cards.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openNewCard(col.id)} className="p-1 hover:bg-white/20 rounded text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button onClick={() => setColMenuOpen(colMenuOpen === col.id ? null : col.id)}
                    className="p-1 hover:bg-white/20 rounded text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {colMenuOpen === col.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-36">
                      <button onClick={() => { openEditCol(col); setColMenuOpen(null) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Edit2 className="w-3.5 h-3.5" /> Renomear
                      </button>
                      <button onClick={() => deleteCol(col.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Deletar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="bg-slate-100 rounded-b-xl p-2 flex flex-col gap-2 min-h-[80px]">
              {col.kanban_cards.map(card => (
                <div key={card.id} draggable
                  onDragStart={() => onDragStart(card.id, col.id)}
                  onDragEnd={onDragEnd}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
                  {card.imagem && <img src={card.imagem} alt="" className="w-full h-32 object-cover rounded-t-lg" />}
                  <div className="p-3">
                    {card.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.etiquetas.map(lid => labelMap[lid] && (
                          <span key={lid} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: labelMap[lid].color, color: labelMap[lid].textColor }}>
                            {labelMap[lid].name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{card.titulo}</p>
                    {card.descricao && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.descricao}</p>}
                    <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditCard(col.id, card)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1e3a5f] transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCard(col.id, card.id)}
                        className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => openNewCard(col.id)}
                className="flex items-center gap-2 w-full px-2 py-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg text-xs font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar cartão
              </button>
            </div>
          </div>
        ))}

        <button onClick={openNewCol}
          className="flex-shrink-0 w-72 h-14 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Coluna
        </button>
      </div>

      {/* ── Modal Cartão ─────────────────────────────────────────────── */}
      {cardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCardModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1e3a5f] px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white">{cardModal.card ? 'Editar Cartão' : 'Novo Cartão'}</h3>
              <button onClick={() => setCardModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100"
                  placeholder="Título do cartão" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder="Descrição detalhada..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_LABELS.map(label => {
                    const selected = form.labels.includes(label.id)
                    return (
                      <button key={label.id} onClick={() => toggleLabel(label.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={{ backgroundColor: selected ? label.color : 'transparent', color: selected ? label.textColor : label.color, borderColor: label.color }}>
                        {selected && <Check className="w-3 h-3" />}{label.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Imagem (opcional)</label>
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} alt="" className="w-full h-40 object-cover rounded-lg" />
                    <button onClick={() => setForm(f => ({ ...f, image: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => imgRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors">
                    <ImageIcon className="w-6 h-6" /><span className="text-xs">Clique para adicionar imagem</span>
                  </button>
                )}
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setCardModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 text-sm">Cancelar</button>
                <button onClick={saveCard} disabled={!form.title.trim()} className="flex-1 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#0f2744] text-sm disabled:opacity-40">
                  {cardModal.card ? 'Salvar' : 'Criar Cartão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Coluna ─────────────────────────────────────────────── */}
      {colModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setColModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1e3a5f] px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white">{colModal.col ? 'Editar Coluna' : 'Nova Coluna'}</h3>
              <button onClick={() => setColModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
                <input value={colForm.title} onChange={e => setColForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100"
                  placeholder="Ex: Em Revisão" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COL_COLORS.map(c => (
                    <button key={c} onClick={() => setColForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full border-4 transition-all"
                      style={{ backgroundColor: c, borderColor: colForm.color === c ? '#e87722' : 'transparent' }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setColModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 text-sm">Cancelar</button>
                <button onClick={saveCol} disabled={!colForm.title.trim()}
                  className="flex-1 py-2.5 text-white font-bold rounded-lg text-sm disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: colForm.color }}>
                  {colModal.col ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {colMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setColMenuOpen(null)} />}
    </div>
  )
}
