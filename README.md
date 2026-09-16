# Sistema de Gestão de Manutenção Elétrica

V1: clientes, materiais, estoque, login e importação CSV.

## Instalação

1. Crie/abra o projeto no Supabase.
2. Abra **SQL Editor**.
3. Cole e execute `supabase.sql`.
4. No Supabase, crie um usuário em **Authentication > Users > Add user**.
5. Suba `index.html`, `style.css` e `app.js` para o GitHub.
6. Ative GitHub Pages em **Settings > Pages > Deploy from branch**.
7. Abra o endereço do GitHub Pages e faça login com o usuário criado.

## CSV

O importador aceita `,` ou `;` e tenta reconhecer:
`codigo;nome;descricao;categoria;fabricante;unidade;estoque_atual;estoque_minimo;custo;preco_venda`

Para códigos existentes, o importador atualiza o material.
