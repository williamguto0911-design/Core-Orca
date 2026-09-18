# Core-Orça V034 — Contexto e usuários

Correção baseada na estrutura real da tabela `empresa_usuarios`:
- vínculo Auth: `auth_user_id`
- perfil: `tipo`

Alterações:
- frontend carrega vínculo ativo diretamente por `auth_user_id = auth.uid()` quando necessário;
- remove dependência da mensagem/correção V9;
- Edge Function identifica gerente pela estrutura real;
- novo usuário criado pelo gerente recebe automaticamente `empresa_id` do gerente e `auth_user_id` do Auth criado;
- gerente pode excluir usuário da própria empresa; exclusão usa `auth_user_id` para remover o login correto;
- criação do gerente inicial também grava `auth_user_id`.

Instalação:
1. Execute `supabase-v034-contexto-usuarios.sql`.
2. Substitua `app.js`.
3. Redeploy da função `core-orca-admin-users` usando `supabase/functions/core-orca-admin-users/index.ts`.
4. Publique e faça logout/login (ou Ctrl+F5 antes do novo login).
