'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  File,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  HardDrive,
  Monitor
} from 'lucide-react'

export default function ConversorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formato, setFormato] = useState<'csv' | 'xlsx'>('csv')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showDesktopModal, setShowDesktopModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkBackend = () => {
      fetch('/api/netcdf/health', { mode: 'cors' })
        .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
        .catch(() => setBackendOnline(false))
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (loading && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading, startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const estimateTime = (fileSize: number) => {
    const sizeInMB = fileSize / (1024 * 1024)
    const minutes = Math.ceil(sizeInMB / 50)
    if (minutes < 1) return 'menos de 1 minuto'
    if (minutes === 1) return '~1 minuto'
    return `~${minutes} minutos`
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.nc')) {
        setError('Selecione um arquivo NetCDF (.nc)')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Arquivo muito grande para versão online. Use o Software Desktop para arquivos maiores que 50MB.')
        setShowDesktopModal(true)
        return
      }
      setSelectedFile(file)
      setError(null)
      setPhase('idle')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (!file.name.endsWith('.nc')) {
        setError('Selecione um arquivo NetCDF (.nc)')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Arquivo muito grande para versão online. Use o Software Desktop.')
        setShowDesktopModal(true)
        return
      }
      setSelectedFile(file)
      setError(null)
      setPhase('idle')
    }
  }

  const cancelar = () => {
    if (xhrRef.current) xhrRef.current.abort()
    if (timerRef.current) clearInterval(timerRef.current)
    setLoading(false)
    setPhase('idle')
    setProgress(0)
    setStatusMsg('')
    setElapsedTime(0)
    setStartTime(null)
  }

  const handleConverter = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setProgress(0)
    setPhase('uploading')
    setStatusMsg('Preparando upload...')
    setStartTime(Date.now())
    setElapsedTime(0)

    const formData = new FormData()
    formData.append('arquivo', selectedFile)

    try {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(pct)
          const mb = (e.loaded / (1024 * 1024)).toFixed(1)
          const total = (e.total / (1024 * 1024)).toFixed(1)
          setStatusMsg(`${mb} MB de ${total} MB enviados`)
          
          if (pct >= 100) {
            setPhase('processing')
            setStatusMsg('Processando arquivo no servidor...')
          }
        }
      }

      xhr.onload = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        
        if (xhr.status >= 200 && xhr.status < 300) {
          const contentType = xhr.getResponseHeader('Content-Type') || ''
          const blob = new Blob([xhr.response], { type: contentType })
          
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${selectedFile.name.replace('.nc', '')}.${formato}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          setPhase('done')
          setStatusMsg('Concluído!')
          
          setTimeout(() => {
            setSelectedFile(null)
            setPhase('idle')
            setProgress(0)
            setLoading(false)
            setStatusMsg('')
            setElapsedTime(0)
            setStartTime(null)
          }, 4000)
        } else {
          let errorMsg = `Erro ${xhr.status}`
          try {
            const text = new TextDecoder().decode(xhr.response)
            const json = JSON.parse(text)
            errorMsg = json.detail || errorMsg
          } catch {}
          setError(errorMsg)
          setPhase('error')
          setLoading(false)
        }
      }

      xhr.onerror = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setError('Erro de conexão. Tente novamente.')
        setPhase('error')
        setLoading(false)
      }

      xhr.ontimeout = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setError('Timeout: a requisição demorou demais. Use o Software Desktop.')
        setPhase('error')
        setLoading(false)
      }

      xhr.onabort = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase('idle')
        setLoading(false)
        setStatusMsg('')
      }

      xhr.open('POST', `/api/netcdf/converter?formato=${formato}`)
      xhr.responseType = 'arraybuffer'
      xhr.timeout = 60000
      xhr.send(formData)

    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      setPhase('error')
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  const getProcessingSteps = () => [
    { label: 'Lendo arquivo NetCDF', done: elapsedTime > 3 },
    { label: 'Extraindo variáveis', done: elapsedTime > 8 },
    { label: 'Convertendo dados', done: elapsedTime > 15 },
    { label: 'Gerando arquivo CSV', done: false },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1e3a5f] rounded-2xl flex items-center justify-center shadow-lg">
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Conversor NetCDF</h1>
            <p className="text-slate-500">Converta arquivos .nc para CSV ou Excel</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
          ${backendOnline ? 'bg-emerald-100 text-emerald-700' : backendOnline === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : backendOnline === false ? 'bg-red-500' : 'bg-slate-400'}`} />
          {backendOnline === null ? 'Verificando...' : backendOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Banner do Software Desktop */}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">Arquivos grandes? Baixe o Software Desktop!</h3>
            <p className="text-white/60 text-sm">Processe arquivos de 3GB, 4GB ou mais no seu computador</p>
          </div>
        </div>
        <button
          onClick={() => setShowDesktopModal(true)}
          className="px-6 py-3 bg-white text-[#1e3a5f] rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Baixar Software
        </button>
      </div>

      {backendOnline === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Serviço temporariamente indisponível</p>
            <p className="text-red-600 text-sm">Aguarde alguns segundos ou baixe o Software Desktop.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div 
          className={`bg-white rounded-2xl border-2 border-dashed p-8 min-h-[320px] flex flex-col items-center justify-center cursor-pointer transition-all
            ${dragOver ? 'border-[#e87722] bg-orange-50' : selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-[#1e3a5f]'}
            ${loading ? 'opacity-60 cursor-default' : ''}`}
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input ref={fileInputRef} type="file" accept=".nc" onChange={handleFileSelect} className="hidden" />

          {selectedFile ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <File className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="font-bold text-lg text-[#1e3a5f] break-all max-w-[280px]">{selectedFile.name}</p>
              <p className="text-slate-600 text-2xl font-bold mt-2">{formatSize(selectedFile.size)}</p>
              <p className="text-[#e87722] text-sm mt-2 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" /> Tempo estimado: {estimateTime(selectedFile.size)}
              </p>
              {!loading && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); setPhase('idle') }}
                  className="mt-4 text-red-500 hover:text-red-600 font-medium flex items-center gap-1 mx-auto"
                >
                  <X className="w-4 h-4" /> Remover arquivo
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-bold text-xl text-[#1e3a5f]">Arraste o arquivo aqui</p>
              <p className="text-slate-400 mt-2">ou clique para selecionar</p>
              <p className="text-sm text-slate-400 mt-4">Formato aceito: .nc (NetCDF)</p>
              <p className="text-sm text-[#e87722] mt-1">Limite online: 50MB</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          
          {/* Processing Status */}
          {loading && (
            <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#e87722]" />
                  <span className="text-white/70">Tempo decorrido</span>
                </div>
                <span className="text-2xl font-bold text-[#e87722] font-mono">{formatTime(elapsedTime)}</span>
              </div>

              {phase === 'uploading' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">Enviando para o servidor</span>
                    </div>
                    <span className="font-bold text-[#e87722]">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-[#e87722] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-white/60">{statusMsg}</p>
                </>
              )}

              {phase === 'processing' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-[#e87722] rounded-full animate-spin" />
                    <span className="font-medium">Processando arquivo</span>
                  </div>

                  <div className="space-y-3 mb-4">
                    {getProcessingSteps().map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 ${step.done ? 'opacity-50' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${step.done ? 'bg-emerald-500' : 'bg-white/20'}`}>
                          {step.done ? '✓' : (i + 1)}
                        </div>
                        <span className="text-sm">{step.label}</span>
                      </div>
                    ))}
                  </div>

                  {selectedFile && selectedFile.size > 20 * 1024 * 1024 && (
                    <div className="bg-[#e87722]/20 rounded-xl p-4 flex items-start gap-3 mb-4">
                      <HardDrive className="w-5 h-5 text-[#e87722] flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-[#e87722] font-medium">Arquivo grande detectado</p>
                        <p className="text-white/70">Não feche esta página.</p>
                      </div>
                    </div>
                  )}

                  <button onClick={cancelar}
                    className="w-full py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
                    Cancelar conversão
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {phase === 'done' && (
            <div className="bg-emerald-500 rounded-2xl p-6 text-white text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
              <p className="font-bold text-xl">Conversão Concluída!</p>
              <p className="text-white/80 mt-1">Tempo total: {formatTime(elapsedTime)}</p>
              <p className="text-white/60 text-sm mt-1">O download deve iniciar automaticamente</p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && error && (
            <div className="bg-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">Erro na conversão</p>
                  <p className="text-white/80 text-sm mt-1">{error}</p>
                  <button onClick={() => { setPhase('idle'); setError(null) }}
                    className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Format & Convert */}
          {selectedFile && !loading && phase !== 'done' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-[#1e3a5f] mb-4">Formato de Saída</h3>
              
              <button onClick={() => setFormato('csv')}
                className={`w-full p-4 rounded-xl border-2 text-center mb-4 transition-all
                  ${formato === 'csv' ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200'}`}>
                <span className="text-2xl">📊</span>
                <p className="font-bold text-[#1e3a5f] mt-2">CSV</p>
                <p className="text-sm text-emerald-600 font-medium">Formato disponível</p>
              </button>

              <button onClick={handleConverter} disabled={!backendOnline}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all
                  ${backendOnline ? 'bg-[#1e3a5f] hover:bg-[#0f2744]' : 'bg-slate-300 cursor-not-allowed'}`}>
                <Download className="w-5 h-5" />
                Converter e Baixar
              </button>
            </div>
          )}

          {/* Instructions */}
          {!selectedFile && !loading && (
            <div className="bg-slate-800 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4">Como usar</h3>
              <ol className="space-y-3">
                {['Arraste ou selecione um arquivo .nc', 'Clique em converter e aguarde', 'Download inicia automaticamente'].map((text, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-[#e87722] rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <span className="text-slate-300">{text}</span>
                  </li>
                ))}
              </ol>
              
              <div className="mt-5 pt-5 border-t border-white/10 text-sm text-slate-400">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Informações:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Limite online: 50MB por arquivo</li>
                  <li>Para arquivos maiores: use o Software Desktop</li>
                  <li>
                    <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="text-[#e87722] hover:underline">
                      Baixe o Python
                    </a> se necessário
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Desktop */}
      {showDesktopModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowDesktopModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Software Desktop</h2>
              <p className="text-slate-500">Para arquivos grandes (3GB, 4GB ou mais)</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-[#1e3a5f] mb-2">✅ Vantagens:</h4>
              <ul className="text-slate-600 text-sm space-y-1 list-disc list-inside">
                <li>Processa arquivos de qualquer tamanho</li>
                <li>Sem limite de tempo</li>
                <li>Funciona offline</li>
                <li>Otimizado para memória</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 flex-1">
                <strong>Requisitos:</strong>
                <ul className="mt-1 list-disc list-inside">
                  <li>Windows 10/11</li>
                  <li>Python 3.10+ instalado</li>
                </ul>
                <a 
                  href="https://www.python.org/downloads/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[#1e3a5f] font-bold hover:underline"
                >
                  <Download className="w-3 h-3" />
                  Não tem Python? Baixe aqui
                </a>
              </div>
            </div>

            <div className="bg-[#1e3a5f] rounded-xl p-4 mb-6">
              <p className="text-white/70 text-xs mb-2">Instale as dependências:</p>
              <code className="text-[#e87722] text-sm">pip install xarray netcdf4 pandas numpy</code>
            </div>

            <div className="flex gap-3">
              <a href="/downloads/conversor_desktop.py" download
                className="flex-1 py-3 bg-[#1e3a5f] text-white rounded-xl font-bold text-center hover:bg-[#0f2744] transition-colors flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Baixar Script
              </a>
              <button onClick={() => setShowDesktopModal(false)}
                className="py-3 px-6 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                Fechar
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Desenvolvido por <span className="text-[#e87722] font-medium">Abraham Câmara</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
