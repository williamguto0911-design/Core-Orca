# Core-Orca V14

## Menus suspensos com pesquisa

A V14 adiciona pesquisa aos menus suspensos do sistema.

O componente é aplicado automaticamente aos `select` existentes e também aos menus criados dinamicamente em modais.

### Funcionamento
- Clique no menu suspenso.
- Um campo **Pesquisar...** aparece dentro do dropdown.
- A busca é parcial.
- Ignora maiúsculas/minúsculas e acentos.
- A opção selecionada continua disparando o evento `change` original do sistema.

Isso inclui os seletores de Cliente, Material/Serviço, fornecedores, técnicos e demais cadastros que usam menus suspensos.

Menus pequenos de controle, como o seletor `Material/Serviço` e alguns status booleanos, foram mantidos nativos para evitar alterar lógica interna desnecessariamente.

## Atualização
Não há SQL novo e não há alteração na Edge Function.

Substitua:
- `app.js`
- `style.css`

Depois faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
