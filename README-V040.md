# Core Orça V040

## Implementações
- Novo módulo comercial **Esquema Unifilar** com editor vetorial em grade, arrastar/soltar, conexões ortogonais, propriedades elétricas, múltiplos IDRs por quadro, associação de materiais, vínculo com orçamento/OS/lista de materiais, salvar/abrir e impressão/PDF.
- Novo controle de **módulos por empresa** no login do Administrador da Plataforma. É possível vender/liberar somente módulos específicos (ex.: Lista de Materiais).
- **Lista de Materiais** passa a ser um módulo comercial independente de Materiais.
- Licenças V040 vinculadas automaticamente aos e-mails dos usuários ativos da empresa; o **Gerente consome uma licença**.
- Botão **Esqueci minha senha** no login usando o fluxo seguro de recuperação por e-mail do Supabase.
- Gerente pode gerar senha temporária para usuários da própria empresa.
- Administrador da Plataforma pode gerar senha temporária para Gerentes.
- Qualquer usuário autenticado pode alterar a própria senha pelo botão no rodapé do menu.

## Instalação
1. Execute `supabase-v040-modulos-unifilar-licencas.sql` no SQL Editor do Supabase.
2. Publique novamente a Edge Function `core-orca-admin-users` contida em `supabase/functions/core-orca-admin-users/index.ts`.
3. Substitua `index.html`, `app.js` e `style.css` no site pelos arquivos desta versão.
4. No Supabase Auth, confira a configuração de SMTP e as Redirect URLs do site para que **Esqueci minha senha** consiga enviar/retornar pelo link de recuperação.

## Observação sobre recuperação de senha
O e-mail de "Esqueci minha senha" usa o mecanismo de recuperação do Supabase: o link permite ao próprio usuário definir a nova senha. Senhas provisórias são geradas nas ações administrativas (Gerente → usuário e Administrador → gerente) e exibidas uma única vez ao responsável. O Core Orça não envia senha em texto aberto por e-mail.
