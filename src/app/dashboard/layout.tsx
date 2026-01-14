'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calendar, 
  FileText, 
  LogOut,
  User as UserIcon,
  Lightbulb,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversor NetCDF', href: '/dashboard/conversor', icon: FileSpreadsheet },
  { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  { name: 'Memorandos', href: '/dashboard/memorandos', icon: FileText },
  { name: 'Sugestões', href: '/dashboard/sugestoes', icon: Lightbulb },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
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
      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:fixed left-0 top-0 bottom-0 z-50
        w-72 bg-[#1e3a5f] text-white
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 lg:p-6 border-b border-white/10">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-xl p-2 flex items-center justify-center flex-shrink-0">
              <img 
                src="/images/logo-prefeitura.png" 
                alt="Brasão"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-base lg:text-lg leading-tight">DEFESA CIVIL</h1>
              <p className="text-xs text-[#f59d4d]">ARARUNA / PB</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-2 rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#e87722] text-white font-semibold' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm lg:text-base">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 lg:p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-white/70 hover:bg-red-500/20 hover:text-red-300
              transition-all duration-200 text-sm lg:text-base"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        </div>

        {/* Rodapé com crédito */}
        <div className="px-4 py-3 border-t border-white/10 text-center">
          <p className="text-[10px] text-white/40">Desenvolvido por</p>
          <p className="text-xs font-semibold text-[#f59d4d]">Abraham Câmara</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-72">
        {/* Header */}
        <header className="h-14 lg:h-16 bg-white border-b border-slate-200 
          flex items-center justify-between px-4 lg:px-6
          sticky top-0 z-30">
          
          {/* Botão Menu Mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Data - escondida em mobile pequeno */}
          <p className="hidden sm:block text-sm text-slate-500 capitalize">
            {formatDate()}
          </p>

          {/* Logo mobile centralizada */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg p-1 flex items-center justify-center">
              <img 
                src="/images/logo-prefeitura.png" 
                alt="Brasão"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[#1e3a5f] text-sm">Defesa Civil</span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-[#1e3a5f]">Defesa Civil</p>
              <p className="text-xs text-slate-400">Acesso Administrativo</p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </header>

        {/* Botão fechar menu mobile */}
        {mobileMenuOpen && (
          <button
            onClick={closeMobileMenu}
            className="fixed top-4 right-4 z-50 lg:hidden
              w-10 h-10 bg-white rounded-full shadow-lg
              flex items-center justify-center
              text-slate-600 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
