# Core Orça V052.1 — Menu lateral e Notificações

Base: V052 — Revisão do Esquema Vertical.

## Menu lateral
- Materiais: Materiais, Lista de Materiais, Estoque, Reposição de Estoque, Fornecedores, Compras.
- Serviços: Serviços, Orçamentos, Ordens de Serviço, Agenda.
- Financeiro: Recibos, Financeiro, Relatórios.
- Configurações: Técnicos, Cargos e Permissões, Configurações, Usuários e Notificações.
- Dashboard, Clientes e Esquema Vertical permanecem como acessos diretos.
- Grupos respeitam módulos/permissões e são ocultados quando não têm itens acessíveis.

## Notificações
A tela Configurações > Notificações permite ao gerente escolher, por usuário e por tipo de evento, se a notificação fica ativa no sistema e se também deve ser enviada por e-mail.

Tipos preparados: estoque baixo, financeiro vencido, vencimentos próximos, agenda, licença, orçamento, OS e compras.

A tabela SQL armazena as preferências e já possui isolamento por empresa/RLS. O envio automático de e-mail deve ser executado pelos jobs/eventos que geram cada notificação; a preferência `por_email` fica disponível como fonte única de configuração.

## Instalação
1. Execute `supabase-v052-menu-notificacoes.sql` no Supabase.
2. Publique `index.html`, `app.js` e `style.css`.
3. Faça Ctrl+F5.
