# Core-Orça V029 — Dados completos do cliente nos PDFs

Base: V028 estável.

## Alteração
Todos os PDFs gerados pelo sistema (Orçamento, OS, Recibo e Lista de Materiais) passam a exibir os dados cadastrais completos do cliente.

Para clientes PJ, o documento também mostra os dados do representante legal e, quando cadastrados, os contatos adicionais da empresa.

Campos considerados: tipo PF/PJ, nome/razão social, CPF/CNPJ, telefone, celular, e-mail, e-mail de cobrança, CEP, endereço completo e observações cadastrais. Para PJ: nome, CPF, cargo/função, e-mail e telefone do representante legal, além dos contatos adicionais.

## Instalação
Substitua `app.js` pelo arquivo desta versão e publique. Não há alteração SQL nesta versão. Recomenda-se substituir também `index.html` e `style.css` para manter o pacote integral da V029.
