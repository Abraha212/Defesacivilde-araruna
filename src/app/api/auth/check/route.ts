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
      const [user] = decoded.split(':')
      
      if (user === 'defesacivil') {
        return NextResponse.json({
          authenticated: true,
          user: {
            name: 'Defesa Civil Araruna',
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
