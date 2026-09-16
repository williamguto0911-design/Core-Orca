# Core-Orça V15.2

Correção da importação completa do Catálogo Base.

## O que muda
A importação dos 1.311 materiais agora acontece inteiramente dentro do PostgreSQL/Supabase, sem depender de uma lista retornada ao navegador.

A função:
- preserva os materiais já existentes;
- não duplica códigos;
- importa somente os itens faltantes;
- retorna quantos foram adicionados;
- retorna o progresso `presentes / total`;
- pode ser executada novamente com segurança.

## Instalação
1. Execute `supabase-v15.2.sql` no SQL Editor do Supabase.
2. Substitua somente `app.js` no GitHub pelo arquivo desta versão.
3. Faça commit, aguarde o GitHub Pages e pressione Ctrl+F5.
4. Entre como Gerente da empresa.
5. Materiais → Catálogo Core-Orça → Importar catálogo completo.

Se a empresa tinha 1.000 itens do catálogo, a expectativa é que sejam inseridos apenas os 311 faltantes. Se existir material próprio, ele continua separado e não entra na contagem 1.311/1.311 do catálogo.
