'use client'

import { User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserData {
  name: string
  role: string
}

export function Header() {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        
        if (data.authenticated && data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      }
    }
    checkAuth()
  }, [])

  const formatDate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <p className="text-sm text-slate-500 capitalize">{formatDate()}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1e3a5f]">
            {user?.name || 'Defesa Civil'}
          </p>
          <p className="text-xs text-slate-400">Acesso Administrativo</p>
        </div>
        
        <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  )
}
