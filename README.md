# Core-Orça V15.7

## Correções

### Clientes isolados por empresa
A V15.7 remove todas as policies antigas de `public.clientes` e recria regras estritas por `empresa_id`.

Além do RLS:
- o frontend filtra explicitamente clientes pela empresa logada;
- novos clientes recebem o `empresa_id` da sessão;
- edição/exclusão também exigem a empresa atual;
- um trigger impede alterar o cliente de uma empresa para outra;
- o Administrador da Plataforma não recebe acesso aos clientes operacionais.

### Catálogo Base somente sob demanda
Os 1.311 materiais continuam em `catalogo_materiais_base`, mas não são copiados automaticamente para `materiais`.

A cópia só ocorre quando o usuário usa:
- seleção manual no **Catálogo Core-Orça**; ou
- **Importar catálogo completo**.

Criar empresa, gerente ou licença não executa importação do catálogo nesta versão.

## Instalação
1. Execute `supabase-v15.7.sql` no SQL Editor.
2. Substitua `app.js` no GitHub.
3. Commit, aguarde o Pages e pressione Ctrl+F5.
4. Saia e entre novamente.
5. Teste com duas empresas diferentes: um cliente criado na Empresa A não deve aparecer na Empresa B.

Não é necessário alterar a Edge Function.
