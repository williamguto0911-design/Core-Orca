# Core-Orça V15.1 — Correção do botão Catálogo

Correção de frontend sobre a V15.

## Corrigido
- O botão **Catálogo Core-Orça** agora fica diretamente no HTML da página Materiais.
- Ele aparece junto de **Importar CSV** e **+ Material**.
- O clique abre `abrirCatalogoEmpresa()`.
- Gerente tem acesso; colaborador depende da permissão de escrita em Materiais.
- Os 1.311 materiais do Catálogo Base já carregados no Supabase são preservados.

## Instalação
Não execute SQL novamente e não altere a Edge Function.

Substitua no GitHub:
- `index.html`
- `app.js`

O `style.css` pode permanecer o da V15.

Depois faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
