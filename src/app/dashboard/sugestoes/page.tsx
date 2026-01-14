'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { 
  Lightbulb, 
  Send, 
  Mail, 
  CheckCircle, 
  Sparkles,
  Zap,
  Cloud,
  MapPin,
  Bell,
  Users,
  FileText,
  Smartphone
} from 'lucide-react'

const sugestoesIdeias = [
  {
    icon: MapPin,
    titulo: 'Mapeamento de Áreas de Risco',
    descricao: 'Sistema de geolocalização para identificar e monitorar áreas vulneráveis.',
    cor: 'bg-red-500'
  },
  {
    icon: Bell,
    titulo: 'Sistema de Alertas SMS',
    descricao: 'Envio automático de alertas por SMS para a população.',
    cor: 'bg-amber-500'
  },
  {
    icon: Cloud,
    titulo: 'Integração Meteorológica',
    descricao: 'Conexão com APIs de previsão do tempo para alertas antecipados.',
    cor: 'bg-blue-500'
  },
  {
    icon: Users,
    titulo: 'Cadastro de Voluntários',
    descricao: 'Plataforma para gerenciar voluntários disponíveis.',
    cor: 'bg-green-500'
  },
  {
    icon: FileText,
    titulo: 'Relatórios Automáticos',
    descricao: 'Geração automática de relatórios de ocorrências.',
    cor: 'bg-purple-500'
  },
  {
    icon: Smartphone,
    titulo: 'Aplicativo Mobile',
    descricao: 'App para cidadãos reportarem situações de risco.',
    cor: 'bg-indigo-500'
  },
]

export default function SugestoesPage() {
  const [formData, setFormData] = useState({
    nome: '',
    sugestao: ''
  })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const assunto = encodeURIComponent('Sugestão para Defesa Civil Araruna')
    const corpo = encodeURIComponent(
      `Nome: ${formData.nome}\n\nSugestão:\n${formData.sugestao}`
    )
    
    window.location.href = `mailto:Abraaoc990@gmail.com?subject=${assunto}&body=${corpo}`
    
    setEnviado(true)
    setTimeout(() => {
      setEnviado(false)
      setFormData({ nome: '', sugestao: '' })
    }, 3000)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1e3a5f] tracking-tight flex items-center gap-2 sm:gap-3">
          <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-[#e87722]" />
          Sugestões
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
          Ajude-nos a melhorar o sistema da Defesa Civil
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Formulário de Sugestão */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-slate-100 lg:sticky lg:top-8">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-[#e87722] rounded-xl">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1e3a5f]">Envie sua Ideia</h2>
                <p className="text-xs sm:text-sm text-slate-500">Sua opinião é importante!</p>
              </div>
            </div>

            {enviado ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-green-600 mb-2">Obrigado!</h3>
                <p className="text-slate-500 text-sm">Seu cliente de email será aberto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-medium text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">
                    Sua Sugestão
                  </label>
                  <textarea
                    value={formData.sugestao}
                    onChange={(e) => setFormData({ ...formData, sugestao: e.target.value })}
                    placeholder="Descreva sua ideia..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-medium resize-none text-sm sm:text-base"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-[#e87722] hover:bg-[#c55a0a] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  Enviar Sugestão
                </button>
              </form>
            )}

            {/* Email de contato */}
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-500 mb-2">Ou envie diretamente para:</p>
              <a 
                href="mailto:Abraaoc990@gmail.com"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-[#1e3a5f] font-semibold text-xs sm:text-sm"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Abraaoc990@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Ideias de Ferramentas */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 lg:order-2">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2744] rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 text-white">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-white/10 rounded-xl">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#f59d4d]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Ideias para o Futuro</h2>
                <p className="text-white/60 text-xs sm:text-sm">Ferramentas que podem ser implementadas</p>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed text-sm sm:text-base">
              Abaixo estão algumas ideias de ferramentas que podem agilizar o trabalho da 
              Defesa Civil de Araruna!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {sugestoesIdeias.map((ideia, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-slate-100 hover:shadow-lg active:scale-[0.98] transition-all group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 ${ideia.cor} rounded-xl text-white group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <ideia.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1e3a5f] mb-1 text-sm sm:text-base">{ideia.titulo}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{ideia.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-[#e87722] rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold mb-1">Tem outra ideia?</h3>
              <p className="text-white/80 text-sm sm:text-base">
                Use o formulário para enviar sua sugestão. Todas serão avaliadas!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
