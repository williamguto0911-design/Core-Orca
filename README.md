# Core-Orca V2

## O que foi adicionado
- Cadastro de Serviços.
- Orçamentos com materiais e serviços.
- Busca parcial de materiais/serviços ao montar orçamento e OS.
- Ordens de Serviço.
- Conversão de orçamento em OS.
- Baixa automática de materiais do estoque ao concluir uma OS.
- Layout responsivo para computador e celular.
- Mantém Clientes, Materiais, Estoque e importação CSV da V1.

## INSTALAÇÃO — faça nesta ordem
1. No Supabase, abra **SQL Editor**.
2. Execute todo o arquivo `supabase-v2.sql`.
3. No GitHub, substitua `index.html`, `style.css` e `app.js` pelos arquivos deste ZIP.
4. Faça commit na branch `main`.
5. Aguarde o GitHub Pages publicar.
6. Abra o site com Ctrl+F5.

## Importante
- Não apague as tabelas da V1.
- O SQL foi feito para acrescentar a V2.
- Ao concluir uma OS, o banco verifica o estoque. Se faltar material, a OS não é concluída e nenhuma baixa parcial é feita.
- Uma OS já baixada não baixa o estoque novamente.
- O `service_role` não é usado no navegador.

## Materiais CSV
Cabeçalhos aceitos:
codigo,nome,descricao,categoria,fabricante,unidade,estoque_atual,estoque_minimo,custo,preco_venda

Também aceita `;` como separador.

## Próxima etapa sugerida
PDF de orçamento/OS, fotos, assinatura do cliente, agenda e financeiro.
