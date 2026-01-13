/**
 * Cliente da API para processamento de NetCDF
 * Versão 5.0 - Funciona na Vercel com API Routes do Next.js
 */

interface ConversaoResponse {
  id: string
  nome_arquivo: string
  formato_saida: string
  status: string
  variaveis_disponiveis: string[]
  dimensoes: Record<string, number>
  preview: Record<string, unknown>[]
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
 */
export async function analisarNetCDF(arquivo: File, onProgress?: (percent: number) => void): Promise<ConversaoResponse> {
  const headers = await getHeaders()
  
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  
  try {
    // Para arquivos grandes, usar XMLHttpRequest para ter progresso
    if (arquivo.size > 10 * 1024 * 1024 && onProgress) { // > 10MB
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
        
        xhr.open('POST', '/api/netcdf/analisar')
        xhr.timeout = 60000 // 60 segundos
        if (headers.Authorization) {
          xhr.setRequestHeader('Authorization', headers.Authorization)
        }
        xhr.send(formData)
      })
    }
    
    const response = await fetch('/api/netcdf/analisar', {
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
      throw new Error('Não foi possível conectar ao servidor.')
    }
    throw error
  }
}

/**
 * Converter arquivo NetCDF para CSV
 */
export async function converterNetCDF(
  arquivo: File, 
  formato: 'csv' | 'xlsx' = 'csv',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const headers = await getHeaders()
  
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  
  try {
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
      
      xhr.open('POST', `/api/netcdf/converter?formato=${formato}`)
      xhr.responseType = 'blob'
      xhr.timeout = 60000 // 60 segundos (limite da Vercel)
      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization)
      }
      xhr.send(formData)
    })
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor.')
    }
    throw error
  }
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
    const response = await fetch('/api/netcdf/health')
    return response.ok
  } catch {
    return false
  }
}
