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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'Usuário ou senha incorretos')
        setLoading(false)
        return
      }

      // Login bem-sucedido - redirecionar
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1e3a5f] to-[#0f2744] px-4 py-8">
      {/* Cabeçalho institucional */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <LogoAraruna className="w-20 h-24 object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          DEFESA CIVIL
        </h1>
        <p className="text-[#f59d4d] text-sm font-medium mt-1">
          Prefeitura Municipal de Araruna/PB
        </p>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Header do card */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-[#1e3a5f] rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f]">Acesso ao Sistema</h2>
            <p className="text-sm text-slate-500">Área restrita</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 text-center font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-semibold text-slate-600 mb-2"
            >
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-[#e87722]/20 focus:border-[#e87722] text-[#1e3a5f] placeholder-slate-400 font-medium transition-all outline-none"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold text-slate-600 mb-2"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-[#e87722]/20 focus:border-[#e87722] text-[#1e3a5f] placeholder-slate-400 font-medium transition-all outline-none"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#1e3a5f] hover:bg-[#0f2744] text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1e3a5f]/30 hover:shadow-xl hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Acesso restrito a servidores autorizados.<br />
          Em caso de dúvidas, procure o setor de TI.
        </p>
      </div>

      {/* Rodapé */}
      <p className="mt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Prefeitura Municipal de Araruna/PB<br />
        Todos os direitos reservados
      </p>
    </div>
  )
}
