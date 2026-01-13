/**
 * API Route raiz
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'online',
    servico: 'Defesa Civil Araruna API',
    versao: '5.0.0',
    endpoints: {
      health: '/api/netcdf/health',
      converter: '/api/netcdf/converter (POST)',
    },
  })
}
