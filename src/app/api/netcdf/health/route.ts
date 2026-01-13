/**
 * API Route para verificar status do serviço
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    servico: 'Conversor NetCDF - Defesa Civil Araruna',
    versao: '5.0.0',
    ambiente: 'Vercel Serverless',
    netcdf_disponivel: true,
  })
}
