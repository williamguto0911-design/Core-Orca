# Core-Orca V9 — Correção de acesso aos módulos

A V9 corrige o caso em que, após a migração multiempresa da V7, o usuário entra no sistema mas somente o botão Dashboard aparece.

## Causa
O menu já estava com o CSS correto na V8. Os demais botões eram ocultados porque o login não estava sendo reconhecido como Gerente/Colaborador de uma empresa ativa.

## Correções
- Contexto de usuário mais robusto.
- Comparação de e-mails normalizada.
- Gerente sempre recebe acesso completo aos módulos da própria empresa.
- Colaborador continua respeitando as permissões do cargo.
- Administrador SaaS continua sem acesso aos dados operacionais.
- Nova tentativa automática de migrar usuários antigos para a Empresa Principal.
- RPC de reparo para login antigo sem vínculo.
- Mantida a correção de rolagem do menu da V8.

## Instalação
1. Execute `supabase-v9.sql` no SQL Editor do Supabase.
2. Substitua no GitHub:
   - `index.html`
   - `style.css`
   - `app.js`
3. Commit na `main`.
4. Ctrl + F5.
5. Saia e entre novamente no sistema.

## Se ainda aparecer somente Dashboard
Com o usuário operacional logado, abra o Console do navegador e execute:

`await sb.rpc('reparar_meu_acesso_empresa_principal')`

Depois saia e entre novamente.

Essa função só repara usuários sem vínculo ativo. Ela não permite que um Administrador SaaS acesse os dados de uma empresa.
