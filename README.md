# Core-Orca V6

## Foco da V6
Esta versão prioriza gestão, relatórios, exportação e segurança.

### Novidades
- Relatórios gerenciais por período.
- Receitas recebidas, despesas pagas e resultado.
- Quantidade de OS concluídas no período.
- Resumo financeiro por status.
- Lista de materiais com estoque baixo.
- Exportação CSV do Financeiro.
- Exportação CSV das Ordens de Serviço.
- Exportação CSV dos Materiais.
- Alertas no Dashboard:
  - estoque baixo;
  - lançamentos vencidos;
  - vencimentos nos próximos 7 dias;
  - compromissos do dia.
- PDFs/Impressão com layout A4 melhorado.
- RLS mais restritiva no Supabase:
  - Financeiro: Administrador e Escritório;
  - Fornecedores/Compras: Administrador e Escritório;
  - Configurações: todos autenticados podem ler, somente Administrador altera;
  - Perfis: Administrador gerencia, usuário pode consultar o próprio perfil.

## Instalação
1. Não apague a V5 ou seus dados.
2. Execute `supabase-v6.sql` no SQL Editor do Supabase.
3. Se o SQL executar sem erro, substitua no GitHub:
   - index.html
   - style.css
   - app.js
4. Faça commit na `main`.
5. Aguarde o GitHub Pages e pressione Ctrl+F5.

## Importante sobre usuários
A função de perfil usa o e-mail autenticado no Supabase Auth e procura o mesmo e-mail em `usuarios_perfis`.

Para preservar seu acesso durante a atualização, um login que ainda não tenha perfil cadastrado é tratado como Administrador. Depois que todos os usuários estiverem configurados, podemos remover esse fallback numa próxima migração e exigir perfil explícito.

## CSV
Os arquivos são gerados com separador `;` e BOM UTF-8, facilitando a abertura no Excel em português do Brasil.

## Alertas
Os alertas são calculados ao carregar os dados atuais. Não enviam notificações fora do sistema; eles aparecem no Dashboard.
