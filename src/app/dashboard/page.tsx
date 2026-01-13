import { createClient } from '@/lib/supabase/server'
import { FileSpreadsheet, Calendar, FileText, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cards = [
    {
      title: 'Conversor NetCDF',
      description: 'Converta arquivos .nc para CSV ou Excel',
      icon: FileSpreadsheet,
      href: '/dashboard/conversor',
      color: 'bg-[#2d5a87]',
    },
    {
      title: 'Agenda',
      description: 'Gerencie seus compromissos',
      icon: Calendar,
      href: '/dashboard/agenda',
      color: 'bg-[#e87722]',
    },
    {
      title: 'Memorandos',
      description: 'Controle de memorandos numerados',
      icon: FileText,
      href: '/dashboard/memorandos',
      color: 'bg-[#059669]',
    },
  ]

  return (
    <div>
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Bem-vindo, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Servidor'}
        </h1>
        <p className="text-[#6b7280] mt-1">
          Acesse os módulos do sistema através dos atalhos abaixo.
        </p>
      </div>

      {/* Cards de acesso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="block bg-white rounded-lg border border-[#d1d5db] p-6 hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-1">
              {card.title}
            </h2>
            <p className="text-sm text-[#6b7280]">
              {card.description}
            </p>
          </a>
        ))}
      </div>

      {/* Informações do sistema */}
      <div className="bg-white rounded-lg border border-[#d1d5db] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[#e87722]" />
          <h2 className="text-lg font-semibold text-[#1e3a5f]">
            Informações do Sistema
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Usuário conectado</p>
            <p className="font-medium text-[#1e3a5f]">{user?.email}</p>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Último acesso</p>
            <p className="font-medium text-[#1e3a5f]">
              {user?.last_sign_in_at 
                ? new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  }).format(new Date(user.last_sign_in_at))
                : 'Primeiro acesso'
              }
            </p>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <p className="text-[#6b7280]">Versão do sistema</p>
            <p className="font-medium text-[#1e3a5f]">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
