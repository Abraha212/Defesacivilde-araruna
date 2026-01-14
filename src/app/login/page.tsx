'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Loader2, LogIn, User } from 'lucide-react'
import { LogoAraruna } from '@/components/LogoAraruna'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'Usuário ou senha incorretos')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1e3a5f] px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <LogoAraruna className="w-16 h-20 object-contain mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white">DEFESA CIVIL</h1>
        <p className="text-[#e87722] text-xs font-medium">Prefeitura de Araruna/PB</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-xl p-6">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="p-2 bg-[#1e3a5f] rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-[#1e3a5f]">Acesso ao Sistema</h2>
            <p className="text-[10px] text-slate-500">Área restrita</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1.5">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário" required autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 text-[#1e3a5f] placeholder-slate-400 text-sm outline-none transition-all" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha" required autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100 text-[#1e3a5f] placeholder-slate-400 text-sm outline-none transition-all" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#1e3a5f] hover:bg-[#0f2744] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Entrar</>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-slate-400">
          Acesso restrito a servidores autorizados.
        </p>
      </div>

      {/* Rodapé */}
      <p className="mt-6 text-center text-[10px] text-white/50">
        © {new Date().getFullYear()} Prefeitura de Araruna/PB
      </p>
    </div>
  )
}
