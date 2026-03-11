'use client'

import { Download, Monitor, CheckCircle2, FileSpreadsheet, Archive, BarChart2, WifiOff } from 'lucide-react'

export default function ConversorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-[#1e3a5f] rounded-2xl flex items-center justify-center shadow-lg">
          <FileSpreadsheet className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Conversor NetCDF</h1>
          <p className="text-slate-500">Converta arquivos .nc para CSV, Excel ou XML</p>
        </div>
      </div>

      {/* Card principal de download */}
      <div className="bg-[#1e3a5f] rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Software Desktop</h2>
            <p className="text-white/60 text-sm">Windows 10 / 11 — Não precisa instalar nada</p>
          </div>
        </div>

        <a
          href="/downloads/ConversorNetCDF.exe"
          download
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#e87722] hover:bg-[#d06a1a] text-white rounded-xl font-bold text-lg transition-colors"
        >
          <Download className="w-6 h-6" />
          Baixar ConversorNetCDF.exe
        </a>

        <p className="text-center text-white/40 text-xs mt-3">
          Basta baixar e dar duplo clique — sem instalação
        </p>
      </div>

      {/* Funcionalidades */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="font-bold text-[#1e3a5f] mb-4">O que o software faz</h3>
        <ul className="space-y-3">
          {[
            { icon: FileSpreadsheet, text: 'Converte .nc para CSV, Excel (.xlsx) ou XML' },
            { icon: Archive,         text: 'Processa vários arquivos de uma vez (lote)' },
            { icon: BarChart2,       text: 'Calcula média anual automaticamente (resumo)' },
            { icon: Archive,         text: 'Unifica múltiplos arquivos em um único CSV' },
            { icon: WifiOff,         text: 'Funciona offline — sem internet' },
          ].map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#1e3a5f]" />
              </div>
              <span className="text-slate-700 text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Requisitos */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800">
          <p className="font-bold mb-1">Sem limite de tamanho</p>
          <p className="text-emerald-700">Suporta arquivos de 3 GB, 4 GB ou mais. Processamento em lote com log em tempo real.</p>
        </div>
      </div>
    </div>
  )
}
