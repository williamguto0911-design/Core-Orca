# Core-Orça V16.1

Correção da V16.0.

## Corrigido
- erro `Uncaught ReferenceError: async is not defined` que interrompia o `app.js` e impedia o login;
- criação das parcelas usando `pendente/pago`;
- vencimento da parcela separado da data efetiva do pagamento;
- vínculo da nova OS no cadastro do recibo;
- SQL reorganizado para atualizar a constraint de status antes da conversão dos registros antigos.

## Atualização
1. Execute `supabase-v16.1.sql` no SQL Editor do Supabase.
2. Substitua `app.js` e `style.css` no GitHub.
3. Faça commit e aguarde o GitHub Pages.
4. Pressione Ctrl+F5.
5. Faça login novamente.

A Edge Function V15.9 não precisa ser republicada.
