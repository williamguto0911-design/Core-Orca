# Core Orça — V038

## Padronização da marca

Esta versão corrige o nome exibido do sistema de **Core Orca / Core-Orca** para **Core Orça**.

A alteração foi aplicada aos textos visíveis do sistema, incluindo:
- título da página;
- tela de login;
- identificação no menu lateral;
- nome padrão exibido nos documentos quando a empresa não possui nome fantasia configurado.

Os identificadores técnicos que podem afetar integrações foram preservados, como o nome da Edge Function `core-orca-admin-users` e nomes de arquivos SQL já existentes.

## Atualização

1. Substitua `index.html`, `app.js` e `style.css` pelos arquivos desta versão.
2. Faça commit no GitHub e aguarde a publicação do GitHub Pages.
3. Atualize a página com `Ctrl + F5`.

Não há alteração de banco de dados nesta versão e não é necessário executar SQL nem republicar a Edge Function.
