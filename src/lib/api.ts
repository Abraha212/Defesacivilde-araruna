/**
 * Cliente da API Python para processamento de NetCDF
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ConversaoResponse {
  id: string
  nome_arquivo: string
  formato_saida: string
  status: string
  variaveis_disponiveis: string[]
  dimensoes: Record<string, number>
  preview: Record<string, unknown>[]
}

interface GeminiResponse {
  resposta: string
}

/**
 * Obter token de autenticação do Supabase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      console.warn('Sessão não encontrada')
      return null
    }
    
    return session.access_token
  } catch (error) {
    console.error('Erro ao obter token:', error)
    return null
  }
}

/**
 * Headers padrão com autenticação
 */
async function getHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken()
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    }
  }
  return {}
}

/**
 * Analisar arquivo NetCDF e obter preview dos dados
 * Suporta arquivos grandes com upload em chunks
 */
export async function analisarNetCDF(arquivo: File, onProgress?: (percent: number) => void): Promise<ConversaoResponse> {
  const headers = await getHeaders()
  
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  
  try {
    // Para arquivos grandes, usar XMLHttpRequest para ter progresso
    if (arquivo.size > 100 * 1024 * 1024 && onProgress) { // > 100MB
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.detail || `Erro ${xhr.status}`))
            } catch {
              reject(new Error(`Erro ${xhr.status}`))
            }
          }
        }
        
        xhr.onerror = () => reject(new Error('Erro de conexão'))
        xhr.ontimeout = () => reject(new Error('Timeout - arquivo muito grande'))
        
        xhr.open('POST', `${API_URL}/api/netcdf/analisar`)
        xhr.timeout = 0 // Sem timeout
        if (headers.Authorization) {
          xhr.setRequestHeader('Authorization', headers.Authorization)
        }
        xhr.send(formData)
      })
    }
    
    const response = await fetch(`${API_URL}/api/netcdf/analisar`, {
      method: 'POST',
      headers: headers.Authorization ? { 'Authorization': headers.Authorization } : {},
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
      throw new Error(error.detail || `Erro ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend Python está rodando.')
    }
    throw error
  }
}

/**
 * Converter arquivo NetCDF para CSV ou Excel
 * Suporta arquivos grandes com upload em chunks
 */
export async function converterNetCDF(
  arquivo: File, 
  formato: 'csv' | 'xlsx' = 'xlsx',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const headers = await getHeaders()
  
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  
  try {
    // Para arquivos grandes, usar XMLHttpRequest para ter progresso
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response)
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.detail || `Erro ${xhr.status}`))
          } catch {
            reject(new Error(`Erro ${xhr.status}`))
          }
        }
      }
      
      xhr.onerror = () => reject(new Error('Erro de conexão'))
      xhr.ontimeout = () => reject(new Error('Timeout'))
      
      xhr.open('POST', `${API_URL}/api/netcdf/converter?formato=${formato}`)
      xhr.responseType = 'blob'
      xhr.timeout = 0 // Sem timeout para arquivos grandes
      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization)
      }
      xhr.send(formData)
    })
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend Python está rodando.')
    }
    throw error
  }
}

/**
 * Exportar dados editados para CSV ou Excel
 */
export async function exportarDadosEditados(
  dados: Record<string, unknown>[],
  nomeArquivo: string = 'dados_editados',
  formato: 'csv' | 'xlsx' = 'xlsx'
): Promise<Blob> {
  const headers = await getHeaders()
  
  const response = await fetch(
    `${API_URL}/api/netcdf/exportar-editado?nome_arquivo=${encodeURIComponent(nomeArquivo)}&formato=${formato}`,
    {
      method: 'POST',
      headers: {
        ...(headers as Record<string, string>),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Erro ao exportar dados')
  }
  
  return response.blob()
}

/**
 * Consultar Gemini AI para apoio técnico
 */
export async function perguntarGemini(
  pergunta: string, 
  contexto?: string
): Promise<GeminiResponse> {
  const headers = await getHeaders()
  
  const response = await fetch(`${API_URL}/api/gemini/perguntar`, {
    method: 'POST',
    headers: {
      ...(headers as Record<string, string>),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pergunta, contexto }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Erro ao consultar Gemini')
  }
  
  return response.json()
}

/**
 * Obter histórico de conversões do usuário
 */
export async function obterHistoricoConversoes(): Promise<unknown[]> {
  const headers = await getHeaders()
  
  const response = await fetch(`${API_URL}/api/conversoes/historico`, {
    method: 'GET',
    headers: headers,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Erro ao buscar histórico')
  }
  
  return response.json()
}

/**
 * Baixar blob como arquivo
 */
export function downloadBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Verificar se o backend está online
 */
export async function verificarBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
