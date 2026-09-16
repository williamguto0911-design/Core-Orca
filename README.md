# Core-Orca V12

Correção da busca de materiais e serviços no componente compartilhado por:
- Orçamentos
- Ordens de Serviço
- Recibos

A busca agora é parcial, reage enquanto digita, ignora acentos/maiúsculas e pesquisa código, nome, descrição, categoria e fabricante. Também aceita múltiplas palavras, como `cabo 2,5`.

A inclusão automática dos materiais vinculados a um serviço foi preservada.

## Atualização
Não existe SQL V12 e não é necessário alterar/republicar a Edge Function.

Substitua no GitHub:
- `app.js`
- `style.css`

Depois faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
