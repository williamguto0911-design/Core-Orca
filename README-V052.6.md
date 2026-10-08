# Core Orça V052.6 — Preferências de alertas do Dashboard

- Alertas de estoque baixo, financeiro vencido, vencimentos próximos e agenda respeitam `usuario_notificacoes_config.no_sistema` do usuário autenticado.
- Preferências são carregadas após autenticação/atualização e no botão Atualizar alertas.
- Salvar preferências do próprio usuário atualiza imediatamente o Dashboard.
- Ausência de preferência mantém alerta habilitado (comportamento anterior).
- Nenhuma alteração no envio de e-mail, Edge Functions ou SQL.

## Instalação
Substitua `app.js` (ou publique o pacote do site). Limpe o cache do navegador e faça novo login. A tabela `usuario_notificacoes_config` deve existir, conforme SQL de notificações da V052.
