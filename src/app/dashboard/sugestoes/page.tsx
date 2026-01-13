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
    descricao: 'Sistema de geolocalização para identificar e monitorar áreas vulneráveis a desastres naturais.',
    cor: 'bg-red-500'
  },
  {
    icon: Bell,
    titulo: 'Sistema de Alertas SMS',
    descricao: 'Envio automático de alertas por SMS para a população em caso de emergências climáticas.',
    cor: 'bg-amber-500'
  },
  {
    icon: Cloud,
    titulo: 'Integração Meteorológica',
    descricao: 'Conexão com APIs de previsão do tempo para alertas antecipados de chuvas intensas.',
    cor: 'bg-blue-500'
  },
  {
    icon: Users,
    titulo: 'Cadastro de Voluntários',
    descricao: 'Plataforma para gerenciar voluntários disponíveis para ações de resposta a emergências.',
    cor: 'bg-green-500'
  },
  {
    icon: FileText,
    titulo: 'Relatórios Automáticos',
    descricao: 'Geração automática de relatórios de ocorrências para prestação de contas.',
    cor: 'bg-purple-500'
  },
  {
    icon: Smartphone,
    titulo: 'Aplicativo Mobile',
    descricao: 'App para celular permitindo que cidadãos reportem situações de risco em tempo real.',
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
    
    // Criar link mailto
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-[#e87722]" />
            Sugestões
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Ajude-nos a melhorar o sistema da Defesa Civil de Araruna
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulário de Sugestão */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#e87722] rounded-xl">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1e3a5f]">Envie sua Ideia</h2>
                <p className="text-sm text-slate-500">Sua opinião é importante!</p>
              </div>
            </div>

            {enviado ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-green-600 mb-2">Obrigado!</h3>
                <p className="text-slate-500">Seu cliente de email será aberto para enviar a sugestão.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-medium"
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
                    placeholder="Descreva sua ideia para melhorar o sistema..."
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#e87722]/10 focus:border-[#e87722] outline-none transition-all font-medium resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#e87722] hover:bg-[#c55a0a] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Enviar Sugestão
                </button>
              </form>
            )}

            {/* Email de contato */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-2">Ou envie diretamente para:</p>
              <a 
                href="mailto:Abraaoc990@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-[#1e3a5f] font-semibold"
              >
                <Mail className="w-4 h-4" />
                Abraaoc990@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Ideias de Ferramentas */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2744] rounded-3xl p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Sparkles className="w-8 h-8 text-[#f59d4d]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ideias para o Futuro</h2>
                <p className="text-white/60">Ferramentas que podem ser implementadas</p>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Abaixo estão algumas ideias de ferramentas que podem agilizar o trabalho da 
              Defesa Civil de Araruna. Você pode votar nas que acha mais importantes ou 
              sugerir novas funcionalidades!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sugestoesIdeias.map((ideia, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${ideia.cor} rounded-xl text-white group-hover:scale-110 transition-transform`}>
                    <ideia.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1e3a5f] mb-1">{ideia.titulo}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{ideia.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-[#e87722] rounded-3xl p-8 text-white flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Zap className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">Tem outra ideia?</h3>
              <p className="text-white/80">
                Use o formulário ao lado para enviar sua sugestão. Todas as ideias serão 
                avaliadas para possível implementação!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
