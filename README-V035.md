# Core-Orça V035 — acesso por cargo e Listas de Materiais

## Correções

- Corrige o embed ambíguo entre `listas_materiais` e `recibos`, usando explicitamente `listas_materiais_recibo_id_fkey`.
- Mantém as duas FKs existentes; nenhuma relação é removida.
- Mantém a policy que permite ao usuário autenticado ler o próprio vínculo em `empresa_usuarios`.
- Corrige o carregamento das permissões do cargo do colaborador por meio da RPC segura `meu_cargo_permissoes_v035()`.
- Menus liberados no cargo passam a usar as permissões carregadas do cargo do usuário.
- Gerentes continuam com acesso integral aos módulos da própria empresa.
- Mantém a criação de usuários com `auth_user_id`, empresa automática do gerente e exclusão segura da V034.

## Instalação

1. Execute `supabase-v035-acesso-cargos-listas.sql` no SQL Editor do Supabase.
2. Substitua `app.js` no site.
3. Faça redeploy de `supabase/functions/core-orca-admin-users/index.ts` caso ainda não tenha publicado a versão V034/V035 da função.
4. Publique e faça logout/login do usuário colaborador.
5. Faça Ctrl+F5.
