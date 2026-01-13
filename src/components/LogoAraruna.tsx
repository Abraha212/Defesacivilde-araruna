'use client'

interface LogoArarunaProps {
  className?: string
}

export function LogoAraruna({ className = 'w-16 h-16' }: LogoArarunaProps) {
  return (
    <div className="bg-white rounded-xl p-2 shadow-lg inline-flex items-center justify-center">
      <img
        src="/images/logo-prefeitura.png"
        alt="Brasão de Araruna"
        className={`object-contain ${className}`}
      />
    </div>
  )
}
