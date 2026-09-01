# 🎨 UI/UX Design Toolchain Guide (`agentation`, `taste-skill`, `impeccable`)

This reference explains the exact purpose, integration methods, and operational workflows for the 3 external UI tools installed via `/install`.

---

## 🛠️ Toolchain Overview: Code Package vs. AI Skills

| Tool | Type | What it is | How to use it |
| :--- | :--- | :--- | :--- |
| **`agentation`** | **NPM Code Package** | Live React in-browser visual DOM inspector toolbar | Import `<Agentation />` into your root layout (`app/layout.tsx` or `App.tsx`) |
| **`taste-skill`** | **AI Prompt Skill** | Aesthetic anti-slop guidelines & visual density dials | Directs the AI to avoid generic purple gradients and build distinctive UI |
| **`impeccable`** | **AI Prompt Skill** | 23+ Design commands & 60+ design anti-pattern rules | Run design review commands (`/polish`, `/audit`, `/typeset`) with your AI |

---

## 1. 🔍 Agentation (The React Code Component)

`agentation` is the **only code package** among the three. It exports a React component that renders a visual DOM inspection toolbar in your browser during local development.

### Next.js App Router (`app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Import Agentation
import { Agentation } from "agentation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}

        {/* 2. Dev-Only Visual Telemetry Toolbar */}
        {process.env.NODE_ENV === "development" && (
          <Agentation />
        )}
      </body>
    </html>
  );
}
```

### Vite + React SPA (`src/App.tsx` or `src/main.tsx`)

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Agentation } from "agentation";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {import.meta.env.DEV && <Agentation />}
  </React.StrictMode>
);
```

---

## 2. 💎 Taste-Skill (AI Aesthetic & Anti-Slop Dials)

`Leonxlnx/taste-skill` contains **no JavaScript library code**. It is an AI skill that injects aesthetic rules into your AI assistant to eradicate generic "AI slop" interfaces (like cookie-cutter purple gradients, nested cards, and cramped typography).

### Core Aesthetic Dials

When prompting your AI to build or restyle frontend interfaces, you can reference these dials:

* **`DESIGN_VARIANCE` (0.0 to 1.0)**:
  * `0.2` = Conservative, standard enterprise SaaS layout.
  * `0.8` = Bold, editorial, distinctive visual identity.
* **`VISUAL_DENSITY`**:
  * `compact` = Data-dense tables, dashboards, developer tools.
  * `spacious` = High-end marketing, luxury landing pages, portfolios.
* **`MOTION_INTENSITY`**:
  * `subtle` = Crisp 150ms transitions and micro-interactions (`active:scale-[0.98]`).
  * `expressive` = Smooth staggered entrances and fluid spring animations.

### What Taste-Skill Teaches the AI to Avoid

1. ❌ **No Generic Gradients**: Eliminates cliché purple-to-blue linear background washes.
2. ❌ **No Nested Card Hell**: Stops wrapping cards inside cards with redundant borders.
3. ❌ **No Low-Contrast Gray Text**: Enforces accessible, legible typography hierarchy.

---

## 3. 🎯 Impeccable (AI Design Review Commands & Heuristics)

`pbakaus/impeccable` contains **no JavaScript runtime code**. It equips your AI coding agent with a suite of 23+ creative-director commands and ~60 deterministic design rules to audit and refine your UI.

### Key Impeccable AI Design Commands

You can prompt your AI with these commands to iterate on existing components:

* **`/polish`**: Audits and elevates a component's alignment, spacing, contrast, and visual hierarchy.
  > *Example: "Use `/polish` on `src/components/PricingTable.tsx`"*
* **`/typeset`**: Audits font pairings, line heights, letter tracking (`tracking-tight`), and max line-widths.
  > *Example: "Use `/typeset` to improve the typography on our blog post template"*
* **`/quieter`**: Reduces visual noise, softens harsh borders, and introduces breathing room.
  > *Example: "Make this sidebar `/quieter` so it doesn't distract from the main dashboard"*
* **`/delight`**: Injects tasteful micro-animations, active states, and polish details.
  > *Example: "Add `/delight` to the checkout submit button"*
* **`/audit`**: Runs the 60+ point design heuristic audit against your UI code to flag UX flaws.

---

## 4. ⚡ Quick Summary: When to Use Each Tool

* **When you want an in-browser DOM inspector toolbar**: Import `<Agentation />` from `agentation`.
* **When you want the AI to generate distinctive, non-generic frontend designs**: Leverage `taste-skill` aesthetic rules and dials.
* **When you want the AI to critique and polish an existing component**: Run `impeccable` commands (`/polish`, `/typeset`, `/quieter`).
