# Core Orça V050

## Correções
- Formatação vermelha preservada na Lista de Materiais e no PDF.
- Conversão de `<font color>` gerado pelo editor para `<span style="color">` seguro.
- Vermelho/preto continuam funcionando como alternância.
- Esquema Vertical: gravações deixam de enviar `empresa_id` pelo JavaScript; o tenant é resolvido no PostgreSQL por `current_empresa_id()`.
- Validações UUID de obra, pavimento, quadro e material mantidas.

## Instalação
1. Execute `supabase-v050-esquema-vertical-tenant.sql` no Supabase.
2. Publique `index.html`, `app.js` e `style.css`.
3. Faça Ctrl+F5.
