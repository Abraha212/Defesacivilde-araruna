'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Calendar, FileText, Activity, Quote, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Frases motivacionais sobre trabalho e defesa civil
const frasesMotivacionais = [
  {
    texto: "A Defesa Civil não é apenas uma profissão, é uma vocação de servir e proteger vidas.",
    autor: "Lema da Defesa Civil"
  },
  {
    texto: "Prevenir é melhor que remediar. Cada ação preventiva pode salvar inúmeras vidas.",
    autor: "Princípio da Proteção Civil"
  },
  {
    texto: "O trabalho em equipe é fundamental: juntos somos mais fortes para enfrentar qualquer adversidade.",
    autor: "Espírito de Equipe"
  },
  {
    texto: "A força de uma comunidade se mede pela sua capacidade de proteger os mais vulneráveis.",
    autor: "Solidariedade Social"
  },
  {
    texto: "Cada dia é uma nova oportunidade de fazer a diferença na vida de alguém.",
    autor: "Motivação Diária"
  },
  {
    texto: "A preparação de hoje é a segurança de amanhã. Esteja sempre pronto!",
    autor: "Prontidão Permanente"
  },
  {
    texto: "Servir ao próximo é a mais nobre das missões. Faça isso com amor e dedicação.",
    autor: "Espírito de Serviço"
  },
  {
    texto: "Em tempos de crise, heróis emergem. Você é um desses heróis todos os dias.",
    autor: "Reconhecimento"
  },
  {
    texto: "A resiliência não é apenas resistir, é aprender e crescer com cada desafio.",
    autor: "Lição de Vida"
  },
  {
    texto: "Uma comunidade bem informada é uma comunidade mais segura.",
    autor: "Educação Preventiva"
  },
  {
    texto: "O sucesso nasce do esforço. Continue trabalhando, os resultados virão!",
    autor: "Perseverança"
  },
  {
    texto: "Não há limites para quem acredita no poder de ajudar o próximo.",
    autor: "Fé no Trabalho"
  }
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
      }, 500)
    }, 20000) // Troca a cada 20 segundos

    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      title: 'Conversor NetCDF',
      description: 'Converta arquivos .nc para CSV ou Excel',
      icon: FileSpreadsheet,
      href: '/dashboard/conversor',
      color: 'bg-[#2d5a87]',
    },
    {
      title: 'Agenda',
      description: 'Gerencie seus compromissos',
      icon: Calendar,
      href: '/dashboard/agenda',
      color: 'bg-[#e87722]',
    },
    {
      title: 'Memorandos',
      description: 'Controle de memorandos numerados',
      icon: FileText,
      href: '/dashboard/memorandos',
      color: 'bg-[#059669]',
    },
  ]

  const frase = frasesMotivacionais[fraseAtual]

  return (
    <div>
      {/* Banner de Frase Motivacional */}
      <div className="mb-8 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f] rounded-2xl p-8 text-white relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#e87722] rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/70">Frase do Momento</span>
          </div>
          
          <div 
            className={`transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            <div className="flex items-start gap-4">
              <Quote className="w-10 h-10 text-[#f59d4d] flex-shrink-0 mt-1" />
              <div>
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-3">
                  {frase.texto}
                </p>
                <p className="text-sm text-[#f59d4d] font-semibold">
                  — {frase.autor}
                </p>
              </div>
            </div>
          </div>

          {/* Indicadores de frase */}
          <div className="flex gap-2 mt-6 justify-center">
            {frasesMotivacionais.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setFadeIn(false)
                  setTimeout(() => {
                    setFraseAtual(index)
                    setFadeIn(true)
                  }, 300)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === fraseAtual 
                    ? 'bg-[#e87722] w-6' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Bem-vindo, Defesa Civil
        </h1>
        <p className="text-[#6b7280] mt-1">
          Acesse os módulos do sistema através dos atalhos abaixo.
        </p>
      </div>

      {/* Cards de acesso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-white rounded-lg border border-[#d1d5db] p-6 hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-1">
              {card.title}
            </h2>
            <p className="text-sm text-[#6b7280]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Informações do sistema */}
      <div className="bg-white rounded-lg border border-[#d1d5db] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[#e87722]" />
          <h2 className="text-lg font-semibold text-[#1e3a5f]">
            Informações do Sistema
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Usuário conectado</p>
            <p className="font-medium text-[#1e3a5f]">Defesa Civil</p>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Data atual</p>
            <p className="font-medium text-[#1e3a5f]">
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'long'
              }).format(new Date())}
            </p>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Versão do sistema</p>
            <p className="font-medium text-[#1e3a5f]">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
