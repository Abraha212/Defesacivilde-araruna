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
  X,
  Database
} from 'lucide-react'

const menuItems = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversor NetCDF', href: '/dashboard/conversor', icon: FileSpreadsheet },
  { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  { name: 'Memorandos', href: '/dashboard/memorandos', icon: FileText },
  { name: 'Sugestões', href: '/dashboard/sugestoes', icon: Lightbulb },
  { name: 'Banco de Dados', href: '/setup', icon: Database },
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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
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
              <img 
                src="/images/logo-prefeitura.png" 
                alt="Brasão"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-sm lg:text-base leading-tight">DEFESA CIVIL</h1>
              <p className="text-xs text-[#e87722] font-medium">ARARUNA / PB</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 overflow-y-auto">
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
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-[#e87722] rounded-full" />
                )}
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

        {/* Rodapé com crédito */}
        <div className="px-3 py-2.5 border-t border-white/10 text-center">
          <p className="text-[9px] text-white/40">Desenvolvido por</p>
          <p className="text-[10px] font-medium text-[#e87722]">Abraham Câmara</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 
          flex items-center justify-between px-4
          sticky top-0 z-30">
          
          {/* Botão Menu Mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#1e3a5f] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Data */}
          <p className="hidden sm:block text-xs text-slate-500 capitalize">
            {formatDate()}
          </p>

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-bold text-[#1e3a5f] text-sm">Defesa Civil</span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-[#1e3a5f]">Defesa Civil</p>
              <p className="text-[10px] text-slate-400">Administrador</p>
            </div>
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Botão fechar menu mobile */}
        {mobileMenuOpen && (
          <button
            onClick={closeMobileMenu}
            className="fixed top-3 right-3 z-50 lg:hidden
              w-9 h-9 bg-white rounded-full shadow-lg
              flex items-center justify-center text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
