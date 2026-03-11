'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, Edit2, Trash2, Image as ImageIcon, Tag, MoreHorizontal, GripVertical, Check
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Label {
  id: string
  name: string
  color: string
  textColor: string
}

interface Card {
  id: string
  title: string
  description: string
  labels: string[]
  image?: string
  createdAt: string
}

interface Column {
  id: string
  title: string
  color: string
  cards: Card[]
}

// ── Etiquetas padrão ───────────────────────────────────────────────────────
const DEFAULT_LABELS: Label[] = [
  { id: 'critico',    name: 'Crítico',          color: '#ef4444', textColor: '#fff' },
  { id: 'urgente',    name: 'Urgente',          color: '#f97316', textColor: '#fff' },
  { id: 'normal',     name: 'Normal',           color: '#3b82f6', textColor: '#fff' },
  { id: 'baixa',      name: 'Baixa Prioridade', color: '#22c55e', textColor: '#fff' },
  { id: 'revisao',    name: 'Revisão',          color: '#8b5cf6', textColor: '#fff' },
  { id: 'aguardando', name: 'Aguardando',       color: '#eab308', textColor: '#000' },
]

const COL_COLORS = ['#1e3a5f','#0891b2','#7c3aed','#059669','#dc2626','#d97706','#db2777']

// ── Colunas iniciais ───────────────────────────────────────────────────────
const INITIAL_COLUMNS: Column[] = [
  { id: 'col-1', title: 'A Fazer',       color: '#1e3a5f', cards: [] },
  { id: 'col-2', title: 'Em Andamento',  color: '#d97706', cards: [] },
  { id: 'col-3', title: 'Concluído',     color: '#059669', cards: [] },
]

const STORAGE_KEY = 'kanban_tarefas_v1'

function uid() { return `id-${Date.now()}-${Math.random().toString(36).slice(2)}` }

