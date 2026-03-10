# Movimento Pecuário — Suplemento Control
## Documento Completo do Sistema: História, Funcionalidades, Status e Futuro

> Gerado em: 10 de Março de 2026
> Versão atual: **v1.17**
> Repositório: https://github.com/HicaroDev/movimento_pecuario

---

## 1. Como Tudo Começou — A História do Projeto

O **Suplemento Control** nasceu de uma necessidade real do agronegócio brasileiro: controlar com precisão o consumo de suplemento mineral e proteico em fazendas de pecuária extensiva.

A cliente Stela, que atua no setor de nutrição animal com o projeto **Movimento Pecuário**, precisava de uma ferramenta que permitisse a seus clientes (produtores rurais) registrar diariamente o uso de suplementos em cada pasto, acompanhar indicadores de consumo, comparar resultados entre períodos e tomar decisões baseadas em dados.

### Fase 0 — O Protótipo (HTML puro)

O projeto começou da forma mais simples possível: um arquivo HTML único, com CSS e JavaScript vanilla. Nessa fase inicial, o foco foi validar a ideia e o fluxo de uso:

- Uma sidebar com navegação
- Um formulário para lançar dados de suplementação
- Uma tabela com os registros
- Gráficos SVG desenhados à mão
- Filtros por suplemento, pasto e período
- Botão de impressão com CSS específico para PDF

Os dados eram salvos em `localStorage` — ou seja, ficavam no próprio navegador. Era rápido, sem servidor, sem banco de dados. Serviu para mostrar a ideia funcionando em tela.

Essa fase teve **13 tarefas**, todas concluídas.

---

### Fase 1 — O Sistema de Verdade (React + Vite)

Com a ideia validada, o projeto foi reescrito do zero usando tecnologia moderna:

- **React 18** com **TypeScript** — componentes tipados, manutenção fácil
- **Vite 6** — build ultrarrápido
- **Tailwind CSS v4** — design consistente com utilitários
- **Recharts 2** — gráficos de barras interativos
- **React Router 7** — navegação entre páginas (SPA)

Nessa fase foram criados os primeiros componentes de verdade: cards de KPI, gráfico de resumo com legenda lateral, seções de suplemento com tabela e gráfico próprios, formulário de lançamento, e a identidade visual do sistema — com o **verde `#1a6040`** como cor principal da marca Movimento Pecuário.

Essa fase teve **24 tarefas**, todas concluídas.

---

### Fase 1.5 — Multi-fazenda e Login

O sistema evoluiu para suportar múltiplos clientes (fazendas) e diferentes perfis de usuário:

- Sistema de **login** com tela de entrada (com foto de capa)
- **AuthContext** gerenciando sessão e permissões
- Dois tipos de usuário: **Admin** (vê tudo, gerencia tudo) e **Cliente** (acessa só sua fazenda)
- **Módulos**: cada usuário tem acesso somente aos módulos que o admin habilitou
- **Fazendas**: tela de gestão de fazendas com cards e modal de cadastro
- **Usuários**: tela de gestão de usuários com permissões por módulo
- **Pastos**: gestão dos pastos por fazenda

Ainda usava `localStorage`, mas já com arquitetura multi-tenant (dados isolados por fazenda).

Essa fase teve **16 tarefas**, todas concluídas.

---

### Fase 1.6 — Banco de Dados Real (Supabase)

O grande salto: saída do `localStorage` e entrada no banco de dados real com **Supabase**, hospedado em servidor próprio via **EasyPanel** (self-hosted).

- **Supabase Auth** para login real com sessão persistente
- Banco PostgreSQL com tabelas para fazendas, usuários, pastos e lançamentos
- **Row Level Security (RLS)** — cada usuário só acessa dados da sua fazenda
- Dados de exemplo (seed): 2 usuários, 1 fazenda, 19 pastos, 28 lançamentos
- Admin pode selecionar qual fazenda está visualizando pelo sidebar
- Formulário passou a salvar lançamentos direto no banco

Essa fase teve **10 tarefas**, todas concluídas.

---

## 2. O que o Sistema Tem Hoje — Funcionalidades Completas

### 2.1 Autenticação e Controle de Acesso

- Login com email e senha via Supabase Auth
- Tela de login com layout split-screen (foto da fazenda + formulário)
- Sessão persistente — o usuário fica logado ao fechar o navegador
- Dois perfis: **Admin** e **Cliente**
- Controle de módulos por usuário — o admin habilita quais seções cada cliente acessa
- Rotas protegidas — quem não tem acesso é redirecionado automaticamente

