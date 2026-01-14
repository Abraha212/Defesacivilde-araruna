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

  const formatTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
  const estimateTime = (size: number) => {
    const mins = Math.ceil(size / (1024 * 1024) / 50)
    return mins < 1 ? '< 1 min' : `~${mins} min`
  }
  const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(0)} MB`

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.nc')) { setError('Selecione um arquivo .nc'); return }
      if (file.size > 50 * 1024 * 1024) { setError('Arquivo > 50MB. Use o Software Desktop.'); setShowDesktopModal(true); return }
      setSelectedFile(file); setError(null); setPhase('idle')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (!file.name.endsWith('.nc')) { setError('Selecione um arquivo .nc'); return }
      if (file.size > 50 * 1024 * 1024) { setError('Arquivo > 50MB. Use o Software Desktop.'); setShowDesktopModal(true); return }
      setSelectedFile(file); setError(null); setPhase('idle')
    }
  }

  const cancelar = () => {
    if (xhrRef.current) xhrRef.current.abort()
    if (timerRef.current) clearInterval(timerRef.current)
    setLoading(false); setPhase('idle'); setProgress(0); setStatusMsg(''); setElapsedTime(0); setStartTime(null)
  }

  const handleConverter = async () => {
    if (!selectedFile) return
    setLoading(true); setError(null); setProgress(0); setPhase('uploading')
    setStatusMsg('Enviando...'); setStartTime(Date.now()); setElapsedTime(0)

    const formData = new FormData()
    formData.append('arquivo', selectedFile)

    try {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(pct)
          setStatusMsg(`${(e.loaded / 1048576).toFixed(1)} / ${(e.total / 1048576).toFixed(1)} MB`)
          if (pct >= 100) { setPhase('processing'); setStatusMsg('Processando...') }
        }
      }

      xhr.onload = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('Content-Type') || '' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `${selectedFile.name.replace('.nc', '')}.${formato}`
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
          setPhase('done'); setStatusMsg('Concluído!')
          setTimeout(() => { setSelectedFile(null); setPhase('idle'); setProgress(0); setLoading(false); setStatusMsg(''); setElapsedTime(0); setStartTime(null) }, 3000)
        } else {
          let msg = `Erro ${xhr.status}`
          try { msg = JSON.parse(new TextDecoder().decode(xhr.response)).detail || msg } catch {}
          setError(msg); setPhase('error'); setLoading(false)
        }
      }

      xhr.onerror = () => { if (timerRef.current) clearInterval(timerRef.current); setError('Erro de conexão.'); setPhase('error'); setLoading(false) }
      xhr.ontimeout = () => { if (timerRef.current) clearInterval(timerRef.current); setError('Timeout. Use o Software Desktop.'); setPhase('error'); setLoading(false) }
      xhr.onabort = () => { if (timerRef.current) clearInterval(timerRef.current); setPhase('idle'); setLoading(false); setStatusMsg('') }

      xhr.open('POST', `/api/netcdf/converter?formato=${formato}`)
      xhr.responseType = 'arraybuffer'; xhr.timeout = 60000; xhr.send(formData)
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setPhase('error'); setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1e3a5f]">Conversor NetCDF</h1>
            <p className="text-xs text-slate-500">Converta .nc para CSV</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${backendOnline ? 'bg-blue-50 text-[#1e3a5f]' : backendOnline === false ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-[#1e3a5f]' : backendOnline === false ? 'bg-red-500' : 'bg-slate-400'}`} />
          {backendOnline === null ? '...' : backendOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Banner Desktop */}
      <div className="bg-[#1e3a5f] rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-white" />
          <div>
            <p className="text-white text-xs font-medium">Arquivos grandes? Baixe o Software Desktop</p>
            <p className="text-white/60 text-[10px]">Para arquivos acima de 50MB</p>
          </div>
        </div>
        <button onClick={() => setShowDesktopModal(true)} className="px-3 py-1.5 bg-white text-[#1e3a5f] rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
          Baixar
        </button>
      </div>

      {backendOnline === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700">Serviço indisponível. Aguarde ou baixe o Software Desktop.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload */}
        <div 
          className={`bg-white rounded-lg border-2 border-dashed p-6 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition-all
            ${dragOver ? 'border-[#e87722] bg-orange-50' : selectedFile ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
            ${loading ? 'opacity-60 cursor-default' : ''}`}
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input ref={fileInputRef} type="file" accept=".nc" onChange={handleFileSelect} className="hidden" />

          {selectedFile ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center mx-auto mb-3">
                <File className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-sm text-[#1e3a5f] break-all max-w-[200px]">{selectedFile.name}</p>
              <p className="text-slate-600 text-lg font-bold mt-1">{formatSize(selectedFile.size)}</p>
              <p className="text-[#e87722] text-xs mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> {estimateTime(selectedFile.size)}
              </p>
              {!loading && (
                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); setPhase('idle') }}
                  className="mt-3 text-red-500 text-xs flex items-center gap-1 mx-auto hover:underline">
                  <X className="w-3 h-3" /> Remover
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-[#1e3a5f]">Arraste o arquivo aqui</p>
              <p className="text-slate-400 text-xs mt-1">ou clique para selecionar</p>
              <p className="text-[10px] text-slate-400 mt-2">Formato: .nc • Limite: 50MB</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-[#1e3a5f] rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/70">Tempo</span>
                <span className="text-lg font-bold text-[#e87722] font-mono">{formatTime(elapsedTime)}</span>
              </div>
              {phase === 'uploading' && (
                <>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span>Enviando</span><span className="text-[#e87722] font-bold">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#e87722] rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1">{statusMsg}</p>
                </>
              )}
              {phase === 'processing' && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-[#e87722] rounded-full animate-spin" />
                  <span className="text-xs">Processando arquivo...</span>
                </div>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="bg-[#1e3a5f] rounded-lg p-4 text-white text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="font-bold text-sm">Conversão Concluída!</p>
              <p className="text-xs text-white/70 mt-1">Tempo: {formatTime(elapsedTime)}</p>
            </div>
          )}

          {phase === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-xs">Erro</p>
                  <p className="text-red-600 text-xs mt-0.5">{error}</p>
                  <button onClick={() => { setPhase('idle'); setError(null) }} className="mt-2 text-xs text-[#1e3a5f] font-medium hover:underline">
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedFile && !loading && phase !== 'done' && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-[#1e3a5f] mb-3">Formato de saída</p>
              <button onClick={() => setFormato('csv')}
                className={`w-full p-3 rounded-lg border-2 text-center text-sm font-medium mb-3 transition-all
                  ${formato === 'csv' ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]' : 'border-slate-200 text-slate-500'}`}>
                📊 CSV
              </button>
              <button onClick={handleConverter} disabled={!backendOnline}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white transition-all
                  ${backendOnline ? 'bg-[#1e3a5f] hover:bg-[#0f2744]' : 'bg-slate-300 cursor-not-allowed'}`}>
                <Download className="w-4 h-4" /> Converter e Baixar
              </button>
            </div>
          )}

          {!selectedFile && !loading && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-[#1e3a5f] mb-2">Como usar</p>
              <ol className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                  Selecione um arquivo .nc
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                  Clique em converter
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                  Download automático
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Modal Desktop */}
      {showDesktopModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDesktopModal(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#1e3a5f] font-bold">Software Desktop</h2>
              <p className="text-slate-500 text-xs">Para arquivos grandes (3GB+)</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs">
              <p className="font-semibold text-[#1e3a5f] mb-1">Requisitos:</p>
              <ul className="text-slate-600 space-y-0.5 list-disc list-inside">
                <li>Windows 10/11</li>
                <li>Python 3.10+</li>
              </ul>
            </div>

            <div className="bg-[#1e3a5f] rounded-lg p-3 mb-4">
              <p className="text-white/70 text-[10px] mb-1">Instale:</p>
              <code className="text-[#e87722] text-xs">pip install xarray netcdf4 pandas numpy</code>
            </div>

            <div className="flex gap-2">
              <a href="/downloads/conversor_desktop.py" download className="flex-1 py-2.5 bg-[#1e3a5f] text-white rounded-lg font-bold text-xs text-center hover:bg-[#0f2744] transition-colors">
                Baixar Script
              </a>
              <button onClick={() => setShowDesktopModal(false)} className="py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">
                Fechar
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-3">
              Desenvolvido por <span className="text-[#e87722] font-medium">Abraham Câmara</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
