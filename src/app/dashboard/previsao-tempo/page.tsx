'use client'

import { useEffect, useState } from 'react'
import { Wind, Droplets, Eye, Thermometer, RefreshCw, MapPin, ArrowUp, ArrowDown } from 'lucide-react'

const API_KEY = 'bc0cece113b11c16542b1debc26da0c6'
const CITY    = 'Araruna,BR'

function weatherEmoji(id: number): string {
  if (id >= 200 && id < 300) return '⛈️'
  if (id >= 300 && id < 400) return '🌦️'
  if (id >= 500 && id < 600) return '🌧️'
  if (id >= 600 && id < 700) return '❄️'
  if (id >= 700 && id < 800) return '🌫️'
  if (id === 800)             return '☀️'
  if (id === 801)             return '🌤️'
  if (id === 802)             return '⛅'
  return '☁️'
}

function groupForecastByDay(list: any[]) {
  const days: Record<string, any[]> = {}
  list.forEach(item => {
    const day = item.dt_txt.split(' ')[0]
    if (!days[day]) days[day] = []
    days[day].push(item)
  })
  return Object.entries(days).slice(0, 5)
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)
}

export default function PrevisaoTempoPage() {
  const [current, setCurrent]     = useState<any>(null)
  const [forecast, setForecast]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [curRes, forRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=pt_br`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=pt_br`),
      ])
      if (!curRes.ok || !forRes.ok) throw new Error('Falha ao buscar dados')
      const curData = await curRes.json()
      const forData = await forRes.json()
      setCurrent(curData)
      setForecast(forData.list)
      setLastUpdate(new Date())
    } catch {
      setError('Não foi possível carregar a previsão. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-[#e87722] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Carregando previsão...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-5xl mb-4">🌐</p>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#0f2744] transition-colors">
          Tentar novamente
        </button>
      </div>
    </div>
  )

  const days = groupForecastByDay(forecast)

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-2xl flex items-center justify-center text-2xl">
            🌤️
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">Previsão do Tempo</h1>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <MapPin className="w-3 h-3" />
              <span>Araruna, PB — Brasil</span>
            </div>
          </div>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Clima Atual */}
      {current && (
        <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-6xl font-thin mb-1">{Math.round(current.main.temp)}°C</p>
              <p className="text-white/70 capitalize text-lg">{current.weather[0].description}</p>
              <p className="text-white/50 text-sm mt-1">
                Sensação térmica: {Math.round(current.main.feels_like)}°C
              </p>
            </div>
            <div className="text-8xl">{weatherEmoji(current.weather[0].id)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-300" />
              <div>
                <p className="text-white/50 text-xs">Umidade</p>
                <p className="font-semibold">{current.main.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-200" />
              <div>
                <p className="text-white/50 text-xs">Vento</p>
                <p className="font-semibold">{(current.wind.speed * 3.6).toFixed(0)} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-200" />
              <div>
                <p className="text-white/50 text-xs">Visibilidade</p>
                <p className="font-semibold">{(current.visibility / 1000).toFixed(0)} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-300" />
              <div>
                <p className="text-white/50 text-xs">Pressão</p>
                <p className="font-semibold">{current.main.pressure} hPa</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Previsão 5 dias */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-[#1e3a5f] mb-4">Próximos 5 dias</h2>
        <div className="space-y-3">
          {days.map(([date, items]) => {
            const temps  = items.map((i: any) => i.main.temp)
            const minT   = Math.round(Math.min(...temps))
            const maxT   = Math.round(Math.max(...temps))
            const mid    = items[Math.floor(items.length / 2)]
            const emoji  = weatherEmoji(mid.weather[0].id)
            const desc   = mid.weather[0].description
            const rain   = items.reduce((acc: number, i: any) => acc + (i.pop || 0), 0) / items.length

            return (
              <div key={date} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <p className="text-slate-500 text-sm w-28 capitalize">{formatDay(date)}</p>
                <span className="text-2xl">{emoji}</span>
                <p className="text-slate-600 text-sm flex-1 capitalize hidden sm:block">{desc}</p>
                <div className="flex items-center gap-1 text-blue-500 text-xs mr-2">
                  <Droplets className="w-3 h-3" />
                  {Math.round(rain * 100)}%
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="flex items-center gap-0.5 text-blue-500">
                    <ArrowDown className="w-3 h-3" />{minT}°
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="flex items-center gap-0.5 text-[#e87722]">
                    <ArrowUp className="w-3 h-3" />{maxT}°
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Horários de hoje */}
      {forecast.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Hoje — por hora</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {forecast.slice(0, 8).map((item: any, i: number) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl min-w-[70px]">
                <p className="text-xs text-slate-500">{item.dt_txt.split(' ')[1].slice(0, 5)}</p>
                <span className="text-xl">{weatherEmoji(item.weather[0].id)}</span>
                <p className="text-sm font-bold text-[#1e3a5f]">{Math.round(item.main.temp)}°</p>
                <div className="flex items-center gap-0.5 text-blue-500 text-xs">
                  <Droplets className="w-2.5 h-2.5" />
                  {Math.round((item.pop || 0) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastUpdate && (
        <p className="text-center text-xs text-slate-400">
          Atualizado em {lastUpdate.toLocaleTimeString('pt-BR')} · Fonte: OpenWeatherMap
        </p>
      )}
    </div>
  )
}