### 2.2 Sidebar — Menu de Navegação

A sidebar tem design escuro com gradiente (`#1a1f2e → #2d3548`), logo do Movimento Pecuário em card branco, e exibe apenas os módulos que o usuário tem permissão.

**Ordem dos itens:**
1. Manejo
2. Lançamento
3. Relatórios
4. Cadastros
5. Usuários
6. Fazenda
7. *(Em Breve)* Formulário Pasto
8. *(Em Breve)* Livro Caixa

Os itens "Em Breve" aparecem esmaecidos com badge, e ao clicar exibem um modal informando que o módulo está em desenvolvimento.

Para o **Admin**, há um seletor de fazenda no sidebar — pode alternar entre as fazendas do sistema. Para o **Cliente**, a fazenda é fixa (a dele).

---

### 2.3 Módulo: Manejo (Tela Principal para Gestão do Rebanho)

Esta é a tela mais completa do sistema, lançada na Fase 2F. Tem 5 abas:

#### Aba 1 — Lotes por Pasto
- Exibe todos os lotes de animais agrupados por pasto
- **Header global da fazenda**: total de hectares, número de pastos, total de cabeças, peso médio ponderado geral
- **Bezerros** aparecem em uma sub-linha com destaque em **laranja**, com quantidade e peso médio separados
- Indicadores de bezerros também somam no header global
- Cada pasto tem seu próprio resumo (total de cabeças + peso médio ponderado por pasto)
- Botão **PDF** gera relatório profissional de lotes

#### Aba 2 — Transferir
- Move um lote de um pasto para outro
- Registra a transferência no histórico de manejos com data e observações
- Select de origem exibe: nome do lote, categoria e quantidade de cabeças

#### Aba 3 — Evolução
Tem 3 sub-abas:

- **Categoria**: evolui a categoria do lote (ex: Bezerro → Novilha). Se o lote tem bezerros, aparece campo adicional "Novo peso médio — Bezerros"
- **Parição**: registra nascimentos de bezerros no lote
- **Desmama**: separa bezerros do lote de origem para criar novo lote de desmamados. Exibe "Bezerros disponíveis: X cab." ao selecionar lote

#### Aba 4 — Saída (Abate / Venda)
- Registra saída total ou parcial de um lote
- Motivo: **Abate** ou **Venda**
- Permite informar quantidade saída (parcial) sem precisar desagrupar o lote
- Lote com quantidade zerada é encerrado automaticamente

#### Aba 5 — Histórico
- Tabela completa de todos os manejos realizados
- Filtros por: período (data início/fim), tipo de manejo e pasto
- Badges coloridos por tipo (Transferência, Evolução, Parição, Desmama, Saída)
- Botão **PDF profissional**: layout paisagem, barra verde da marca, cards de resumo por tipo, tabela com badges coloridos

---

### 2.4 Módulo: Lançamento (Formulário de Suplementação)

Tela para registrar o uso diário de suplemento nos pastos:

- **Date picker** com bloqueio de datas futuras
- **Select de pasto** dinâmico (carrega pastos do banco)
- **Select de suplemento** dinâmico (carrega tipos cadastrados no banco)
- Ao selecionar pasto: **auto-fill** da quantidade recomendada + badge mostrando "N° lotes no pasto"
- Campos: quantidade (kg), sacos, período de suplementação
- Importação via **Excel**: drag & drop, mapeamento de colunas, preview e import em lote

---

### 2.5 Módulo: Relatórios (Dashboard de Consumo)

Tela principal de análise de dados:

- **Header dinâmico**: nome da fazenda + badge de role (Admin/Cliente)
- **Filtros em card** com 4 colunas:
  - Filtro por **mês** (chips derivados dos lançamentos existentes)
  - Filtro por **suplemento**
  - Filtro por **pasto**
  - *(Pendente)* Filtro por range de datas
- **StatsOverview**: 4 cards de KPI (total de sacos, total kg, média diária, número de pastos)
- **SummaryChart**: gráfico de barras empilhadas com legenda lateral esquerda — visão geral de todos os suplementos
- **SupplementSection**: uma seção por tipo de suplemento, cada uma com:
  - Header na cor do suplemento
  - Tabela full-width com colunas: data, pasto, quantidade, período, sacos, kg, consumo
  - Colunas numéricas em verde `#1a6040`
  - Gráfico de barras abaixo da tabela
