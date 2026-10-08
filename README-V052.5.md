# Core Orça V052.5 — Correção de importação do catálogo

## Instalação
1. Faça backup do banco antes de alterar funções/triggers.
2. Execute `supabase-v0525-correcao-importacao-catalogo.sql` no Supabase SQL Editor.
3. Publique `index.html`, `app.js` e `style.css` no site, caso ainda não sejam os arquivos atuais.
4. A Edge Function `supabase/functions/core-orca-admin-users/index.ts` está incluída **sem alterações**: não precisa republicá-la para esta correção.
5. Teste primeiro a importação de um material; depois a importação completa.

## Comportamento
- Novos materiais importados do catálogo recebem código MAT gerado pela sequência.
- Os códigos LM do catálogo base não são reutilizados em novas linhas da tabela de materiais da empresa.
- Nenhum código de material já existente é alterado.
- A restrição de unicidade continua ativa.

## Limites
- A correção atua sobre novos INSERTs; não corrige dados históricos ou problemas de permissões/RLS.
- Se houver outras funções ou triggers que substituem `codigo` depois deste trigger, pode ser necessário inspecionar as definições reais no Supabase.
- O SQL não altera as funções `importar_catalogo_v15` e `importar_catalogo_completo_v152`; a proteção é aplicada na camada comum de INSERT.
