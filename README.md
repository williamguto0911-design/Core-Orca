# Core-Orça V15.4 — Busca inteligente e máscaras

## Busca inteligente
A busca agora:
- ignora acentos e pontuação;
- ignora maiúsculas/minúsculas;
- aceita várias partes/abreviações na mesma consulta;
- exige que cada termo digitado exista em algum ponto do cadastro;
- pesquisa todos os campos disponíveis do registro.

Exemplo: `abrac nylo 100` encontra `Abraçadeira Nylon 100mm`.

Em Clientes e Fornecedores, a busca também considera documento, telefone, celular, e-mail, CEP, endereço, número, bairro, cidade, estado e demais campos carregados. Documentos e telefones podem ser pesquisados com ou sem máscara.

O mesmo mecanismo foi aplicado às pesquisas de Materiais, Serviços, Estoque, Clientes, Fornecedores, Técnicos, Usuários, Cargos, Orçamentos, OS, Recibos, Compras, Catálogo Base, catálogo da empresa, pesquisa de material em compras e menus suspensos pesquisáveis.

## Máscaras
Foram adicionadas máscaras de:
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`
- CEP: `00000-000`
- Telefone: `(00) 0000-0000`
- Celular: `(00) 00000-0000`

Aplicadas aos formulários de Clientes, representante legal, contatos PJ, Fornecedores, Técnicos e Configurações da Empresa, conforme o tipo de campo.

## Instalação
Não há SQL novo e não há alteração na Edge Function.

Substitua:
- `app.js`
- `index.html`

Depois faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