- **Export Excel**: botão exporta dados filtrados como `.xlsx`
- **Export PDF**: impressão via CSS `@media print` com layout limpo

---

### 2.6 Módulo: Cadastros

Gestão de todos os dados base do sistema. Tem 5 abas:

#### Pastos
- Lista todos os pastos da fazenda
- Campos: nome, área (ha), observações, tipo de forragem, qualidade da forragem
- Edição inline
- **Botão PDF**: gera relatório portrait com barra verde, sumário de área total, tabela numerada

#### Animais
- Cadastro de lotes animais
- Campos: nome do lote, quantidade, raça, categoria, peso médio, sexo, pasto atual, status
- Suporte a bezerros: quantidade e peso médio separados

#### Suplementos
- Cadastro de tipos de suplemento
- Campos: nome, unidade, peso por embalagem, valor por kg, observações
- **Coluna CONSUMO**: 9 opções padronizadas (ranges de g/100kg PV até % PV)

#### Funcionários
- Nome, função, contato

#### Equipamentos
- Nome, tipo, quantidade, observações

---

### 2.7 Módulo: Usuários

Tela administrativa (visível apenas para Admin):

- Tabela de todos os usuários cadastrados
- Criar, editar e desativar usuários
- Para cada usuário: nome, email, role (admin/cliente), módulos habilitados, fazenda vinculada, status ativo

---

### 2.8 Módulo: Fazendas

Gestão das fazendas do sistema (visível apenas para Admin):

- Cards de fazendas com nome, status e ações
- Criar, editar e desativar fazendas
- Cliente vê apenas informações da sua fazenda (readonly)

---

## 3. Identidade Visual e Design Tokens

O design segue um guia aprovado baseado em Figma:

| Token | Valor | Uso |
|-------|-------|-----|
| Verde Marca | `#1a6040` | Cor principal, headers, números de tabela |
| Navy | `#0b2748` | Suplemento Mineral Adensado Águas |
| Roxo | `#6b2fa0` | Ração Creep |
| Laranja | `orange-*` | Bezerros em toda a interface |
| Sidebar | `#1a1f2e → #2d3548` | Gradiente do menu lateral |
| Teal override | `teal-600 = #1a6040` | Override Tailwind em `index.css` |

**Regras fixas:**
- Sem `LabelList` nas barras dos gráficos (aprovado em revisão)
- SummaryChart sempre com legenda à esquerda e gráfico à direita
- MetricCard com badge de trend (verde-50 positivo / vermelho-50 negativo)
- PDF sempre com barra verde da marca no topo

---

## 4. Arquitetura Técnica

### Stack Completo

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Estilo | Tailwind CSS v4 |
| Gráficos | Recharts 2 |
| Routing | React Router 7 |
| Formulários | React Hook Form |
| Animações | Motion (motion/react) |
| Notificações | Sonner (toasts) |
| Ícones | Lucide React |
| Backend/Auth | Supabase (self-hosted via EasyPanel) |
| Import/Export | SheetJS (xlsx) |
| Deploy | Docker + Nginx no EasyPanel |

### Banco de Dados (PostgreSQL via Supabase)

| Tabela | Descrição |
|--------|-----------|
| `farms` | Fazendas |
| `profiles` | Usuários com módulos e farm_id |
| `pastures` | Pastos com área, forragem e qualidade |
| `data_entries` | Lançamentos de suplementação |
| `animals` | Lotes de animais com bezerros |
| `supplement_types` | Tipos de suplemento com consumo |
| `employees` | Funcionários |
| `animal_categories` | Categorias (Bezerro, Novilha, Vaca, etc.) |
| `manejo_historico` | Histórico de todos os manejos |

**Segurança:** Row Level Security (RLS) em todas as tabelas — cada usuário só acessa dados da sua própria fazenda.

### Estrutura de Arquivos

