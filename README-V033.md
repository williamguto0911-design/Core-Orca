# Core-Orça V033 — Usuários por empresa

Ajustes no módulo Gerenciar Usuários:

- Usuário criado por um Gerente recebe automaticamente a empresa do gerente autenticado.
- O frontend não envia mais `empresa_id` na criação de usuário; a Edge Function determina a empresa pelo contexto autenticado.
- Gerente pode excluir usuários da própria empresa.
- Exclusão remove o vínculo em `empresa_usuarios`, remove o login no Supabase Auth e libera a licença.
- Gerente não pode excluir usuário de outra empresa.
- Gerente não pode excluir o próprio login durante a sessão.
- A empresa não pode ficar sem nenhum gerente ativo.

## Instalação

1. Substitua `app.js`.
2. Faça redeploy da Edge Function `core-orca-admin-users` usando o `index.ts` desta versão.
3. Não há SQL novo nesta versão.
4. Após publicar o site, faça Ctrl+F5.
