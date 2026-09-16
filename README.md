# Core-Orca V13

## Correção do seletor de materiais/serviços

O campo de pesquisa foi removido do editor de itens de:
- Orçamentos
- Ordens de Serviço
- Recibos

Ele foi substituído por um **menu suspenso (`select`)**, seguindo o mesmo funcionamento usado para selecionar Clientes.

### Funcionamento
1. Escolha `Material` ou `Serviço`.
2. O segundo menu é preenchido automaticamente com os cadastros correspondentes.
3. Selecione o material/serviço.
4. O valor unitário é preenchido automaticamente.
5. Informe a quantidade.
6. Clique em `Adicionar item`.

Os materiais aparecem ordenados alfabeticamente e, quando disponíveis, mostram código e categoria.

Ao selecionar um Serviço, os materiais vinculados ao serviço continuam sendo incluídos automaticamente.

## Atualização
Não há SQL V13 e não há alteração na Edge Function.

Substitua no GitHub:
- `app.js`
- `style.css`

Depois faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
