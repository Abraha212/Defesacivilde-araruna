'use client'

import { User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

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
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
          </p>
          <p className="text-xs text-slate-400">Acesso Administrativo</p>
        </div>
        
        <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5 text-white" />
          )}
        </div>
      </div>
    </header>
  )
}
