/**
 * API Route para converter arquivos NetCDF para CSV
 * Substitui o backend Python para funcionar na Vercel
 */

import { NextRequest, NextResponse } from 'next/server'
import { NetCDFReader } from 'netcdfjs'

export const runtime = 'nodejs'
export const maxDuration = 60 // Máximo permitido na Vercel (Pro: 300s)

interface Variable {
  name: string
  dimensions: string[]
  attributes: Record<string, unknown>
  type: string
  size: number
}

/**
 * Converte arquivo NetCDF para CSV
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const arquivo = formData.get('arquivo') as File | null
    const formato = request.nextUrl.searchParams.get('formato') || 'csv'

    if (!arquivo) {
      return NextResponse.json(
        { detail: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    if (!arquivo.name.toLowerCase().endsWith('.nc')) {
      return NextResponse.json(
        { detail: 'Arquivo deve ser .nc (NetCDF)' },
        { status: 400 }
      )
    }

    console.log(`[CONVERTER] Processando: ${arquivo.name} (${(arquivo.size / 1024 / 1024).toFixed(2)} MB)`)

    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await arquivo.arrayBuffer()
    
    // Criar reader NetCDF
    const reader = new NetCDFReader(arrayBuffer)

    console.log(`[INFO] Dimensões: ${JSON.stringify(reader.dimensions)}`)
    console.log(`[INFO] Variáveis: ${reader.variables.map((v: Variable) => v.name).join(', ')}`)

    // Extrair dados e converter para CSV
    const csvContent = convertNetCDFToCSV(reader)

    // Nome do arquivo de saída
    const nomeBase = arquivo.name.replace(/\.nc$/i, '')
    const nomeArquivo = `${nomeBase}.csv`

    console.log(`[SUCESSO] Arquivo convertido: ${nomeArquivo}`)

    // Retornar CSV como download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    })

  } catch (error) {
    console.error('[ERRO] Falha na conversão:', error)
    
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json(
      { detail: `Erro na conversão: ${mensagem}` },
      { status: 500 }
    )
  }
}

/**
 * Converte dados do NetCDF para formato CSV
 */
function convertNetCDFToCSV(reader: NetCDFReader): string {
  const variables = reader.variables as Variable[]
  const dimensions = reader.dimensions as { name: string; size: number }[]

  // Identificar variáveis de dados (não são coordenadas)
  const coordNames = dimensions.map(d => d.name)
  const dataVars = variables.filter(v => !coordNames.includes(v.name) || v.dimensions.length > 0)

  // Se não houver variáveis de dados, usar todas
  const varsToExport = dataVars.length > 0 ? dataVars : variables

  // Construir estrutura de dados
  const rows: Record<string, unknown>[] = []
  
  // Obter valores das coordenadas/dimensões
  const dimValues: Record<string, number[] | string[]> = {}
  for (const dim of dimensions) {
    try {
      const dimVar = variables.find(v => v.name === dim.name)
      if (dimVar) {
        dimValues[dim.name] = reader.getDataVariable(dim.name) as number[]
      } else {
        // Criar índices se não houver variável de dimensão
        dimValues[dim.name] = Array.from({ length: dim.size }, (_, i) => i)
      }
    } catch {
      dimValues[dim.name] = Array.from({ length: dim.size }, (_, i) => i)
    }
  }

  // Para cada variável de dados, extrair valores
  for (const variable of varsToExport) {
    if (variable.dimensions.length === 0) continue // Pular escalares

    try {
      const data = reader.getDataVariable(variable.name)
      if (!data || !Array.isArray(data)) continue

      const dims = variable.dimensions
      const sizes = dims.map(d => {
        const dim = dimensions.find(dd => dd.name === d)
        return dim ? dim.size : 1
      })

      // Calcular índices para cada ponto
      let flatIndex = 0
      const indices = new Array(dims.length).fill(0)

      const iterate = (dimIdx: number): void => {
        if (dimIdx === dims.length) {
          // Criar linha com coordenadas e valor
          const row: Record<string, unknown> = {}
          
          // Adicionar coordenadas
          for (let i = 0; i < dims.length; i++) {
            const dimName = dims[i]
            const coordValues = dimValues[dimName]
            if (coordValues) {
              row[dimName] = coordValues[indices[i]]
            } else {
              row[dimName] = indices[i]
            }
          }
          
          // Adicionar valor da variável
          const value = data[flatIndex]
          row[variable.name] = formatValue(value)
          
          rows.push(row)
          flatIndex++
          return
        }

        for (let i = 0; i < sizes[dimIdx]; i++) {
          indices[dimIdx] = i
          iterate(dimIdx + 1)
        }
      }

      // Limitar número de linhas para evitar timeout
      const maxRows = 500000
      if (rows.length < maxRows) {
        iterate(0)
      }

      // Se já atingiu o limite, parar
      if (rows.length >= maxRows) {
        console.log(`[AVISO] Limitado a ${maxRows} linhas para evitar timeout`)
        break
      }

    } catch (err) {
      console.warn(`[AVISO] Não foi possível processar variável ${variable.name}:`, err)
    }
  }

  // Se não conseguiu extrair dados estruturados, tentar método simplificado
  if (rows.length === 0) {
    return convertNetCDFToCSVSimple(reader)
  }

  // Converter para CSV
  if (rows.length === 0) {
    return 'Sem dados para exportar'
  }

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return String(val)
    }).join(','))
  ]

  return csvLines.join('\n')
}

/**
 * Método simplificado para arquivos com estrutura diferente
 */
function convertNetCDFToCSVSimple(reader: NetCDFReader): string {
  const variables = reader.variables as Variable[]
  const lines: string[] = []

  // Header com metadados
  lines.push('# Arquivo NetCDF convertido para CSV')
  lines.push(`# Dimensões: ${JSON.stringify(reader.dimensions)}`)
  lines.push('')

  // Para cada variável, criar uma seção
  for (const variable of variables) {
    try {
      const data = reader.getDataVariable(variable.name)
      if (!data) continue

      lines.push(`# Variável: ${variable.name}`)
      lines.push(`# Dimensões: ${variable.dimensions.join(', ')}`)
      lines.push(`# Tipo: ${variable.type}`)
      
      if (Array.isArray(data)) {
        // Limitar dados para não estourar memória
        const maxItems = 100000
        const items = data.slice(0, maxItems)
        
        lines.push('index,value')
        items.forEach((value, index) => {
          lines.push(`${index},${formatValue(value)}`)
        })
        
        if (data.length > maxItems) {
          lines.push(`# ... ${data.length - maxItems} valores adicionais omitidos`)
        }
      } else {
        lines.push(`value: ${formatValue(data)}`)
      }
      
      lines.push('')
    } catch (err) {
      console.warn(`Erro ao ler variável ${variable.name}:`, err)
    }
  }

  return lines.join('\n')
}

/**
 * Formata valor para CSV
 */
function formatValue(value: unknown): string | number {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return ''
    return value
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return String(value)
}

/**
 * OPTIONS para CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