```
suplemento-control/
├── src/
│   ├── App.tsx                  ← Router + Providers
│   ├── lib/
│   │   ├── supabase.ts          ← Cliente Supabase
│   │   ├── data.ts              ← Cores e ordem dos suplementos
│   │   └── utils.ts             ← Formatação e cálculos
│   ├── context/
│   │   ├── AuthContext.tsx      ← Auth + perfil + módulos
│   │   └── DataContext.tsx      ← Lançamentos + pastos (global)
│   ├── services/
│   │   ├── manejoService.ts     ← CRUD animais + histórico
│   │   ├── farmService.ts       ← CRUD fazendas
│   │   └── userService.ts       ← CRUD usuários
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Manejos.tsx          ← 5 abas de manejo
│   │   ├── Formulario.tsx       ← Lançamentos + import
│   │   ├── Relatorio.tsx        ← Dashboard + filtros + export
│   │   ├── Cadastros.tsx        ← 5 abas de cadastro
│   │   ├── Fazendas.tsx
│   │   └── Usuarios.tsx
│   └── components/
│       ├── DashboardLayout.tsx  ← Sidebar + seletor de fazenda
│       ├── ProtectedRoute.tsx   ← Guards de rota
│       ├── SummaryChart.tsx     ← Gráfico geral
│       ├── SupplementSection.tsx← Seção por suplemento
│       ├── StatsOverview.tsx    ← 4 KPI cards
│       ├── MetricCard.tsx       ← Card com trend
│       ├── Skeleton.tsx         ← Loading states
│       └── ImportExcelModal.tsx ← Upload + mapeamento
└── supabase/
    ├── schema.sql               ← Schema base
    └── ajustes_v116b.sql        ← Migrations + RLS completas
```

---

## 5. Progresso Atual — O que já foi feito

| Fase | Tasks | Concluídas | Status |
|------|-------|-----------|--------|
| Fase 0 — Protótipo HTML | 13 | 13 | ✅ Concluída |
| Fase 1 — React + Vite | 24 | 24 | ✅ Concluída |
| Fase 1.5 — Auth + Multi-tenant | 16 | 16 | ✅ Concluída |
| Fase 1.6 — Migração Supabase | 10 | 10 | ✅ Concluída |
| Fase 2A–E — Melhorias Avançadas | 19 | 17 | 🔄 89% |
| Fase 2F — Módulo Manejos | 10 | 10 | ✅ Concluída |
| Fase 2G — PDF Profissional + Ajustes | 19 | 19 | ✅ Concluída |
| Fase 2H — Formulário Redesign | 4 | 4 | ✅ Concluída |
| Fase 2I — Entregas Finais | 4 | 0 | ⏳ Pendente |
| Fase 3 — SaaS Escala | 5 | 0 | ⬜ Futuro |
| **TOTAL** | **124** | **113** | **91%** |

### Destaques do que foi entregue

- **v1.17** — Formulário completamente redesenhado + auto-fill inteligente + fix do bug de cursor na Desmama
- **PDF profissional** — Histórico de Manejos (landscape, brand bar verde, badges coloridos) e Pastos (portrait, tabela numerada)
- **Módulo Manejos completo** — Lotes por Pasto com bezerros em laranja, Transferência, Evolução (Categoria/Parição/Desmama), Saída, Histórico
- **Import Excel** — drag & drop, mapeamento automático de colunas, preview e import em lote
- **Export Excel e PDF** — dados filtrados exportados em um clique
- **Deploy em produção** — Dockerfile + Nginx + EasyPanel, com Supabase self-hosted no mesmo servidor
- **Sync automático** — dados atualizam silenciosamente ao voltar ao foco da aba ou reconectar à internet

---

## 6. O que Falta para Finalizar

Restam **4 tarefas** na Fase 2I (Entregas Finais):

### T-281 — Redesign do Relatório / Dashboard Corporativo
**Prioridade: Alta**

A tela de Relatórios funciona bem, mas visualmente precisa de um redesign completo para ficar com o nível de apresentação que o cliente espera. Isso inclui:
- Novo layout do header e filtros
- Cards de KPI com visual mais impactante
- Gráficos com mais destaque visual
- Hierarquia visual mais clara entre os suplementos

### T-285 — Documentar Formato Excel para Importação
**Prioridade: Média**

Criar documentação clara (e possivelmente um template Excel para download) explicando o formato de arquivo aceito pelo sistema de importação. Isso reduz o suporte e facilita a adoção pelo cliente.

### T-230 — Filtro por Range de Datas no Relatório
**Prioridade: Média**

Hoje o filtro de período funciona por mês (chips). Adicionar filtro por data início e data fim permite análises mais específicas, como "quinzena" ou "semana".

### T-231 — Responsividade Tablet e Mobile
**Prioridade: Baixa-Média**

O sistema foi construído para desktop. Adaptar o layout para funcionar em tablets e celulares. Isso envolve:
- Sidebar colapsável ou menu hamburguer
- Tabelas com scroll horizontal
- Gráficos responsivos
- Formulários com campos em coluna única

---

## 7. Futuro — Upgrades Planejados (Fase 3 SaaS)

