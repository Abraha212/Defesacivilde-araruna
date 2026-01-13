# 🛡️ Defesa Civil Araruna

Sistema institucional web para a Defesa Civil da Prefeitura Municipal de Araruna/PB.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Deploy na Vercel

Este sistema está **100% pronto para rodar na Vercel** sem necessidade de servidor Python separado!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abraha212/Defesacivilde-araruna)

## 📋 Funcionalidades

### 🔄 Conversor NetCDF
- Converte arquivos meteorológicos NetCDF (.nc) para CSV
- **Funciona 100% na Vercel** (API Routes do Next.js)
- Processamento via biblioteca `netcdfjs` (JavaScript puro)
- Indicadores de progresso em tempo real
- Limite: 50MB por arquivo (serverless)

### 📅 Agenda
- Calendário interativo
- Criação, edição e exclusão de compromissos
- Visualização por dia/mês

### 📝 Memorandos
- Controle de numeração de 1 a 100
- Status: Pendente/Concluído
- Filtros por status

## 🛠️ Tecnologias

**Frontend + Backend (100% JavaScript):**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Lucide Icons
- **netcdfjs** (processamento NetCDF em JS)

**Banco de Dados:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/Abraha212/Defesacivilde-araruna.git
cd Defesacivilde-araruna
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
Crie o arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

### 4. Execute o SQL no Supabase
Execute o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

## ▶️ Executando

### Opção 1: Script automático (Windows)
```bash
INICIAR.bat
```

### Opção 2: Manual
```bash
npm run dev
```

Acesse: http://localhost:3000

## 🌐 Deploy na Vercel

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe o repositório
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

O conversor NetCDF funciona automaticamente nas API Routes da Vercel.

## 📁 Estrutura do Projeto

```
defesa-civil-araruna/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── netcdf/         # API Routes (JavaScript)
│   │   │       ├── converter/  # POST - Converte NetCDF para CSV
│   │   │       └── health/     # GET - Status do serviço
│   │   ├── dashboard/
│   │   │   ├── conversor/      # UI do Conversor NetCDF
│   │   │   ├── agenda/         # Agenda
│   │   │   └── memorandos/     # Memorandos
│   │   ├── login/              # Autenticação
│   │   └── auth/               # OAuth callback
│   ├── components/             # Componentes React
│   ├── lib/                    # Utilitários
│   └── types/                  # Tipos TypeScript
├── public/images/              # Logo e imagens
├── supabase/schema.sql         # Schema do banco
└── vercel.json                 # Configuração Vercel
```

## 🔒 Segurança

- Autenticação via Supabase Auth (email/senha e Google OAuth)
- Row Level Security (RLS) no PostgreSQL
- Cada usuário acessa apenas seus próprios dados

## 📊 Limites (Vercel Serverless)

| Recurso | Limite |
|---------|--------|
| Tamanho do arquivo | 50MB |
| Tempo de processamento | 60s |
| Memória | 1024MB |

Para arquivos maiores, use o backend Python local (pasta `backend/`).

## 👨‍💻 Autor

**Abraham** - Prefeitura Municipal de Araruna/PB

## 📄 Licença

Este projeto está sob a licença MIT.
