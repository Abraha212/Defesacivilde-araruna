'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Loader2, User, UserPlus, LogIn } from 'lucide-react'
import { LogoAraruna } from '@/components/LogoAraruna'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nome,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este e-mail já está cadastrado.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      setLoading(false)
      return
    }

    setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setNome('')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('Erro ao conectar com o Google. Verifique se o OAuth está configurado no Supabase.')
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setNome('')
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1e3a5f] to-[#0f2744] px-4 py-8">
      {/* Cabeçalho institucional */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Logo da Prefeitura de Araruna */}
          <LogoAraruna className="w-20 h-24 object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          DEFESA CIVIL
        </h1>
        <p className="text-[#f59d4d] text-sm font-medium mt-1">
          Prefeitura Municipal de Araruna/PB
        </p>
      </div>

      {/* Card de login/cadastro */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Tabs Login/Cadastro */}
        <div className="flex mb-6 border-b border-[#d1d5db]">
          <button
            onClick={() => { setIsRegistering(false); resetForm(); }}
            className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              !isRegistering 
                ? 'border-[#e87722] text-[#1e3a5f]' 
                : 'border-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
          <button
            onClick={() => { setIsRegistering(true); resetForm(); }}
            className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              isRegistering 
                ? 'border-[#e87722] text-[#1e3a5f]' 
                : 'border-transparent text-[#9ca3af] hover:text-[#4b5563]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        <h2 className="text-xl font-semibold text-[#1e3a5f] text-center mb-6">
          {isRegistering ? 'Criar Nova Conta' : 'Acesso ao Sistema'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleEmailLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label 
                htmlFor="nome" 
                className="block text-sm font-medium text-[#4b5563] mb-1"
              >
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-3 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#e87722] focus:border-transparent text-[#1e3a5f] placeholder-[#9ca3af]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-[#4b5563] mb-1"
            >
              E-mail {isRegistering ? '' : 'institucional'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegistering ? "seu@email.com" : "servidor@araruna.pb.gov.br"}
                className="w-full pl-10 pr-4 py-3 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#e87722] focus:border-transparent text-[#1e3a5f] placeholder-[#9ca3af]"
                required
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-[#4b5563] mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? "Mínimo 6 caracteres" : "••••••••"}
                className="w-full pl-10 pr-4 py-3 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#e87722] focus:border-transparent text-[#1e3a5f]"
                required
                minLength={6}
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-[#4b5563] mb-1"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-10 pr-4 py-3 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#e87722] focus:border-transparent text-[#1e3a5f]"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isRegistering ? 'Criando conta...' : 'Entrando...'}
              </>
            ) : (
              <>
                {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isRegistering ? 'Criar conta' : 'Entrar'}
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d1d5db]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[#9ca3af]">ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border-2 border-[#d1d5db] hover:border-[#e87722] text-[#4b5563] font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isRegistering ? 'Cadastrar com Google' : 'Entrar com Google'}
        </button>

        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          {isRegistering ? (
            <>
              Ao criar uma conta, você concorda com os<br />
              termos de uso do sistema institucional.
            </>
          ) : (
            <>
              Acesso restrito a servidores autorizados.<br />
              Em caso de dúvidas, procure o setor de TI.
            </>
          )}
        </p>
      </div>

      {/* Instruções para Google OAuth */}
      <div className="mt-6 w-full max-w-md p-4 bg-[#0f2744]/50 rounded-lg border border-[#2d5a87]">
        <p className="text-xs text-[#9ca3af] text-center">
          <strong className="text-[#f59d4d]">Nota:</strong> Para usar o login com Google, é necessário configurar o OAuth no painel do Supabase.
        </p>
      </div>

      {/* Rodapé */}
      <p className="mt-6 text-center text-xs text-[#6b7280]">
        © {new Date().getFullYear()} Prefeitura Municipal de Araruna/PB<br />
        Todos os direitos reservados
      </p>
    </div>
  )
}