// ── Componente principal ───────────────────────────────────────────────────
export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([])
  const [dragging, setDragging] = useState<{ cardId: string; fromCol: string } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Modais
  const [cardModal, setCardModal] = useState<{ colId: string; card?: Card } | null>(null)
  const [colModal, setColModal]   = useState<{ col?: Column } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState<string | null>(null)

  // Form do cartão
  const [form, setForm] = useState({ title: '', description: '', labels: [] as string[], image: '' })
  const imgRef = useRef<HTMLInputElement>(null)

  // ── Persistência ────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    setColumns(saved ? JSON.parse(saved) : INITIAL_COLUMNS)
  }, [])

  const save = (cols: Column[]) => {
    setColumns(cols)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cols))
  }

  // ── Cartão: abrir modal ──────────────────────────────────────────────────
  const openNewCard = (colId: string) => {
    setForm({ title: '', description: '', labels: [], image: '' })
    setCardModal({ colId })
  }

  const openEditCard = (colId: string, card: Card) => {
    setForm({ title: card.title, description: card.description, labels: card.labels, image: card.image ?? '' })
    setCardModal({ colId, card })
  }

  // ── Cartão: salvar ───────────────────────────────────────────────────────
  const saveCard = () => {
    if (!form.title.trim() || !cardModal) return
    const cols = columns.map(col => {
      if (col.id !== cardModal.colId) return col
      if (cardModal.card) {
        return { ...col, cards: col.cards.map(c => c.id === cardModal.card!.id
          ? { ...c, title: form.title, description: form.description, labels: form.labels, image: form.image }
          : c) }
      }
      const newCard: Card = {
        id: uid(), title: form.title, description: form.description,
        labels: form.labels, image: form.image, createdAt: new Date().toISOString()
      }
      return { ...col, cards: [...col.cards, newCard] }
    })
    save(cols)
    setCardModal(null)
  }

  // ── Cartão: deletar ──────────────────────────────────────────────────────
  const deleteCard = (colId: string, cardId: string) => {
    save(columns.map(col => col.id === colId
      ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
      : col))
  }

  // ── Coluna: salvar ───────────────────────────────────────────────────────
  const [colForm, setColForm] = useState({ title: '', color: COL_COLORS[0] })

  const openNewCol = () => { setColForm({ title: '', color: COL_COLORS[0] }); setColModal({}) }
  const openEditCol = (col: Column) => { setColForm({ title: col.title, color: col.color }); setColModal({ col }) }

  const saveCol = () => {
    if (!colForm.title.trim()) return
    if (colModal?.col) {
      save(columns.map(c => c.id === colModal.col!.id ? { ...c, title: colForm.title, color: colForm.color } : c))
    } else {
      save([...columns, { id: uid(), title: colForm.title, color: colForm.color, cards: [] }])
    }
    setColModal(null)
  }

  const deleteCol = (colId: string) => {
    if (!confirm('Deletar esta coluna e todos os seus cartões?')) return
    save(columns.filter(c => c.id !== colId))
    setColMenuOpen(null)
  }

  // ── Imagem ───────────────────────────────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const toggleLabel = (id: string) =>
    setForm(f => ({ ...f, labels: f.labels.includes(id) ? f.labels.filter(l => l !== id) : [...f.labels, id] }))

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const onDragStart = (cardId: string, fromCol: string) => setDragging({ cardId, fromCol })
  const onDragEnd   = () => { setDragging(null); setDragOver(null) }

  const onDrop = (toColId: string) => {
    if (!dragging || dragging.fromCol === toColId) { setDragOver(null); return }
    const fromCol = columns.find(c => c.id === dragging.fromCol)
    const card    = fromCol?.cards.find(c => c.id === dragging.cardId)
    if (!card) return
    save(columns.map(col => {
      if (col.id === dragging.fromCol) return { ...col, cards: col.cards.filter(c => c.id !== dragging.cardId) }
      if (col.id === toColId)          return { ...col, cards: [...col.cards, card] }
      return col
    }))
    setDragOver(null)
  }

  const labelMap = Object.fromEntries(DEFAULT_LABELS.map(l => [l.id, l]))

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Organização e Tarefas</h1>
          <p className="text-xs text-slate-500">{columns.reduce((n, c) => n + c.cards.length, 0)} cartões · {columns.length} colunas</p>
        </div>
        <button onClick={openNewCol}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#0f2744] text-white rounded-lg text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Nova Coluna
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
        {columns.map(col => (
          <div key={col.id}
            className={`flex-shrink-0 w-72 rounded-xl flex flex-col transition-all ${dragOver === col.id ? 'ring-2 ring-[#e87722]' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDrop={() => onDrop(col.id)}
          >
            {/* Cabeçalho da coluna */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl"
              style={{ backgroundColor: col.color }}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{col.title}</span>
                <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{col.cards.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openNewCard(col.id)}
                  className="p-1 hover:bg-white/20 rounded text-white transition-colors">
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

            {/* Cartões */}
            <div className="bg-slate-100 rounded-b-xl p-2 flex flex-col gap-2 min-h-[80px]">
              {col.cards.map(card => (
                <div key={card.id}
                  draggable
                  onDragStart={() => onDragStart(card.id, col.id)}
                  onDragEnd={onDragEnd}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                >
                  {/* Imagem */}
                  {card.image && (
                    <img src={card.image} alt="" className="w-full h-32 object-cover rounded-t-lg" />
                  )}

                  <div className="p-3">
                    {/* Etiquetas */}
                    {card.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map(lid => labelMap[lid] && (
                          <span key={lid} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: labelMap[lid].color, color: labelMap[lid].textColor }}>
                            {labelMap[lid].name}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm font-semibold text-slate-800 leading-snug">{card.title}</p>

                    {card.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.description}</p>
                    )}

                    {/* Ações */}
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

              {/* Botão adicionar cartão */}
              <button onClick={() => openNewCard(col.id)}
                className="flex items-center gap-2 w-full px-2 py-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg text-xs font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar cartão
              </button>
            </div>
          </div>
        ))}

        {/* Botão nova coluna (inline) */}
        <button onClick={openNewCol}
          className="flex-shrink-0 w-72 h-14 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Coluna
        </button>
      </div>

      {/* ── Modal Cartão ──────────────────────────────────────────────────── */}
      {cardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCardModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#1e3a5f] px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white">{cardModal.card ? 'Editar Cartão' : 'Novo Cartão'}</h3>
              <button onClick={() => setCardModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100"
                  placeholder="Título do cartão" autoFocus />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder="Descrição detalhada..." />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_LABELS.map(label => {
                    const selected = form.labels.includes(label.id)
                    return (
                      <button key={label.id} onClick={() => toggleLabel(label.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={{
                          backgroundColor: selected ? label.color : 'transparent',
                          color: selected ? label.textColor : label.color,
                          borderColor: label.color,
                        }}>
                        {selected && <Check className="w-3 h-3" />}
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Imagem (opcional)
                </label>
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} alt="" className="w-full h-40 object-cover rounded-lg" />
                    <button onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imgRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs">Clique para adicionar imagem</span>
                  </button>
                )}
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setCardModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={saveCard} disabled={!form.title.trim()}
                  className="flex-1 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#0f2744] text-sm transition-colors disabled:opacity-40">
                  {cardModal.card ? 'Salvar' : 'Criar Cartão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Coluna ──────────────────────────────────────────────────── */}
      {colModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setColModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#1e3a5f] px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white">{colModal.col ? 'Editar Coluna' : 'Nova Coluna'}</h3>
              <button onClick={() => setColModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome da Coluna *</label>
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
                <button onClick={() => setColModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 text-sm">
                  Cancelar
                </button>
                <button onClick={saveCol} disabled={!colForm.title.trim()}
                  className="flex-1 py-2.5 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-40"
                  style={{ backgroundColor: colForm.color }}>
                  {colModal.col ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fecha menu de coluna ao clicar fora */}
      {colMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setColMenuOpen(null)} />
      )}
    </div>
  )
}
