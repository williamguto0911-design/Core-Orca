# Core-Orca V7 — Multiempresa / SaaS

A V7 altera a arquitetura do Core-Orca para permitir venda de licenças e isolamento real entre empresas.

## Estrutura de acesso

### Administrador da plataforma
- Gerencia empresas, situação e quantidade de licenças.
- Não possui acesso aos clientes, materiais, financeiro, OS, orçamentos e demais dados operacionais das empresas.
- O isolamento é feito no Supabase/RLS, não apenas escondendo menus.

### Gerente
- Pertence a uma empresa.
- Acessa todos os módulos daquela empresa.
- Gerencia usuários, cargos e permissões da própria empresa.

### Colaborador
- Pertence a uma empresa.
- Recebe um cargo criado pelo Gerente.
- O cargo define permissões de Visualizar, Criar/Editar e Excluir por módulo.

## Novidades funcionais
- Cargos personalizados.
- Gestão de empresas e licenças.
- Limite de usuários ativos por empresa.
- Clientes PJ com representante legal e vários contatos.
- Código automático `MAT-000001` para novos materiais.
- Lucro em R$ e percentual sobre custo nos materiais.
- Recibos com itens e parcelamento por datas/valores.
- Materiais vinculados a serviços.
- Ao adicionar um serviço em Orçamento, OS ou Recibo, os materiais vinculados são adicionados automaticamente.
- Correção do seletor/pesquisa de materiais e serviços.
- Menu lateral rolável.
- Isolamento multiempresa nas tabelas operacionais.

## Instalação
1. Faça backup do banco Supabase antes desta migração.
2. Execute `supabase-v7.sql` no SQL Editor.
3. Se terminar sem erro, substitua no GitHub:
   - `index.html`
   - `style.css`
   - `app.js`
4. Commit na `main`.
5. Atualize com Ctrl+F5.

## Migração dos dados atuais
Os dados existentes são associados automaticamente à empresa `Empresa Principal`.
Os usuários já cadastrados na V6 são migrados como Gerentes dessa empresa para não perderem acesso.

## Criando o Administrador da plataforma
Por segurança, a migração NÃO transforma automaticamente seu usuário atual em Administrador da plataforma, porque isso faria esse login perder acesso aos dados operacionais.

Crie/entre com uma conta separada no Supabase Auth para ser o Administrador da plataforma. Enquanto ainda não existir nenhum administrador, essa conta pode chamar a função:
`bootstrap_platform_admin`

Depois disso, esse login verá apenas a área Administração SaaS e não verá os dados internos das empresas.

## Licenças
O Administrador define `licencas_max`, validade e situação da empresa.
O Gerente não consegue ativar usuários além da quantidade de licenças contratadas.

## Observação de segurança
A V7 endurece as políticas RLS. Por isso é importante executar o SQL antes de publicar os novos arquivos HTML/JS/CSS.
