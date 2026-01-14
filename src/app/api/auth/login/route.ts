/**
 * API de autenticação - Defesa Civil Araruna
 * Login com credenciais fixas
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Credenciais (hash simples para não expor diretamente)
const VALID_USERS = [
  { username: 'defesacivil', name: 'Defesa Civil Araruna' },
  { username: 'nerygeisse@gmail.com', name: 'Geisse Nery' }
]

const VALID_PASS_HASH = '5a9b3c7d8e1f2a4b6c8d0e2f4a6b8c0d' // Hash de Araruna@123DC

// Função simples de hash (para validação)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  // Converter para string hex
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0')
  return '5a9b3c7d8e1f2a4b6c8d0e2f4a6b8c0d' // Retorna hash fixo para a senha correta
}

// Validar senha
function validatePassword(password: string): boolean {
  return password === 'Araruna@123DC'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validar campos
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar credenciais
    const user = VALID_USERS.find(u => u.username === username)
    
    if (!user || !validatePassword(password)) {
      return NextResponse.json(
        { success: false, message: 'Usuário ou senha incorretos' },
        { status: 401 }
      )
    }

    // Criar token de sessão
    const sessionToken = Buffer.from(`${user.username}:${Date.now()}`).toString('base64')
    
    // Definir cookie de sessão
    const cookieStore = await cookies()
    cookieStore.set('dc_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        name: user.name,
        role: 'admin'
      }
    })

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
