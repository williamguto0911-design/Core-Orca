# Core-Orca V11

## Novidades
- Ao cadastrar uma empresa, o Administrador informa nome/e-mail do Gerente.
- Uma Edge Function cria o usuário no Supabase Auth e gera uma senha temporária aleatória.
- A senha temporária é exibida uma única vez ao Administrador.
- No primeiro login, o Gerente é obrigado a definir uma nova senha antes de usar o sistema.
- Empresas podem ser excluídas pelo Administrador com dupla confirmação.
- Cada empresa passa a possuir licenças individuais.
- O Administrador pode adicionar, ativar, bloquear e excluir cada licença.
- Usuário operacional só acessa a empresa se estiver vinculado a uma licença ativa.
- A empresa "Administração Core Orça" não pode ser excluída.

## IMPORTANTE — instalação da V11

### 1. Banco
Execute `supabase-v11.sql` no SQL Editor.

### 2. Edge Function
A criação segura de usuários NÃO pode ser feita no `app.js`, porque a chave Service Role nunca deve ficar no navegador.

Faça deploy da pasta:
`supabase/functions/core-orca-admin-users/index.ts`

Com Supabase CLI, dentro da pasta do projeto:
`supabase functions deploy core-orca-admin-users`

O Supabase fornece as variáveis de ambiente necessárias à função hospedada. Não coloque a Service Role no GitHub nem no HTML.

### 3. Frontend
Substitua no GitHub:
- `index.html`
- `style.css`
- `app.js`

Depois faça commit na `main`, aguarde o Pages e use Ctrl+F5.

## Fluxo do Gerente
1. Administrador cria a empresa.
2. Informa nome/e-mail do Gerente.
3. Sistema cria o login e mostra a senha temporária.
4. Administrador repassa login + senha.
5. Gerente entra.
6. Popup obrigatório pede nova senha.
7. Após a alteração, o sistema libera os módulos da empresa.

## Exclusão
Excluir uma empresa apaga os dados operacionais vinculados a ela por `ON DELETE CASCADE` e a Edge Function também tenta excluir do Supabase Auth os usuários vinculados à empresa. A empresa administradora é protegida contra exclusão.
