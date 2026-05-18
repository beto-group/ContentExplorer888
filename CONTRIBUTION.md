# Engineering & Contribution Guidelines

This document outlines the architectural standards, code quality metrics, and modular compilation workflows required for maintaining and extending the **Content Explorer 888** component.

---

## 🏗️ Modular Architecture Blueprint

The codebase has been refactored from a monolithic legacy layout into a clean, structured multi-module architecture inside `src/`. All files and directories are organized strictly by functional layers:

```
CONTENT EXPLORER 888/
├── CONTENT EXPLORER 888.md  # User Entry Point (Obsidian mounting query)
├── METADATA.md              # Machine-readable indexing manifest
├── LICENSE.md               # MIT License
├── README.md                # Human-readable documentation
├── CONTRIBUTION.md          # Engineering guidelines (this file)
├── assets/                  # High-efficiency looping GIF and WebP thumbnails
└── src/
    ├── index.jsx            # Dynamic bootstrapper loader
    ├── App.jsx              # Coordinating main controller
    ├── components/          # Visual UI layers
    │   ├── ViewComponent.jsx        # Vertical feed viewer (CustomFeed)
    │   ├── ViewComponentBounty.jsx  # Interactive SVG radial map
    │   ├── FileSectionsProvider.jsx # Markdown document sections parser & editor
    │   └── ImagesPlaceholder.jsx    # SVG outline placeholder icon drawings
    └── utils/               # Configurations & helpers
        ├── IframesGuidelines.js     # Responsive viewport coordinate systems
        └── UtilityFunctions.jsx     # URL transformations & resize observers
```

---

## 🔑 Core Design Principles

To ensure seamless integration with the BetoOS / Obsidian ecosystem, all modifications must adhere to the following core tenets:

### 1. Zero Direct Header Link Dependencies
All modules inside the component must reference each other using **clean relative paths** derived from the dynamic `folderPath` context (e.g. `` `${base}/components/ViewComponent.jsx` ``). Never use hardcoded absolute system URLs or monolithic header-link anchors (`dc.headerLink`).

### 2. Immersive Edge-to-Edge UI
When running in `fullTab` mode, the component suppresses the Obsidian `.status-bar` and `.view-footer` containers to maximize visual focus, providing a truly immersive experience.

### 3. Absolute Theme Parity
Always leverage standard Obsidian styling hooks and CSS variables (such as `var(--background-primary)`, `var(--text-normal)`) for layout colors to guarantee immediate styling consistency across both Light and Dark user interface modes.

### 4. Offline-First Portability
The component must operate 100% offline, without relying on external CDNs or network calls. All SVGs must be embedded inline, and all images or loop recordings must be stored locally under the `/assets` directory.
