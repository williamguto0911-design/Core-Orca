# Core-Orca V4

## Novidades
- Dashboard com resumo financeiro e OS recentes.
- Técnicos: cadastro, função, contato e status.
- Responsável da nova OS pode ser escolhido entre técnicos ativos.
- Configurações da empresa para uso nos PDFs.
- Financeiro com Receitas e Despesas.
- Formas de pagamento.
- Resultado financeiro realizado no dashboard.
- Filtro de OS por status.
- Histórico/timeline dentro da OS.
- Indicador de custo de materiais e margem bruta estimada por OS.
- PDFs passam a usar os dados cadastrados da empresa.
- Mantém todas as funções da V3: fotos, assinatura, agenda, PDF e estoque automático.

## Instalação
1. Não apague nada da V3.
2. Supabase > SQL Editor: execute `supabase-v4.sql`.
3. Se o SQL terminar sem erro, substitua no GitHub:
   - index.html
   - style.css
   - app.js
4. Commit na branch main.
5. Aguarde o GitHub Pages e pressione Ctrl+F5.

## Primeiro uso
Depois da atualização:
1. Abra Configurações e cadastre os dados da empresa.
2. Abra Técnicos e cadastre a equipe.
3. Teste uma nova OS.
4. Teste um lançamento de despesa e um de receita.
5. Abra uma OS e confira Histórico e Margem.

## Observação
A margem exibida na OS é uma estimativa simples:
Valor total da OS - custo cadastrado dos materiais.
Ela ainda não desconta mão de obra, impostos, deslocamento ou outras despesas indiretas.
