# 🧠 Agent Planner: Content Explorer 888

This document serves as the architectural layout blueprint and best practices guide for AI agent context retention and maintenance.

---

## 🏗️ Design System Blueprint

Content Explorer 888 follows a highly modular, decoupled architecture where components are fully self-contained inside the `src/` hierarchy and interact strictly using dynamic props and parameters.

### Core Entry Flow
1. **`CONTENT EXPLORER 888.md`**: Obsidian mount point that parses path context and forwards the bootloader view.
2. **`src/index.jsx`**: Bootstrapper component that safely imports submodules and resolves `folderPath` context.
3. **`src/App.jsx`**: Root coordinator that dynamically toggles between the **Radial Graph Menu** and the **Vertical Feed Viewer**.

---

## 💡 Best Practices & Hardened Axioms

1. **Relative Pathing Normalization**:
   * NEVER hardcode path mounts. Always construct them dynamically relative to the `folderPath` prop resolved by `index.jsx` (e.g., `` `${folderPath}/src/...` ``).
   * Ensure components export modules cleanly instead of declaring global scope mutations.

2. **Aesthetic Consistency (Custom Feed DNA)**:
   * Keep visual assets matching HSL dark-mode values: OLED background `hsl(220, 20%, 4%)` and dark card layouts with fine transparent backdrops (`backdropFilter: "blur(20px)"`).
   * Suppress the default host sidebar elements when fullscreen mode is engaged.

3. **DOM Click Simulation Constraints**:
   * For inline edits or updating document frontmatter via Datacore/Obsidian API, simulate delayed mouse interactions on headings to ensure proper DOM synchrony.
