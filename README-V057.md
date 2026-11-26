# Core Orça V057 — Configuração fiscal nacional

Atualização incremental da V056.5. Emissor de referência: https://www.nfse.gov.br/EmissorNacional/Login.

## Instalação
1. Faça backup do banco e dos arquivos. Se ainda estiver na V056.4, execute primeiro supabase-v0565-fiscal.sql e configure CORE_ORCA_CERT_KEY conforme README-V056.5.md.
2. Execute supabase-v057-fiscal.sql no SQL Editor.
3. No projeto Supabase CLI vinculado, implante `supabase functions deploy core-orca-fiscal`. Preserve os secrets existentes.
4. Publique os arquivos estáticos index.html, app.js, fiscal.js, style.css e levantamento.js no GitHub Pages. Nunca publique certificados ou secrets.
5. Teste com gerente de empresa: escolha UF, município, regime, códigos de serviço e salve; reabra a aba e confirme a persistência. Teste isolamento entre duas empresas.

## Escopo e limites
Inclui seleção de municípios pela API IBGE, validação no servidor e configurações fiscais por empresa. Mantém importação A1 e fila interna da V056.5. A escolha de ambiente não habilita transmissão. Não há integração efetiva com a API NFS-e, cron, assinatura PAdES, emissão recorrente, download fiscal nem validação de habilitação municipal. Não usar como emissor fiscal em produção. Códigos tributários são informados manualmente. A deduplicação existente é por documento, não por cadeia orçamento/OS/recibo. Não houve teste em Supabase real.
