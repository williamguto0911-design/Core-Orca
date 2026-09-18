# Core-Orça V031

Ajuste funcional do módulo de pagamentos/parcelamentos dos recibos com base no HTML de referência, preservando a estética atual do Core-Orça.

## Recursos
- painel Pagamentos / Parcelamento dentro do recibo;
- lançamento de pagamento com data, valor, forma, observação e comprovante;
- cálculo de total pago, saldo restante e status financeiro;
- geração de parcelas somente sobre o saldo restante;
- quantidade, primeira data, intervalo, forma e observação padrão;
- distribuição em centavos com ajuste da última parcela;
- marcar parcela paga/pendente;
- excluir pagamento/parcela;
- comprovantes mantidos no bucket existente;
- estética existente preservada.

## Instalação
1. Execute `supabase-v031-pagamentos-parcelamentos.sql`.
2. Substitua `app.js`.
3. Publique e faça Ctrl+F5.
