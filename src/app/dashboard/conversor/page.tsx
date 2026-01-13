'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  File,
  AlertCircle,
  CheckCircle2,
  X,
  Zap,
  Clock,
  HardDrive
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkBackend = () => {
      fetch(`${API_URL}/health`, { mode: 'cors' })
        .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
        .catch(() => setBackendOnline(false))
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => clearInterval(interval)
  }, [])

  // Timer para tempo decorrido
  useEffect(() => {
    if (loading && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading, startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const estimateTime = (fileSize: number) => {
    // Estimativa baseada no tamanho (aproximadamente 100MB/minuto)
    const sizeInMB = fileSize / (1024 * 1024)
    const minutes = Math.ceil(sizeInMB / 100)
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
      setSelectedFile(file)
      setError(null)
      setPhase('idle')
    }
  }

  const cancelar = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
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
            setStatusMsg('Arquivo recebido pelo servidor')
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
        setError('Erro de conexão. Verifique se o backend está rodando.')
        setPhase('error')
        setLoading(false)
      }

      xhr.ontimeout = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setError('Timeout: a requisição demorou demais.')
        setPhase('error')
        setLoading(false)
      }

      xhr.onabort = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase('idle')
        setLoading(false)
        setStatusMsg('')
      }

      xhr.open('POST', `${API_URL}/api/netcdf/converter?formato=${formato}`)
      xhr.responseType = 'arraybuffer'
      xhr.timeout = 0
      xhr.send(formData)

    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError(err.message || 'Erro desconhecido')
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

  const getProcessingSteps = () => {
    const steps = [
      { label: 'Lendo arquivo NetCDF', done: elapsedTime > 5 },
      { label: 'Extraindo variáveis', done: elapsedTime > 15 },
      { label: 'Convertendo dados', done: elapsedTime > 30 },
      { label: 'Gerando arquivo de saída', done: false },
    ]
    return steps
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #e87722, #c55a0a)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(232,119,34,0.3)'
          }}>
            <FileSpreadsheet style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>
              Conversor NetCDF
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>Converta arquivos .nc para CSV ou Excel</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: backendOnline ? '#dcfce7' : backendOnline === false ? '#fee2e2' : '#f1f5f9',
          color: backendOnline ? '#166534' : backendOnline === false ? '#991b1b' : '#475569'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: backendOnline ? '#22c55e' : backendOnline === false ? '#ef4444' : '#94a3b8'
          }} />
          {backendOnline === null ? 'Verificando...' : backendOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {backendOnline === false && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: '600', color: '#991b1b', margin: 0 }}>Backend não está rodando</p>
            <p style={{ color: '#dc2626', fontSize: '14px', margin: '4px 0 0' }}>
              Execute: <code style={{ backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                cd backend && python main.py
              </code>
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Upload Area */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: dragOver ? '2px dashed #e87722' : selectedFile ? '2px dashed #22c55e' : '2px dashed #e2e8f0',
            padding: '32px',
            minHeight: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1
          }}
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".nc"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFile ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#dcfce7',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <File style={{ width: '40px', height: '40px', color: '#22c55e' }} />
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e3a5f', margin: 0, wordBreak: 'break-all', maxWidth: '300px' }}>
                {selectedFile.name}
              </p>
              <p style={{ color: '#64748b', margin: '8px 0', fontSize: '18px', fontWeight: '600' }}>
                {formatSize(selectedFile.size)}
              </p>
              
              {/* Estimativa de tempo */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px',
                color: '#f59d4d',
                fontSize: '14px',
                marginTop: '8px'
              }}>
                <Clock style={{ width: '16px', height: '16px' }} />
                <span>Tempo estimado: {estimateTime(selectedFile.size)}</span>
              </div>
              
              {!loading && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); setPhase('idle'); }}
                  style={{
                    marginTop: '16px',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} /> Remover
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f1f5f9',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Upload style={{ width: '40px', height: '40px', color: '#94a3b8' }} />
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e3a5f', margin: 0 }}>
                Arraste o arquivo aqui
              </p>
              <p style={{ color: '#94a3b8', margin: '8px 0' }}>ou clique para selecionar</p>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Formato aceito: .nc (NetCDF)</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Processing Status - MELHORADO */}
          {loading && (
            <div style={{
              backgroundColor: '#1e3a5f',
              borderRadius: '16px',
              padding: '24px',
              color: 'white'
            }}>
              {/* Timer sempre visível */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '20px', height: '20px', color: '#f59d4d' }} />
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Tempo decorrido</span>
                </div>
                <span style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#f59d4d',
                  fontFamily: 'monospace'
                }}>
                  {formatTime(elapsedTime)}
                </span>
              </div>

              {phase === 'uploading' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Upload style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: '600' }}>Enviando para o servidor</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#f59d4d' }}>{progress}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #e87722, #f59d4d)',
                      borderRadius: '4px',
                      transition: 'width 0.3s',
                      width: `${progress}%`
                    }} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{statusMsg}</p>
                </>
              )}

              {phase === 'processing' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%'
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '3px solid transparent',
                        borderTopColor: '#f59d4d',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                    <span style={{ fontWeight: '600' }}>Processando arquivo</span>
                  </div>

                  {/* Etapas do processamento */}
                  <div style={{ marginBottom: '16px' }}>
                    {getProcessingSteps().map((step, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginBottom: '10px',
                        opacity: step.done ? 0.5 : 1
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: step.done ? '#22c55e' : 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          {step.done ? '✓' : (i + 1)}
                        </div>
                        <span style={{ fontSize: '14px', color: step.done ? 'rgba(255,255,255,0.5)' : 'white' }}>
                          {step.label}
                        </span>
                        {!step.done && i === getProcessingSteps().findIndex(s => !s.done) && (
                          <span style={{ 
                            marginLeft: 'auto', 
                            fontSize: '12px', 
                            color: '#f59d4d',
                            animation: 'pulse 1.5s infinite'
                          }}>
                            em andamento...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Aviso para arquivos grandes */}
                  {selectedFile && selectedFile.size > 500 * 1024 * 1024 && (
                    <div style={{
                      backgroundColor: 'rgba(245, 157, 77, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: '16px'
                    }}>
                      <HardDrive style={{ width: '18px', height: '18px', color: '#f59d4d', flexShrink: 0 }} />
                      <div style={{ fontSize: '13px' }}>
                        <p style={{ margin: 0, color: '#f59d4d', fontWeight: '600' }}>Arquivo grande detectado</p>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)' }}>
                          Arquivos de {formatSize(selectedFile.size)} podem demorar vários minutos. 
                          Não feche esta página.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={cancelar}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar conversão
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {phase === 'done' && (
            <div style={{
              backgroundColor: '#22c55e',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              textAlign: 'center'
            }}>
              <CheckCircle2 style={{ width: '48px', height: '48px', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>Conversão Concluída!</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '8px 0 0' }}>
                Tempo total: {formatTime(elapsedTime)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
                O download deve iniciar automaticamente
              </p>
            </div>
          )}

          {/* Error Message */}
          {phase === 'error' && error && (
            <div style={{
              backgroundColor: '#ef4444',
              borderRadius: '16px',
              padding: '24px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>Erro na conversão</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '4px 0 0' }}>{error}</p>
                  <button
                    onClick={() => { setPhase('idle'); setError(null); }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Format Selection & Convert Button */}
          {selectedFile && !loading && phase !== 'done' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 16px' }}>
                Formato de Saída
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => setFormato('csv')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formato === 'csv' ? '2px solid #e87722' : '2px solid #e2e8f0',
                    backgroundColor: formato === 'csv' ? '#fff7ed' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📊</span>
                  <p style={{ fontWeight: 'bold', color: '#1e3a5f', margin: '8px 0 0' }}>CSV</p>
                  <p style={{ fontSize: '12px', color: '#22c55e', margin: '4px 0 0', fontWeight: '500' }}>Recomendado</p>
                </button>

                <button
                  onClick={() => setFormato('xlsx')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formato === 'xlsx' ? '2px solid #e87722' : '2px solid #e2e8f0',
                    backgroundColor: formato === 'xlsx' ? '#fff7ed' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📗</span>
                  <p style={{ fontWeight: 'bold', color: '#1e3a5f', margin: '8px 0 0' }}>Excel</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Limite 1M linhas</p>
                </button>
              </div>

              <button
                onClick={handleConverter}
                disabled={!backendOnline}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                  backgroundColor: backendOnline ? '#e87722' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: backendOnline ? 'pointer' : 'not-allowed'
                }}
              >
                <Download style={{ width: '20px', height: '20px' }} />
                Converter e Baixar
              </button>
            </div>
          )}

          {/* Instructions */}
          {!selectedFile && !loading && (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '24px',
              color: 'white'
            }}>
              <h3 style={{ fontWeight: 'bold', margin: '0 0 16px' }}>Como usar</h3>
              <ol style={{ margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                {[
                  'Arraste ou selecione um arquivo .nc',
                  'Escolha CSV (recomendado) ou Excel',
                  'Clique em converter e aguarde',
                  'Download inicia automaticamente'
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#e87722',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>{i + 1}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{text}</span>
                  </li>
                ))}
              </ol>
              
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: '13px',
                color: '#94a3b8'
              }}>
                <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '14px', height: '14px' }} />
                  Tempo estimado por tamanho:
                </p>
                <ul style={{ margin: 0, paddingLeft: '22px' }}>
                  <li>100 MB → ~1 minuto</li>
                  <li>500 MB → ~5 minutos</li>
                  <li>2 GB → ~20 minutos</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
