# Core-Orca V8

## Correção principal

A V8 corrige o menu lateral da V7.

### Problema corrigido
Na V7, o `<nav>` lateral usava `display: grid` e também ocupava todo o espaço livre da sidebar.
Quando permissões ocultavam parte dos menus, as poucas linhas restantes do Grid eram esticadas verticalmente.
Isso fazia, por exemplo, o botão Dashboard ocupar uma área enorme.

### Novo comportamento
- Cabeçalho/logo permanece no topo.
- Itens do menu ficam imediatamente um abaixo do outro.
- Cada botão mantém altura normal.
- Quando houver mais opções do que cabem na tela, somente a lista de menus terá rolagem vertical.
- E-mail do usuário e botão Sair permanecem na parte inferior.
- Compatível com desktop e celular.
- Usa `100dvh` em navegadores modernos para melhorar o comportamento em telas móveis.

## Instalação

A V8 NÃO exige alteração no banco de dados.

Não execute novamente `supabase-v7.sql`.

Substitua no GitHub:
- `index.html`
- `style.css`
- `app.js`

Depois:
1. Faça commit na branch `main`.
2. Aguarde o GitHub Pages atualizar.
3. Pressione `Ctrl + F5`.

## Banco de dados
A V8 continua utilizando normalmente o banco/migração da V7.
