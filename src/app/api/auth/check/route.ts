/**
 * API para verificar sessão - Defesa Civil Araruna
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('dc_session')

    if (!session || !session.value) {
      return NextResponse.json({
        authenticated: false
      })
    }

    // Decodificar e validar token
    try {
      const decoded = Buffer.from(session.value, 'base64').toString('utf-8')
      const [username] = decoded.split(':')
      
      const VALID_USERS = [
        { username: 'defesacivil', name: 'Defesa Civil Araruna' },
        { username: 'nerygeisse@gmail.com', name: 'Geisse Nery' }
      ]

      const user = VALID_USERS.find(u => u.username === username)
      
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            name: user.name,
            role: 'admin'
          }
        })
      }
    } catch {
      // Token inválido
    }

    return NextResponse.json({
      authenticated: false
    })

  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json({
      authenticated: false
    })
  }
}
