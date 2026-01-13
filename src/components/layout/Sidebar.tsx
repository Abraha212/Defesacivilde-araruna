'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calendar, 
  FileText, 
  LogOut
} from 'lucide-react'

const menuItems = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversor NetCDF', href: '/dashboard/conversor', icon: FileSpreadsheet },
  { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  { name: 'Memorandos', href: '/dashboard/memorandos', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Forçar redirecionamento mesmo se der erro
      router.push('/login')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#1e3a5f] text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl p-2 flex items-center justify-center">
            <img 
              src="/images/logo-prefeitura.png" 
              alt="Brasão Araruna"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">DEFESA CIVIL</h1>
            <p className="text-xs text-[#f59d4d] font-semibold">ARARUNA / PB</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-[#e87722] text-white font-semibold shadow-lg' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  )
}
