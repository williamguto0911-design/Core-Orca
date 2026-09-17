# Core-Orça V15.9

Corrige a regressão da Edge Function da V15.8 que afetou criação de empresa/Gerente e exclusão de empresa.

## Instalação
1. Execute `supabase-v15.9.sql` no SQL Editor.
2. Republique `core-orca-admin-users` com `supabase/functions/core-orca-admin-users/index.ts`.
3. Substitua `app.js` no GitHub Pages.
4. Commit, Ctrl+F5 e novo login.

A V15.9 também exibe o erro real devolvido pela Edge Function. PDFs profissionais, assinatura gráfica da OS e senha temporária de usuários foram preservados.
