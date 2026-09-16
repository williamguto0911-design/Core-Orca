# Core-Orca V10 — Administração Core Orça

## Configuração solicitada
A migração cria/garante:
- Empresa administradora: **Administração Core Orça**
- Administrador da plataforma: **admin@coreorca.com.br**
- Aba **Empresas e Licenças**

## O que o Administrador pode fazer
- Cadastrar empresas clientes do Core-Orça.
- Definir quantidade de licenças.
- Definir validade da licença.
- Ativar/bloquear uma empresa.
- Informar responsável comercial.
- Informar Gerente inicial da empresa.
- Visualizar quantidade de licenças contratadas e utilizadas.
- Editar posteriormente os dados comerciais/licenciamento.

## Separação dos dados
O login `admin@coreorca.com.br` é Administrador SaaS. Ele administra a plataforma e o licenciamento, mas não é usuário operacional das empresas e não consulta clientes, materiais, financeiro, OS etc. Isso mantém o isolamento entre empresas.

Cada empresa licenciada possui seu próprio Gerente. O Gerente controla todos os dados da própria empresa e cadastra Colaboradores conforme a quantidade de licenças disponível.

## Instalação
1. Execute `supabase-v10.sql` no SQL Editor do Supabase.
2. Se executar sem erro, substitua no GitHub:
   - `index.html`
   - `style.css`
   - `app.js`
3. Commit na `main`.
4. Ctrl + F5.
5. Saia e entre novamente com `admin@coreorca.com.br`.

Ao entrar com esse login, a tela principal deverá ser **Empresas e Licenças**.

## Observação
Não execute novamente os SQLs V7/V9 depois da V10.
