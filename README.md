# Core-Orca V3

A V3 parte da V2 que já estava funcionando e adiciona:

- PDF/Impressão de Orçamento e Ordem de Serviço.
- Fotos de OS (Antes / Durante / Depois) no Supabase Storage.
- Captura de foto pela câmera em celulares compatíveis.
- Assinatura do cliente na tela.
- Agenda com cliente, OS, responsável, início/fim e status.
- Financeiro básico com contas a receber/pagas.
- Ao concluir uma OS, além da baixa de estoque, é criado automaticamente um lançamento financeiro.
- Proteção contra baixa duplicada de estoque e lançamento financeiro duplicado.

## Instalação
1. Mantenha a V2 e todos os dados atuais.
2. No Supabase > SQL Editor, execute `supabase-v3.sql`.
3. Se o SQL concluir sem erro, substitua no GitHub:
   - `index.html`
   - `style.css`
   - `app.js`
4. Faça commit na `main`.
5. Aguarde o GitHub Pages atualizar e use Ctrl+F5.

## PDF
O botão “PDF / Imprimir” abre uma versão limpa do documento e chama a impressão do navegador.
No computador ou celular, selecione “Salvar como PDF” para gerar o arquivo. Isso evita depender de um servidor pago.

## Fotos
O SQL cria o bucket `os-fotos`. Limite por arquivo: 10 MB. Formatos: JPEG, PNG e WebP.

## Observação de segurança
A V3 mantém o modelo simples da V1/V2: usuários autenticados têm acesso aos dados operacionais.
Uma etapa futura deve implementar perfis e permissões (administrador, escritório e técnico).
