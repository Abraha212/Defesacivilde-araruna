# 🏛️ Defesa Civil Araruna

Sistema institucional para a Defesa Civil da Prefeitura Municipal de Araruna/PB.

## 📋 Funcionalidades

### 1. Conversor NetCDF
- Upload de arquivos `.nc` (NetCDF)
- Visualização e edição dos dados em tabela
- Conversão para CSV ou Excel
- **Excel exportado com logo da Prefeitura**
- Histórico de conversões por usuário

### 2. Agenda
- Calendário interativo
- Criar, editar e excluir compromissos
- Visualização por dia
- Dados isolados por usuário (RLS)

### 3. Controle de Memorandos
- Grid numerado de 1 a 100
- Toggle pendente/concluído
- Filtros por status
- Dados isolados por usuário (RLS)

### 4. Assistente IA (Gemini)
- Apoio técnico via Google Gemini
- Contexto de meteorologia e gestão de riscos

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router), Tailwind CSS |
| Backend | Python (FastAPI), xarray, pandas |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (Email/Senha + Google OAuth) |
| Storage | Supabase Storage |
| IA | Google Gemini API |

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- Conta no Supabase

### 1. Configurar Supabase

1. Acesse seu projeto: https://supabase.com/dashboard/project/uefvkgkhkhnaqslyoqli
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`
3. Configure o Google OAuth em **Authentication > Providers > Google**
4. Crie o bucket `netcdf-files` em **Storage**

### 2. Configurar Variáveis de Ambiente

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://uefvkgkhkhnaqslyoqli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (backend/.env):**
```env
SUPABASE_URL=https://uefvkgkhkhnaqslyoqli.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key
GEMINI_API_KEY=sua_gemini_api_key
```

### 3. Instalar Dependências

```bash
# Frontend
npm install

# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 4. Executar

**Opção 1: Script automático (Windows)**
```bash
INICIAR.bat
```

**Opção 2: Manual**

Terminal 1 (Backend):
```bash
cd backend
.\venv\Scripts\activate
python main.py
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 5. Acessar

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Documentação API:** http://localhost:8000/docs

---

## 📁 Estrutura do Projeto

```
defesa-civil-araruna/
├── backend/                 # API Python
│   ├── main.py              # FastAPI endpoints
│   ├── requirements.txt     # Dependências Python
│   └── .env                 # Variáveis de ambiente
├── public/
│   └── images/
│       └── logo-prefeitura.png  # Logo para Excel
├── src/
│   ├── app/
│   │   ├── dashboard/       # Páginas protegidas
│   │   │   ├── agenda/
│   │   │   ├── conversor/
│   │   │   └── memorandos/
│   │   ├── login/
│   │   └── auth/callback/
│   ├── components/
│   │   └── layout/          # Sidebar, Header
│   └── lib/
│       ├── api.ts           # Cliente da API Python
│       └── supabase/        # Clientes Supabase
├── supabase/
│   └── schema.sql           # Schema do banco
└── .env.local               # Variáveis frontend
```

---

## 🔒 Segurança

- Todas as tabelas possuem **Row Level Security (RLS)**
- Políticas `auth.uid() = user_id` garantem isolamento de dados
- Autenticação obrigatória via middleware
- Tokens JWT verificados no backend

---

## 📝 Notas

- Desenvolvido para uso institucional da Prefeitura de Araruna/PB
- Design sóbrio e governamental (paleta: azul, laranja, branco)
- Sem aparência comercial ou de startup
- Tipografia clara e acessível

---

© 2026 Prefeitura Municipal de Araruna/PB - Todos os direitos reservados
