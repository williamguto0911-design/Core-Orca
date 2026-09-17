# Core-Orça V15.8

## Novidades

### Usuários criados pelo Gerente
Ao cadastrar um novo usuário em **Usuários e Permissões**, o Gerente agora chama a Edge Function `core-orca-admin-users`.

A função:
- valida que o solicitante é Gerente da mesma empresa;
- respeita o limite de licenças;
- cria o usuário no Supabase Auth;
- gera senha temporária aleatória;
- marca `deve_trocar_senha=true`;
- cadastra o vínculo na empresa;
- devolve a senha temporária uma única vez.

O fluxo de primeiro acesso já existente força a troca da senha.

### Assinatura na OS
O PDF/Impressão da OS agora inclui a imagem real da assinatura armazenada em `assinatura_data_url`, nome do cliente e data/hora da assinatura.

### Documentos
O layout comum de Orçamento, OS e Recibo foi redesenhado para A4:
- cabeçalho empresarial mais limpo;
- logo e dados da empresa;
- hierarquia visual do documento;
- tabela profissional;
- totais destacados;
- rodapé e data de emissão;
- área de assinatura na OS.

## Instalação

### GitHub Pages
Substitua somente `app.js`.

### Supabase Edge Function
Atualize/republique a função existente `core-orca-admin-users` usando:
`supabase/functions/core-orca-admin-users/index.ts`

A função precisa das variáveis padrão:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Não coloque a Service Role no frontend.

O `config.toml` incluído é para uso no projeto Supabase CLI; não deve ser publicado no GitHub Pages.

Não há SQL novo nesta versão.
