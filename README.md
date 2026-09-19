# Core Orça — V039

## Sessão única por usuário

A V039 adiciona bloqueio de acesso simultâneo da mesma conta em locais diferentes.

### Comportamento
- O primeiro dispositivo/navegador que entrar registra a sessão ativa do usuário.
- Uma nova tentativa com a mesma conta em outro dispositivo/navegador é recusada com mensagem de usuário já conectado.
- Não existe expiração por tempo de inatividade.
- Ao clicar em **Sair**, a sessão é liberada imediatamente.
- Ao fechar e reabrir o mesmo navegador, o identificador local permite retomar a mesma sessão sem criar uma segunda sessão.
- Se o navegador/dispositivo original for perdido ou tiver os dados locais apagados sem logout, o administrador deverá liberar manualmente a sessão no banco.

### Instalação
1. Execute `supabase-v039-sessao-unica.sql` no SQL Editor do Supabase.
2. Substitua `app.js` no repositório pela versão deste pacote.
3. `index.html` e `style.css` podem ser mantidos/substituídos pelos arquivos do pacote; não houve mudança visual obrigatória neles.
4. Publique e faça `Ctrl + F5`.

Não é necessário alterar a Edge Function.

### Liberação manual de uma sessão presa
Para liberar uma conta específica, use no SQL Editor:

```sql
delete from public.usuario_sessoes_ativas
where auth_user_id = (
  select id from auth.users
  where lower(email) = lower('usuario@exemplo.com')
  limit 1
);
```

Isso libera somente o bloqueio de sessão única; não exclui o usuário.
