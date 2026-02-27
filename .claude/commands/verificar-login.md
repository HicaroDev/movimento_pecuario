# /verificar-login — Auditoria Completa do Fluxo de Auth

Você é um auditor de qualidade. Verifique se o sistema de autenticação do `suplemento-control` está 100% funcional e sem regressões. Siga os passos abaixo:

## 1. ARQUIVOS A AUDITAR

| Arquivo | O que verificar |
|---------|----------------|
| `src/lib/supabase.ts` | Cliente único com anon key |
| `src/services/userService.ts` | `_adminClient` com service_role key + `storageKey: 'supabase-admin'` |
| `src/context/AuthContext.tsx` | `signInWithPassword`, `fetchProfile`, `signOut`, `hasModule()` |
| `src/components/ProtectedRoute.tsx` | Guarda de rota por auth + por módulo |
| `src/pages/Login.tsx` | Formulário, estado de loading, mensagem de erro |

## 2. CHECKLIST — AuthContext

- [ ] Login usa `supabase.auth.signInWithPassword`
- [ ] Após login, `fetchProfile` busca na tabela `profiles` pelo `user.id`
- [ ] `AuthUser` expõe: `id`, `name`, `email`, `role`, `farmId`, `modules`, `active`
- [ ] `isAdmin` = `role === 'admin'`
- [ ] `hasModule(m)` verifica o array `modules` do perfil
- [ ] `signOut` chama `supabase.auth.signOut()` e limpa estado
- [ ] Usuário com `active = false` **não consegue logar** (verificar se há guarda)

## 3. CHECKLIST — userService

- [ ] `_adminClient` usa `VITE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] `_adminClient` tem `storageKey: 'supabase-admin'` (evita conflito de sessão)
- [ ] `create()` usa `_adminClient.auth.admin.createUser()` com `email_confirm: true`
- [ ] `create()` faz update na tabela `profiles` após criar o auth user
- [ ] `update()` atualiza apenas `profiles` (não mexe em auth.users)
- [ ] `remove()` faz soft delete (`active: false`) em `profiles`

## 4. CHECKLIST — ProtectedRoute

- [ ] Redireciona para `/login` se não autenticado
- [ ] `ModuleRoute` redireciona para `/` se módulo não habilitado no perfil
- [ ] Loading state enquanto verifica sessão (não pisca tela em branco)

## 5. CHECKLIST — Login.tsx

- [ ] Botão desabilitado e mostra "Entrando..." durante submit
- [ ] Mensagem de erro visível quando credenciais erradas
- [ ] Não há múltiplas instâncias GoTrueClient no console

## 6. CHECKLIST — Conflito de clientes Supabase

- [ ] Apenas **um** `createClient` com anon key (em `src/lib/supabase.ts`)
- [ ] O `_adminClient` em `userService.ts` tem `storageKey` diferente do padrão
- [ ] Sem warning "Multiple GoTrueClient instances" no console

## 7. AÇÃO

Para cada item com `[ ]`:
1. Leia o arquivo correspondente
2. Identifique o desvio
3. Corrija o problema
4. Rode `npm run build` ao final — deve terminar `✓ built` sem erros TypeScript

Reporte um resumo: quantos itens estavam conformes ✅ e quantos foram corrigidos 🔧.
