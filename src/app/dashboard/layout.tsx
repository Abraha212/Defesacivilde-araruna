'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calendar, 
  FileText, 
  LogOut,
  User as UserIcon,
  Lightbulb
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        backgroundColor: '#1e3a5f', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              backgroundColor: 'white', 
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/images/logo-prefeitura.png" 
                alt="Brasão"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h1 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>DEFESA CIVIL</h1>
              <p style={{ fontSize: '12px', color: '#f59d4d', margin: 0 }}>ARARUNA / PB</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '16px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  backgroundColor: isActive ? '#e87722' : 'transparent',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <LogOut style={{ width: '20px', height: '20px' }} />
            <span>Sair do Sistema</span>
          </button>
        </div>

        {/* Rodapé com crédito */}
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Desenvolvido por
          </p>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#f59d4d', margin: '2px 0 0 0' }}>
            Abraham Câmara
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: '280px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ 
          height: '64px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textTransform: 'capitalize' }}>
            {formatDate()}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a5f', margin: 0 }}>
                Defesa Civil
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Acesso Administrativo</p>
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#1e3a5f', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
