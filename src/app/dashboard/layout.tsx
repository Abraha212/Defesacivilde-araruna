'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileSpreadsheet,
  Calendar,
  FileText,
  LogOut,
  User as UserIcon,
  Lightbulb,
  Menu,
  X,
  CloudSun,
} from 'lucide-react'

const API_KEY = 'bc0cece113b11c16542b1debc26da0c6'
const CITY    = 'Araruna,BR'

function weatherEmoji(id: number): string {
  if (id >= 200 && id < 300) return '⛈️'
  if (id >= 300 && id < 400) return '🌦️'
  if (id >= 500 && id < 600) return '🌧️'
  if (id >= 600 && id < 700) return '❄️'
  if (id >= 700 && id < 800) return '🌫️'
  if (id === 800)             return '☀️'
  if (id === 801)             return '🌤️'
  if (id === 802)             return '⛅'
  return '☁️'
}

const menuItems = [
  { name: 'Painel',           href: '/dashboard',                  icon: LayoutDashboard },
  { name: 'Conversor NetCDF', href: '/dashboard/conversor',        icon: FileSpreadsheet },
  { name: 'Previsão do Tempo',href: '/dashboard/previsao-tempo',   icon: CloudSun },
  { name: 'Agenda',           href: '/dashboard/agenda',           icon: Calendar },
  { name: 'Memorandos',       href: '/dashboard/memorandos',       icon: FileText },
  { name: 'Sugestões',        href: '/dashboard/sugestoes',        icon: Lightbulb },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [weather, setWeather] = useState<{ temp: number; id: number; desc: string } | null>(null)

  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=pt_br`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setWeather({ temp: Math.round(d.main.temp), id: d.weather[0].id, desc: d.weather[0].description })
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    }
  }

  const formatDate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:fixed left-0 top-0 bottom-0 z-50
        w-64 bg-[#1e3a5f] text-white
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 lg:p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
              <img src="/images/logo-prefeitura.png" alt="Brasão" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm lg:text-base leading-tight">DEFESA CIVIL</h1>
              <p className="text-xs text-[#e87722] font-medium">ARARUNA / PB</p>
            </div>
          </div>
        </div>

        {/* Widget de clima */}
        {weather && (
          <Link href="/dashboard/previsao-tempo" onClick={closeMobileMenu}
            className="mx-3 mt-3 flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-2.5 cursor-pointer">
            <span className="text-3xl leading-none">{weatherEmoji(weather.id)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold leading-none">{weather.temp}°C</p>
              <p className="text-white/60 text-xs capitalize truncate">{weather.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px]">Araruna</p>
              <p className="text-white/50 text-[10px]">PB</p>
            </div>
          </Link>
        )}

        {/* Menu */}
        <nav className="flex-1 p-3 overflow-y-auto mt-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`
                  flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg
                  transition-all duration-200 text-sm
                  ${isActive
                    ? 'bg-white text-[#1e3a5f] font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-[#e87722] rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-white/70 hover:bg-white/10 hover:text-white
              transition-all duration-200 text-sm"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>

        {/* Rodapé */}
        <div className="px-3 py-2.5 border-t border-white/10 text-center">
          <p className="text-[9px] text-white/40">Desenvolvido por</p>
          <p className="text-[10px] font-medium text-[#e87722]">Offnen Soluções e Desenvolvimento</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#1e3a5f] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <p className="hidden sm:block text-xs text-slate-500 capitalize">{formatDate()}</p>

          <div className="lg:hidden flex items-center gap-2">
            <span className="font-bold text-[#1e3a5f] text-sm">Defesa Civil</span>
          </div>

          {/* Clima no header (mobile) */}
          <div className="flex items-center gap-3">
            {weather && (
              <Link href="/dashboard/previsao-tempo"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors">
                <span>{weatherEmoji(weather.id)}</span>
                <span className="font-semibold text-[#1e3a5f]">{weather.temp}°C</span>
                <span className="text-slate-400 text-xs capitalize hidden md:block">{weather.desc}</span>
              </Link>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-[#1e3a5f]">Defesa Civil</p>
              <p className="text-[10px] text-slate-400">Administrador</p>
            </div>
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <button
            onClick={closeMobileMenu}
            className="fixed top-3 right-3 z-50 lg:hidden w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <main className="flex-1 p-4 lg:p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
