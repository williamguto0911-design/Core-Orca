# Core-Orça V028 — Correção Lista de Materiais x OS

1. Execute `supabase-v028-lista-materiais-correcao-vinculo.sql` no SQL Editor do Supabase.
2. Substitua `app.js` no site pelo arquivo desta versão.
3. `index.html` e `style.css` foram mantidos na distribuição para facilitar a publicação completa.
4. Faça Ctrl+F5 após a publicação.

## Correção
A V027 usava `os` no frontend, enquanto o banco foi posteriormente ajustado para `ordem_servico`. A V028 padroniza os dois lados em `ordem_servico` e recria as duas constraints relacionadas ao vínculo.
