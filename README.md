# 🛡️ Defesa Civil Araruna

Sistema institucional web para a Defesa Civil da Prefeitura Municipal de Araruna/PB.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Funcionalidades

### 🔄 Conversor NetCDF
- Converte arquivos meteorológicos NetCDF (.nc) para CSV ou Excel
- Suporte para arquivos grandes (2GB+)
- Processamento em chunks para otimização de memória
- Indicadores de progresso em tempo real

### 📅 Agenda
- Calendário interativo
- Criação, edição e exclusão de compromissos
- Visualização por dia/mês

### 📝 Memorandos
- Controle de numeração de 1 a 100
- Status: Pendente/Concluído
- Filtros por status

## 🚀 Tecnologias

**Frontend:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Lucide Icons

**Backend:**
- Python FastAPI
- xarray + netCDF4 (processamento)
- pandas (manipulação de dados)

**Banco de Dados:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/Abraha212/Defesacivilde-araruna.git
cd Defesacivilde-araruna
```

### 2. Instale as dependências do Frontend
```bash
npm install
```

### 3. Configure o ambiente
Crie o arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Configure o Backend Python
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 5. Execute o SQL no Supabase
Execute o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

## ▶️ Executando

### Opção 1: Script automático (Windows)
```bash
INICIAR.bat
```

### Opção 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
defesa-civil-araruna/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── conversor/    # Conversor NetCDF
│   │   │   ├── agenda/       # Agenda
│   │   │   └── memorandos/   # Memorandos
│   │   ├── login/            # Autenticação
│   │   └── auth/             # OAuth callback
│   ├── components/           # Componentes React
│   └── lib/                  # Utilitários
├── backend/
│   ├── main.py              # API FastAPI
│   └── requirements.txt     # Dependências Python
├── public/images/           # Logo e imagens
└── supabase/schema.sql      # Schema do banco
```

## 🔒 Segurança

- Autenticação via Supabase Auth (email/senha e Google OAuth)
- Row Level Security (RLS) no PostgreSQL
- Cada usuário acessa apenas seus próprios dados

## 👨‍💻 Autor

**Abraham** - Prefeitura Municipal de Araruna/PB

## 📄 Licença

Este projeto está sob a licença MIT.
