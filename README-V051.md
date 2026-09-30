# Core Orça V051 — Correção definitiva do Esquema Vertical

## Correção principal
Os botões **Adicionar pavimento** e **Adicionar componente** estavam ligados diretamente às funções de cadastro por `element.onclick = funcao`. O navegador envia automaticamente o `MouseEvent` como primeiro argumento. Como essas funções também usam o primeiro argumento para distinguir criação de edição, o evento era interpretado como um registro existente e o sistema executava `PATCH ...?id=eq.undefined`.

A V051 corrige isso usando wrappers sem argumentos (`()=>adicionarPavimento()` e `()=>adicionarComponente()`) e adiciona validação defensiva para aceitar modo de edição somente quando o objeto possui UUID válido.

Não há SQL novo. Publique `index.html`, `app.js` e `style.css` e faça Ctrl+F5.
