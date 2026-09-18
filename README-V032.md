# Core-Orça V032 — Pagamento antes do parcelamento

Ajuste funcional no recibo, mantendo a estética existente.

- Campo independente **Lançar pagamento** durante a criação do recibo.
- Pagamentos lançados são marcados como pagos e abatidos imediatamente do total.
- O resumo mostra Total do recibo, Pagamentos lançados e Saldo a parcelar.
- **Gerar parcelamento do saldo restante** divide apenas `Total - pagamentos pagos`.
- Ao regerar o parcelamento, parcelas pendentes anteriores são substituídas; pagamentos já lançados são preservados.
- Pagamentos e parcelas continuam gravados em `recibo_pagamentos`.
- Nenhuma alteração SQL adicional é necessária em relação à V031.
