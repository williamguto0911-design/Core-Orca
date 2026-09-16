# Core-Orça V15.5 — Correção de Cargos

Corrige o erro de RLS ao criar um cargo.

## Causa
O frontend tentava inserir diretamente em `public.cargos`. A nova versão usa uma RPC segura que:
- identifica a empresa do usuário autenticado;
- grava `empresa_id` explicitamente;
- permite Gerente ou usuário com permissão de escrita em Configurações;
- impede o Administrador da Plataforma de alterar cargos internos das empresas;
- garante que a edição só atinja cargos da própria empresa.

## Instalação
1. Execute `supabase-v15.5.sql` no SQL Editor do Supabase.
2. Substitua somente `app.js` no GitHub.
3. Faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
4. Saia e entre novamente no sistema antes de testar `Cargos e Permissões → + Cargo`.

Não é necessário alterar a Edge Function.
