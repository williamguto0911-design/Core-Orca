# Core Orça V047 — revisão geral de Esquema Vertical e Lista de Materiais

## Correções principais
- Corrigida a mistura entre o editor legado e o editor novo da Lista de Materiais. O botão Nova Lista e Editar agora abrem exclusivamente o editor atual por tópicos.
- Materiais adicionados passam a ser renderizados imediatamente no popup atual.
- Pesquisa de material no popup atual preservada.
- Esquema Vertical agora valida UUID de obra, pavimento, quadro e material antes de enviar ao Supabase.
- Inclusões filhas do Esquema Vertical usam o empresa_id da própria obra carregada como fonte principal, evitando `undefined` em usuários cujo perfil ainda não esteja disponível no objeto local.
- Cadastro de componente valida explicitamente empresa, obra, pavimento, quadro e material antes do INSERT.
- Mantidos editar/excluir de obra, pavimentos, quadros/equipamentos e componentes.

## Revisão técnica
- `node --check app.js` executado sem erros de sintaxe.
- Não há SQL novo nesta versão. Requer os SQLs até V045 já aplicados.

## Publicação
Substitua `index.html`, `app.js` e `style.css` pelos arquivos desta versão e faça recarregamento forçado do navegador (Ctrl+F5).
