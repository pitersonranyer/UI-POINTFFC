# Fase 5A.4.3 — selo ancorado na camisa sem deslocamento

Branch mantida: `codex/point-fantasy-team-identity-phase5a2`. As alterações locais anteriores foram preservadas.

## Ajuste restrito ao indicador

- Selo reduzido de 15 para **13 px**.
- Mantido o contêiner existente da camisa, sem novos wrappers ou mudança de suas dimensões.
- Indicador absoluto dentro desse contêiner: `left:18%`, `bottom:8%`. Assim fica dentro da área visual da camisa, na parte inferior esquerda, sobrepondo discretamente sua borda.
- Nenhuma alteração de margin, padding, gap, largura, altura, grid ou flex do slot/formação.
- Nenhuma mudança na posição da camisa, nome, capitão ou Reserva Power.
- Mapeamento real de condição e significado acessível preservados; nenhum dado foi fabricado.
- Modais, callbacks, regras, backend e contratos não foram alterados.

## Comparação obrigatória de geometria

Antes de editar os arquivos, foram capturadas coordenadas e dimensões no Chrome usando os componentes reais, CSS global e fixtures identificadas como teste, com 17 atletas (11 titulares, 5 reservas e técnico). Viewports: 360, 390, 768 e 1280 px de largura, 900 px de altura.

Foram usadas duas referências:

1. **Antes:** código local imediatamente anterior a esta alteração.
2. **Original sem indicador:** estrutura de `LineupPitch.tsx` em `HEAD`, removendo apenas a antiga renderização de condição em fluxo; usado o mesmo CSS e os mesmos atletas. Essa referência permite verificar a geometria original de camisa e nome sem considerar as mudanças anteriores dos selos de função.

Após a alteração, o script comparou `x`, `y`, `width` e `height` de cada camisa, nome, slot, capitão e Power com a referência “Antes”. Camisas e nomes foram comparados também com a referência “Original sem indicador”. As dimensões do contêiner existente foram comparadas com as da camisa original.

| Largura | Atletas comparados | Diferença nas coordenadas/dimensões | Selo |
| --- | --- | --- | --- |
| 360 px | 17 | 0 px | 13 × 13 px |
| 390 px | 17 | 0 px | 13 × 13 px |
| 768 px | 17 | 0 px | 13 × 13 px |
| 1280 px | 17 | 0 px | 13 × 13 px |

**Resultado: 68 comparações de atletas, sem deslocamento ou redimensionamento.**

Os selos ficaram inteiramente dentro do retângulo da camisa, no quadrante inferior esquerdo, sem tocar nos nomes ou nos selos de capitão/Power. O contêiner tem overflow visível e o indicador não participa do fluxo. Não houve rolagem horizontal. A medição inicial já mostrava camisas e nomes coincidentes com a referência original; por isso nenhuma compensação ou deslocamento dos atletas foi aplicado.

### Evidências

- [Antes em 360 px](evidence/phase5a43/before-360.png) · [Depois em 360 px](evidence/phase5a43/after-360.png)
- [Antes em 1280 px](evidence/phase5a43/before-1280.png) · [Depois em 1280 px](evidence/phase5a43/after-1280.png)
- [Medições anteriores e referência original nas quatro larguras](evidence/phase5a43/before.json)
- [Medições posteriores nas quatro larguras](evidence/phase5a43/after.json)
- [Resultado da comparação automática](evidence/phase5a43/comparison.json)

O teste visual usou um harness isolado, sem autenticação ou escrita no backend. Não substitui a conferência integrada com os dados da conta no app completo. A comparação DOM usa o mesmo conteúdo e viewport em todas as variantes.

## Arquivos desta alteração

```text
src/components/point-fantasy/lineups/LineupPitch.tsx
src/components/point-fantasy/lineups/LineupBuilder.module.css
src/components/point-fantasy/lineups/LineupAthleteActions.test.tsx
docs/phase5a43-indicator-geometry.md
docs/phase5a4-refinement.md (link para este relatório)
docs/evidence/phase5a43/*
```

## Verificações

- 154 testes relevantes aprovados em 9 arquivos. A asserção do campo/banco verifica agora tamanho explícito de 13 px e significado textual preservado.
- Lint aprovado com avisos preexistentes fora deste escopo, usando `NEXT_PUBLIC_API_URL=https://api-pointffc.onrender.com` conforme a configuração do projeto.
- Typecheck aprovado.
- Build aprovado, com geração das 49 páginas e avisos preexistentes fora deste escopo.
- `git diff --check` aprovado.

Não houve commit, push, merge ou deploy.
