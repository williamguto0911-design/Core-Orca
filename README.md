# Core-Orca V5

## Novidades
- Edição de orçamento existente.
- Duplicação de orçamento.
- Edição dos principais dados/status da OS.
- Cadastro de fornecedores.
- Compras com itens de material.
- Confirmação da compra gera entrada automática no estoque.
- Confirmação da compra gera conta a pagar no Financeiro.
- Cadastro de perfis: Administrador, Escritório e Técnico.
- Restrições de menus para Técnico.
- Logo da empresa nos documentos.
- Mantém fotos, assinatura, agenda, financeiro, histórico, estoque e demais funções anteriores.

## Instalação
1. Não apague a V4 nem seus dados.
2. Execute `supabase-v5.sql` no SQL Editor do Supabase.
3. Se não houver erro, substitua no GitHub:
   - index.html
   - style.css
   - app.js
4. Commit na main e Ctrl+F5.

## Perfis
A V5 introduz os perfis sem endurecer imediatamente todas as políticas RLS do banco, para evitar bloquear os logins existentes.
O primeiro login sem perfil cadastrado continua sendo tratado como administrador pela aplicação.
Depois, em Usuários, associe os e-mails aos perfis desejados.

Importante: criar um perfil no Core-Orca não cria a senha/login no Supabase Auth. A conta de autenticação ainda deve existir no Supabase.

## Compras
A compra começa como Rascunho. Ao clicar em “Confirmar entrada”:
- os materiais entram no estoque;
- o custo cadastrado do material é atualizado para o custo da compra;
- uma despesa pendente é criada no Financeiro;
- a mesma compra não pode lançar estoque duas vezes.

## Logo
Em Configurações, selecione PNG, JPEG ou WebP. O arquivo é salvo no bucket `empresa-assets` e usado nos documentos.
