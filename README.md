# Core-Orça V15.3 — Paginação de Materiais

Corrige o limite visual de 1.000 materiais.

## Correção
`loadMateriais()` agora busca os registros em páginas de 1.000 até não haver mais resultados. Portanto, todos os materiais ativos da empresa ficam carregados no estado `materiais`.

Isso corrige os dados usados por:
- Dashboard;
- página Materiais;
- Estoque;
- seletores de materiais em Orçamentos, OS e Recibos;
- materiais vinculados a Serviços;
- demais telas que utilizam o array global `materiais`.

A tela administrativa do Catálogo Base também passa a carregar todas as páginas do catálogo.

## Instalação
Não execute SQL e não altere a Edge Function.

Substitua somente `app.js` no GitHub, faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.

No cenário atual, com 1.311 itens do catálogo + 1 material próprio ativo, o Dashboard deve passar de 1.000 para 1.312 materiais.
