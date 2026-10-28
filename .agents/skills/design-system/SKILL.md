---
name: design-system
description: >-
  Guia e procedimentos para implementação da interface de usuário no estilo Dark Minimalist
  (Preto e Roxo). Use esta skill sempre que criar, estilizar ou refatorar componentes visuais,
  telas de login, quadros Kanban, modais de tarefa, cards, paleta de cores ou microinterações.
---

# Design System — Minimalist Dark (Preto & Roxo)

Esta skill orienta a criação e manutenção da interface visual do sistema de To-Do, garantindo uma estética sóbria, elegante e sem qualquer poluição visual.

---

## 1. Paleta de Cores Canônica

| Nome do Token | Hex Code | Aplicação no Tailwind / CSS |
| :--- | :--- | :--- |
| **Background Principal** | `#09090b` | `bg-[#09090b]` — Fundo da página e canvas |
| **Surface (Superfície 1)** | `#121217` | `bg-[#121217]` — Colunas do Kanban e modais |
| **Surface Card (Superfície 2)** | `#181822` | `bg-[#181822]` — Cartões de tarefas individuais |
| **Border Primária** | `#262636` | `border-[#262636]` — Divisórias e bordas sutis |
| **Border Ativa / Focus** | `#6d28d9` | `focus:border-[#6d28d9]` — Foco em inputs e botões |
| **Accent Roxo Primário** | `#8b5cf6` | `text-[#8b5cf6]`, `bg-[#8b5cf6]` — Ação principal / botões |
| **Accent Roxo Hover** | `#7c3aed` | `hover:bg-[#7c3aed]` — Estado hover de botões |
| **Accent Roxo Glow** | `rgba(139, 92, 246, 0.15)` | Efeito de brilho suave e badge highlights |
| **Texto Principal** | `#f4f4f5` | `text-zinc-100` — Títulos e textos de alto contraste |
| **Texto Secundário** | `#a1a1aa` | `text-zinc-400` — Subtítulos, datas e contadores |
| **Texto Muted** | `#71717a` | `text-zinc-500` — Placeholders e metadados secundários |

---

## 2. Telas e Componentes

### 2.1. Tela de Login (Zero Distração)
- **Comportamento**: Quando o usuário não estiver autenticado, a única coisa visível é um card centralizado na tela sobre fundo `#09090b`.
- **Elementos**:
  - Logo minimalista com sutil gradiente roxo.
  - Título limpo: *Tasks*.
  - Subtítulo sutil: *Organize com simplicidade.*
  - Botão oficial de Login com Google estilizado no tema escuro ou botão padrão do Google Identity Services.
  - Nenhum link de cadastro extra, formulário de senha, ou links de rodapé desnecessários.

### 2.2. Barra Superior (Header Minimalista)
- **Elementos**:
  - Marca à esquerda (ex: `✦ Tasks`).
  - Lado direito:
    - Botão `+ Nova Tarefa` com fundo roxo vibrante (`bg-[#8b5cf6] hover:bg-[#7c3aed] text-white`).
    - Foto de perfil do Google (avatar circular com borda roxa sutil).
    - Botão discreto `Sair` (ícone de LogOut com hover sutil).

### 2.3. Quadro Kanban (As 3 Colunas)
As 3 colunas canônicas devem ficar dispostas horizontalmente em desktop e empilhadas em mobile:
1. **A Fazer**: Cabeçalho com indicador circular cinza/violeta e contador de tarefas.
2. **Fazendo**: Cabeçalho com indicador circular roxo piscante/estático e contador de tarefas.
3. **Completo**: Cabeçalho com indicador circular verde/roxo e contador de tarefas.

**Estilo da Coluna**:
- Fundo: `bg-[#121217]` com borda arredondada `rounded-xl border border-[#262636]/60 p-4`.
- Largura flexível com `min-w-[320px]`.

### 2.4. Card de Tarefa (`TaskCard`)
Cada cartão de tarefa deve apresentar informações de relance com alta clareza:
- **Título**: Texto nítido `text-sm font-medium text-zinc-100`.
- **Badges Inferiores**:
  - **Designação**: Avatar pequeno (20x20) do usuário responsável e primeiro nome.
  - **Data de Vencimento**: Badge com ícone de calendário. Se vencida, texto com tom avermelhado; se futura, tom violeta/cinza.
  - **Entregas**: Ícone de anexo/entrega (ex: `📎 1` ou badge `Entregue`).
  - **Comentários**: Ícone de balão de fala (ex: `💬 3`).
- **Ações Rápidas**:
  - Botões sutis de avanço/recuo de coluna (ex: `←` `→` ou arrastar e soltar).
  - Clique no card abre o modal de detalhes.

### 2.5. Modal de Detalhes da Tarefa (`TaskModal`)
O modal centraliza a edição e interação completa da tarefa:
- **Cabeçalho**: Título editável inline e seletor de coluna/status (`A Fazer` | `Fazendo` | `Completo`).
- **Campos de Metadados**:
  - **Data de Vencimento**: Input tipo date/datetime com estilização escura.
  - **Designação**: Dropdown com lista de usuários logados no sistema para escolha do responsável.
  - **Descrição**: Textarea para notas detalhadas.
- **Seção de Entregas (`Entregas`)**:
  - Permite adicionar links de entregáveis (ex: link do GitHub, Figma, documento, ou nota de conclusão).
  - Lista histórica com data e nome de quem realizou a entrega.
- **Seção de Comentários (`Comentários`)**:
  - Lista em ordem cronológica com avatar, nome, tempo decorrido e texto.
  - Caixa de envio rápido na base com botão roxo `Comentar`.

---

## 3. Diretrizes de CSS e Tailwind

Configuração sugerida para o `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          surface: '#121217',
          card: '#181822',
          border: '#262636',
        },
        purple: {
          light: '#a78bfa',
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
          glow: 'rgba(139, 92, 246, 0.15)',
        }
      }
    },
  },
  plugins: [],
}
```

---

## 4. Regras de Ouro de Interface

1. **Evite sombras excessivas**: Prefira bordas sutis de 1px com tons escuros (`border border-[#262636]`) e realces roxos suaves.
2. **Transições suaves**: Aplique `transition-all duration-150 ease-in-out` em botões, cartões e aberturas de modais.
3. **Sem poluição**: Não adicione gráficos desnecessários, barras de progresso complexas ou banners promocionais. Apenas o fluxo essencial da tarefa.

