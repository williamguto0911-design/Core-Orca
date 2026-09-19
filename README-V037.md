# Core-Orça V037 — Validade da licença

## O que mudou
- Antes de liberar o sistema, qualquer usuário de empresa consulta a validade da licença.
- Se a empresa estiver bloqueada ou a licença estiver expirada, o login é encerrado e a tela de login informa que a licença expirou/bloqueou e orienta entrar em contato com o administrador do sistema.
- A data de validade é inclusiva: uma licença com validade em 30/09 funciona durante 30/09 e expira em 01/10.
- Quando faltarem de 0 a 10 dias para o vencimento, aparece um aviso no canto superior direito com a data exata de expiração.
- O Administrador da Plataforma não é submetido ao bloqueio de licença de empresa.

## Instalação
1. Execute `supabase-v037-validade-licenca.sql` no SQL Editor do Supabase.
2. Substitua `app.js` e `style.css` pelos arquivos desta versão.
3. Publique o site e faça Ctrl+F5.

Não é necessário alterar a Edge Function nesta versão.
