'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Calendar, FileText, Activity, Quote, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const frasesMotivacionais = [
  { texto: "A Defesa Civil não é apenas uma profissão, é uma vocação de servir e proteger vidas.", autor: "Lema da Defesa Civil" },
  { texto: "Prevenir é melhor que remediar. Cada ação preventiva pode salvar inúmeras vidas.", autor: "Princípio da Proteção Civil" },
  { texto: "O trabalho em equipe é fundamental: juntos somos mais fortes para enfrentar qualquer adversidade.", autor: "Espírito de Equipe" },
  { texto: "A força de uma comunidade se mede pela sua capacidade de proteger os mais vulneráveis.", autor: "Solidariedade Social" },
  { texto: "Cada dia é uma nova oportunidade de fazer a diferença na vida de alguém.", autor: "Motivação Diária" },
  { texto: "A preparação de hoje é a segurança de amanhã. Esteja sempre pronto!", autor: "Prontidão Permanente" },
  { texto: "Servir ao próximo é a mais nobre das missões. Faça isso com amor e dedicação.", autor: "Espírito de Serviço" },
  { texto: "Em tempos de crise, heróis emergem. Você é um desses heróis todos os dias.", autor: "Reconhecimento" },
  { texto: "A resiliência não é apenas resistir, é aprender e crescer com cada desafio.", autor: "Lição de Vida" },
  { texto: "Uma comunidade bem informada é uma comunidade mais segura.", autor: "Educação Preventiva" },
  { texto: "O sucesso nasce do esforço. Continue trabalhando, os resultados virão!", autor: "Perseverança" },
  { texto: "Não há limites para quem acredita no poder de ajudar o próximo.", autor: "Fé no Trabalho" }
]

export default function DashboardPage() {
  const [fraseAtual, setFraseAtual] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setFraseAtual((prev) => (prev + 1) % frasesMotivacionais.length)
        setFadeIn(true)
      }, 400)
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    { title: 'Conversor NetCDF', description: 'Converta arquivos .nc para CSV', icon: FileSpreadsheet, href: '/dashboard/conversor' },
    { title: 'Agenda', description: 'Gerencie seus compromissos', icon: Calendar, href: '/dashboard/agenda' },
    { title: 'Memorandos', description: 'Controle de memorandos', icon: FileText, href: '/dashboard/memorandos' },
    { title: 'Sugestões', description: 'Envie suas ideias', icon: Lightbulb, href: '/dashboard/sugestoes' },
  ]

  const frase = frasesMotivacionais[fraseAtual]

  return (
    <div className="space-y-5">
      {/* Banner de Frase Motivacional */}
      <div className="bg-[#1e3a5f] rounded-xl p-4 sm:p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="w-4 h-4 text-[#e87722]" />
          <span className="text-[10px] sm:text-xs font-medium text-white/60 uppercase tracking-wide">Frase do Momento</span>
        </div>
        
        <div className={`transition-all duration-400 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm sm:text-base lg:text-lg font-medium leading-relaxed mb-2">
            "{frase.texto}"
          </p>
          <p className="text-xs text-[#e87722] font-medium">
            — {frase.autor}
          </p>
        </div>

        {/* Indicadores */}
        <div className="flex gap-1 mt-4 justify-center">
          {frasesMotivacionais.map((_, index) => (
            <button
              key={index}
              onClick={() => { setFadeIn(false); setTimeout(() => { setFraseAtual(index); setFadeIn(true); }, 200) }}
              className={`h-1 rounded-full transition-all ${
                index === fraseAtual ? 'bg-[#e87722] w-4' : 'bg-white/30 w-1 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Saudação */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#1e3a5f]">Bem-vindo, Defesa Civil</h1>
        <p className="text-xs sm:text-sm text-slate-500">Acesse os módulos do sistema abaixo.</p>
      </div>

      {/* Cards de acesso rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-lg border border-slate-200 p-4 
              hover:border-[#1e3a5f] hover:shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#e87722] transition-colors">
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-[#1e3a5f] mb-0.5">{card.title}</h2>
            <p className="text-[11px] text-slate-500">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Informações do sistema */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#e87722]" />
          <h2 className="text-sm font-semibold text-[#1e3a5f]">Informações</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Usuário</p>
            <p className="font-medium text-[#1e3a5f]">Defesa Civil</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Data</p>
            <p className="font-medium text-[#1e3a5f]">
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Versão</p>
            <p className="font-medium text-[#1e3a5f]">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
