# Core Orça V046 — Correções Esquema Vertical, Exclusões, PDFs e Lista de Materiais

## Correções
- Corrigido erro `invalid input syntax for type uuid: "undefined"` ao adicionar/editar componentes no Esquema Vertical.
- Validação explícita de quadro/local, pavimento e material antes de gravar o componente.
- Seletores críticos de quadro/tipo deixam de sofrer interferência do seletor pesquisável global.
- Corrigido editor da Lista de Materiais para que materiais adicionados apareçam imediatamente na planilha do popup.
- Seletores do editor da Lista de Materiais foram isolados do componente global de select pesquisável para evitar perda de estado durante a renderização.

## Exclusões no Esquema Vertical
- Excluir componente.
- Excluir quadro/equipamento e seus componentes.
- Excluir pavimento, incluindo quadros/equipamentos e componentes vinculados.
- Excluir obra/esquema vertical completo.
- Todas as exclusões destrutivas pedem confirmação.

## PDFs
- Lista de Materiais passa a imprimir todos os dados cadastrais disponíveis do cliente, usando o mesmo bloco cadastral de orçamento/recibo.
- Esquema Vertical passa a imprimir todos os dados cadastrais disponíveis do cliente.
- Mantidos cabeçalho da empresa, dados técnicos, organização por pavimento e ausência de valores na Lista de Materiais.

## Instalação
Esta versão não altera o schema do banco. Se a V045 já está instalada, não é necessário executar SQL novo.
Publique `index.html`, `app.js` e `style.css` da V046.
