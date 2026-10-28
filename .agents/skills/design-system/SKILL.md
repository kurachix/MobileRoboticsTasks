---
name: design-system
description: >-
  Guia e procedimentos para implementação da interface de usuário no estilo WorldSkills Dark Minimalist
  (Preto e Roxo). Use esta skill sempre que criar, estilizar ou refatorar componentes visuais,
  telas de login, quadros Kanban, modais de tarefa, cards, paleta de cores ou microinterações.
---

# Design System — WorldSkills Dark Minimalist (Preto & Roxo)

Esta skill orienta a criação e manutenção da interface visual do sistema de To-Do, combinando a estética técnica e geométrica **WorldSkills** com o tema escuro **Preto & Roxo** e zero textos genéricos.

---

## 1. Paleta de Cores Canônica

| Nome do Token | Hex Code | Aplicação no Tailwind / CSS |
| :--- | :--- | :--- |
| **Background Principal** | `#09090b` | `bg-[#09090b]` — Fundo da página e canvas |
| **Surface (Superfície 1)** | `#111116` | `bg-[#111116]` — Colunas do Kanban e modais |
| **Surface Card (Superfície 2)** | `#16161d` | `bg-[#16161d]` — Cartões de tarefas individuais |
| **Border Primária** | `#232330` | `border-[#232330]` — Divisórias técnicas de 1px |
| **Border Ativa / Focus** | `#7c3aed` | `focus:border-[#7c3aed]` — Foco em inputs e botões |
| **Accent Roxo Primário** | `#8b5cf6` | `text-[#8b5cf6]`, `bg-[#8b5cf6]` — Ação principal / destaque |
| **Accent Roxo Hover** | `#7c3aed` | `hover:bg-[#7c3aed]` — Estado hover de botões |
| **Texto Principal** | `#f4f4f5` | `text-zinc-100` — Títulos e textos de alto contraste |
| **Texto Secundário** | `#a1a1aa` | `text-zinc-400` — Metadados, datas e contadores |
| **Texto Muted** | `#52525b` | `text-zinc-600` — Placeholders curtos e indicadores discretos |

---

## 2. Diretrizes de Estilo WorldSkills & Minimalismo de Texto

1. **Zero Textos Genéricos**:
   - Proibido usar frases explicativas longas, subtítulos promocionais ou placeholders prolixos.
   - Rótulos curtos, diretos e em caixa alta com espaçamento técnico (`text-[11px] font-semibold uppercase tracking-wider`).
2. **Geometria & Precisão Técnica**:
   - Bordas precisas de `1px`, cantos levemente angulados (`rounded-lg`), indicadores geométricos (losangos/prismas inspirados na marca WorldSkills) e contadores monoespaçados (`font-mono`).
3. **As 3 Colunas**:
   - `A FAZER` (`todo`)
   - `FAZENDO` (`doing`)
   - `COMPLETO` (`done`)
