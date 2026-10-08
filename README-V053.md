# Core Orça V053 — Levantamento em Obra

Base: pacote V052.6 (mantém as correções anteriores).

## Instalação
1. Faça backup do Supabase e dos arquivos do site.
2. No SQL Editor do Supabase, execute `supabase-v053-levantamento-obra.sql` como administrador. O script cria quatro tabelas, RLS e bucket privado para fotos.
3. Publique os arquivos `index.html`, `app.js`, `style.css` e o novo `levantamento.js` (ou substitua o site pelo conteúdo deste pacote). **O novo arquivo levantamento.js é obrigatório.**
4. Atualize o navegador com Ctrl+F5 e entre no sistema.
5. Abra **Levantamento em Obra**, crie um levantamento e escolha uma obra existente no módulo Esquema Vertical e um cliente cadastrado.

## Vínculos
- Cliente: tabela `clientes`.
- Obra: tabela `obras_eletricas` (obras do Esquema Vertical).
- Pavimento: `obra_eletrica_pavimentos`.
- Estrutura / quadro: `obra_eletrica_estruturas`.
- Componente: `obra_eletrica_componentes`.
- Material: `materiais` da empresa, por UUID. Não utiliza material de outra empresa.
- Lista gerada: `listas_materiais` e `lista_materiais_itens`, disponíveis no menu Lista de Materiais.

## Funcionalidades
- Registros por pavimento, ambiente, ponto, disciplina, situação, descrição, prazo e responsável.
- Fotos armazenadas no bucket **privado** `levantamento-obra`; links temporários de 1 hora.
- Relatório com fotos via impressão/salvar PDF e exportação CSV.
- Consolidado de materiais por situação; geração de lista a partir de "A instalar" + "Necessita ajuste".
- Isolamento por empresa (RLS + validação dos vínculos).

## Limitações desta primeira integração
- O menu utiliza as obras já cadastradas no **Esquema Vertical**; não há uma tabela genérica de obras neste pacote. Caso sua obra ainda não exista lá, cadastre-a primeiro.
- O módulo não edita os componentes do Esquema Vertical, apenas vincula-se a eles.
- A lista gerada é um novo documento sem vínculo de orçamento/OS/recibo; pode ser editada posteriormente no menu Lista de Materiais.
- Não há sincronização offline no site integrado; o protótipo HTML offline continua separado.
- Fotos com mais de 10 MB ou tipos não suportados são ignoradas com aviso.
- A operação de salvar registro e seus materiais usa várias chamadas; se houver falha de rede entre elas, confira os itens antes de repetir.
- O script foi verificado estaticamente; precisa ser testado no seu projeto Supabase (esquema e permissões reais).
