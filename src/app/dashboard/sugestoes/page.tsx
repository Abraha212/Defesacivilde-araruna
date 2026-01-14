'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Lightbulb, Send, Mail, CheckCircle, Zap, Cloud, MapPin, Bell, Users, FileText, Smartphone } from 'lucide-react'

const sugestoesIdeias = [
  { icon: MapPin, titulo: 'Mapeamento de Áreas de Risco', descricao: 'Geolocalização para monitorar áreas vulneráveis.' },
  { icon: Bell, titulo: 'Sistema de Alertas SMS', descricao: 'Alertas automáticos para a população.' },
  { icon: Cloud, titulo: 'Integração Meteorológica', descricao: 'APIs de previsão do tempo.' },
  { icon: Users, titulo: 'Cadastro de Voluntários', descricao: 'Gerenciar voluntários disponíveis.' },
  { icon: FileText, titulo: 'Relatórios Automáticos', descricao: 'Geração de relatórios de ocorrências.' },
  { icon: Smartphone, titulo: 'Aplicativo Mobile', descricao: 'App para reportar situações de risco.' },
]

export default function SugestoesPage() {
  const [formData, setFormData] = useState({ nome: '', sugestao: '' })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const assunto = encodeURIComponent('Sugestão para Defesa Civil Araruna')
    const corpo = encodeURIComponent(`Nome: ${formData.nome}\n\nSugestão:\n${formData.sugestao}`)
    window.location.href = `mailto:Abraaoc990@gmail.com?subject=${assunto}&body=${corpo}`
    setEnviado(true)
    setTimeout(() => { setEnviado(false); setFormData({ nome: '', sugestao: '' }) }, 3000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f] flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#e87722]" />
          Sugestões
        </h1>
        <p className="text-xs text-slate-500">Ajude-nos a melhorar o sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulário */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg border border-slate-200 p-4 lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#1e3a5f] rounded-lg">
                <Send className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1e3a5f]">Envie sua Ideia</p>
                <p className="text-[10px] text-slate-500">Sua opinião é importante</p>
              </div>
            </div>

            {enviado ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-[#1e3a5f] mx-auto mb-2" />
                <p className="font-bold text-[#1e3a5f] text-sm">Obrigado!</p>
                <p className="text-slate-500 text-xs">Email será aberto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome" required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sugestão</label>
                  <textarea value={formData.sugestao} onChange={(e) => setFormData({ ...formData, sugestao: e.target.value })}
                    placeholder="Descreva sua ideia..." rows={4} required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#1e3a5f] hover:bg-[#0f2744] text-white font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Enviar
                </button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 mb-1">Ou envie para:</p>
              <a href="mailto:Abraaoc990@gmail.com" className="text-xs text-[#1e3a5f] font-medium hover:underline">
                Abraaoc990@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Ideias */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
          <div className="bg-[#1e3a5f] rounded-lg p-4 text-white">
            <p className="text-sm font-bold mb-1">Ideias para o Futuro</p>
            <p className="text-xs text-white/70">Ferramentas que podem ser implementadas</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sugestoesIdeias.map((ideia, index) => (
              <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 hover:border-[#1e3a5f] transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#1e3a5f] transition-colors">
                    <ideia.icon className="w-4 h-4 text-[#1e3a5f] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e3a5f] text-sm">{ideia.titulo}</p>
                    <p className="text-xs text-slate-500">{ideia.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
            <div className="p-2 bg-[#e87722] rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1e3a5f]">Tem outra ideia?</p>
              <p className="text-xs text-slate-500">Use o formulário para enviar sua sugestão!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