Após a conclusão das entregas finais, o sistema tem um roadmap de evolução para se tornar um produto SaaS completo:

### T-300 — Landing Page Pública
Uma página de apresentação do produto Movimento Pecuário, com:
- Apresentação das funcionalidades
- Planos e preços
- Formulário de contato / cadastro
- Integração com o sistema de assinatura

### T-301 — Planos de Assinatura
Monetização do sistema com:
- Integração com **Mercado Pago** ou **Stripe**
- Planos: Básico (1 fazenda), Profissional (múltiplas fazendas), Enterprise
- Gestão de assinaturas no painel admin
- Controle de trial / expiração

### T-302 — Alertas de Consumo Fora da Média
Sistema de notificações inteligente:
- Detecta quando o consumo de suplemento está muito acima ou abaixo da média histórica
- Alerta por e-mail ou notificação no sistema
- Configurável por suplemento e pasto

### T-303 — Relatórios Comparativos entre Fazendas
Para clientes com múltiplas fazendas (ou para o admin):
- Comparar consumo entre propriedades
- Benchmark de desempenho
- Relatório consolidado multi-fazenda

### T-304 — API Pública
Para integrações com sistemas externos:
- API REST documentada
- Autenticação por API key
- Webhooks para eventos (novo lançamento, manejo, etc.)
- Integração com outros sistemas de gestão rural

### Upgrades Adicionais Possíveis (não formalizados)

- **Formulário Pasto**: módulo dedicado para gestão agronômica dos pastos (já aparece como "Em Breve" na sidebar)
- **Livro Caixa**: controle financeiro básico vinculado às fazendas (já aparece como "Em Breve" na sidebar)
- **App Mobile**: versão nativa para iOS e Android (React Native / Expo)
- **Integração com balanças digitais**: importação automática de pesagens
- **Histórico de preços de suplemento**: análise de custo ao longo do tempo
- **Mapa de pastos**: visualização geográfica com área, lotação e qualidade de forragem
- **Relatórios em PDF automáticos**: envio mensal por e-mail para o produtor

---

## 8. Deploy e Infraestrutura

### Onde roda hoje
- **Frontend**: React SPA servido por Nginx no Docker
- **Backend/Banco**: Supabase self-hosted no EasyPanel (VPS próprio)
- **Servidor**: EasyPanel gerenciando containers Docker

### Como fazer deploy
1. Push no repositório GitHub
2. EasyPanel detecta mudança e faz build do Dockerfile
3. Nginx serve os arquivos do `dist/`

### Variáveis de Ambiente
```
VITE_SUPABASE_URL=https://saas-supabase.bj3amt.easypanel.host
VITE_SUPABASE_ANON_KEY=<chave pública>
```

---

## 9. Usuários de Teste

| Email | Senha | Role | Acesso |
|-------|-------|------|--------|
| admin@suplemento.com | admin123 | Admin | Todas as fazendas, todos os módulos |
| cliente@malhada.com | malhada123 | Cliente | Fazenda Malhada Grande, módulos habilitados |

---

## 10. Resumo Executivo

O **Suplemento Control** é um sistema web de gestão pecuária desenvolvido para o projeto **Movimento Pecuário** da cliente Stela. Nasceu como um protótipo HTML simples para controlar o consumo de suplemento em fazendas, e evoluiu ao longo de múltiplas fases para um sistema SaaS multi-tenant completo com banco de dados real, autenticação, múltiplos módulos e geração de PDFs profissionais.

**O que ele resolve:**
- Controle preciso do consumo de suplemento mineral e proteico
- Gestão de rebanho com lotes, categorias, pesos e bezerros
- Registro de todos os manejos (transferência, evolução, parição, desmama, saída)
- Relatórios e dashboards para tomada de decisão
- Multi-fazenda com controle de acesso por módulo

**Onde está hoje:**
- 91% concluído (113 de 124 tarefas)
- Em produção, com dados reais do cliente
- Versão v1.17 estável

**O que falta:**
- Redesign visual do Relatório/Dashboard (T-281)
- Filtro por range de datas (T-230)
- Responsividade mobile (T-231)
- Documentação do Excel de importação (T-285)

**Para onde vai:**
- Landing page + planos de assinatura = produto SaaS comercializável
- Alertas inteligentes + relatórios comparativos = ferramenta de gestão avançada
- API pública = integração com o ecossistema de gestão rural

---

*Documento gerado para uso no NotebookLM — contexto completo do sistema Suplemento Control / Movimento Pecuário.*
