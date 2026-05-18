# 🛠️ Agent Troubleshooting: Content Explorer 888

This directory documents the core errors resolved during modularization and polishing.

---

## 1. SyntaxError: Unexpected token 'export'
*   **Cause**: Legacy submodules used ES6 modular `export` syntax inside DatacoreJSX's custom require context, which expects standard commonJS module returns.
*   **Fix**: Standardized bootsrapper entry points to capture returned exports:
    ```javascript
    async function View(props) { ... }
    return { View };
    ```

## 2. ReferenceError: folderPath is not defined
*   **Cause**: Scope mismatch during direct imports of subcomponents. Submodules expected `folderPath` variables from root closures but lacked proper fallback handling when imported out-of-context.
*   **Fix**: Standardized a fallback declaration at the header of all sub-component modules:
    ```javascript
    const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
    const outerFolderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
    ```
    Then shadow the parameter safely: `const base = folderPath || outerFolderPath;`.

## 3. ReferenceError: backgroundColor is not defined
*   **Cause**: Variable was declared inside one viewport scope but missed fallback reference definitions in SVG canvas wrappers.
*   **Fix**: Declared matching default values in parent parameters or falling back to standard OLED dark shades (`#000` / `var(--background-primary)`).

## 4. Error: No implementation found for 'string index string'
*   **Cause**: Datacore's internal indexer failed to resolve nested metadata checks (e.g. `file["outlinks"]["path"]`) when dealing with non-array structure maps.
*   **Fix**: Safecast paths and sanitize indexing queries to handle multi-level arrays:
    ```javascript
    const targetPath = String(link.path);
    ```

## 5. Frontmatter indexer TypeError (Null values)
*   **Cause**: Files lacking frontmatter block tags caused indexers to throw crash loops when calling `file.frontmatter` without validation.
*   **Fix**: Ensured safe property chaining and default null filters on frontmatter attributes:
    ```javascript
    const value = file && file.frontmatter ? file.frontmatter[prop] : null;
    ```

## 6. Host Status Bar / Footer Leakage
*   **Cause**: Reparenting the document viewer into the parent active pane (`workspace-leaf-content`) bypassed standard status bar hiding rules.
*   **Fix**: Injected a dynamic `<style>` override element into the document header on mounting:
    ```css
    .status-bar, .view-footer, .workspace-leaf-content-footer { display: none !important; }
    ```
    And removed the style ID cleanly on portal unmount cleanup.
