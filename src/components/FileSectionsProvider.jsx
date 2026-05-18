/**
 * editFileSegment
 *
 * Updates a segment of a file by replacing the original text with the new text.
 */
async function editFileSegment(filePath, originalSegment, newSegment) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    throw new Error("File not found: " + filePath);
  }
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(originalSegment);
  if (index === -1) {
    throw new Error("Original segment not found in the file content.");
  }
  const updatedContent =
    fileContent.substring(0, index) +
    newSegment +
    fileContent.substring(index + originalSegment.length);
  await app.vault.modify(file, updatedContent);
  return updatedContent;
}

/**
 * EditableSectionUI Component
 *
 * Renders a single section with inline editing functionality.
 */
function EditableSectionUI({ sectionText, filePath, onSectionUpdate }) {
  const { useState, useRef, useEffect } = dc;
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef(null);

  // Shared style for both display and editing
  const boxStyle = {
    width: "100%",
    height: "544px", // fixed height so both modes match
    fontFamily: "monospace",
    fontSize: "1.1em",
    lineHeight: "1.5",
    background: "none",
    padding: "0.5rem",
    boxSizing: "border-box",
    overflow: "auto",
    border: "none",
  };

  // When not editing, add a global keydown listener for Enter/Return.
  useEffect(() => {
    if (!editing) {
      const handleGlobalKeyDown = (e) => {
        // Only trigger if no input or textarea is focused
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        if (e.key === "Enter" || e.key === "Return") {
          e.preventDefault();
          setEditing(true);
          // After enabling editing, wait a tick and focus the textarea
          setTimeout(() => {
            textareaRef.current && textareaRef.current.focus();
          }, 0);
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [editing]);

  // When in edit mode, catch Enter (without Shift) to save changes.
  const handleTextareaKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === "Return") && !e.shiftKey) {
      e.preventDefault();
      const originalSegment = sectionText;
      const newText = textareaRef.current.value;
      editFileSegment(filePath, originalSegment, newText)
        .then(() => {
          onSectionUpdate(newText);
          setEditing(false);
        })
        .catch((error) => console.error("Error updating file:", error));
    }
  };

  return (
    <div style={{ padding: "0.5rem", marginBottom: "10px", background: "none" }}>
      {editing ? (
        <>
          <textarea
            defaultValue={sectionText}
            ref={textareaRef}
            onKeyDown={handleTextareaKeyDown}
            style={{
              ...boxStyle,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <button
              style={{ marginRight: "0.5rem" }}
              onClick={async () => {
                const originalSegment = sectionText;
                const newText = textareaRef.current.value;
                try {
                  await editFileSegment(filePath, originalSegment, newText);
                  onSectionUpdate(newText);
                  setEditing(false);
                } catch (error) {
                  console.error("Error updating file:", error);
                }
              }}
            >
              Save
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <pre style={{ ...boxStyle, whiteSpace: "pre-wrap" }}>
            {sectionText}
          </pre>
          <button style={{ marginTop: "0.5rem" }} onClick={() => setEditing(true)}>
            Edit Section
          </button>
        </>
      )}
    </div>
  );
}



/**
 * FileSectionsProvider
 *
 * Loads a file specified by fileName, splits its content into sections, and if
 * the "editable" prop is true, renders an inline editing UI for the current section.
 */
function FileSectionsProvider({
  fileName,
  onSectionsLoaded,
  onFilePathLoaded,
  editable = false,
  currentSectionIndex = 0,
  onSectionUpdate,
}) {
  const { useMemo, useEffect, useState } = dc;

  // Query for the requested file
  const queryString = useMemo(
    () => `@page and contains($path, "${fileName}")`,
    [fileName]
  );
  const pages = dc.useQuery(queryString);

  // Fallback query - find file with "EXPERIENCES.enigmas" in the name
  const fallbackQueryString = useMemo(
    () => `@page and $name.contains("EXPERIENCES.enigmas")`,
    []
  );
  const fallbackPages = dc.useQuery(fallbackQueryString);

  // Find the target page
  const targetPage = useMemo(() => {
    // First, try to find the requested file
    if (pages && pages.length > 0) {
      
      // Filter for exact filename match to avoid false positives (since we use 'contains')
      const exactMatches = pages.filter((page) => {
        const segments = page.$path.split("/");
        const currentFileName = segments[segments.length - 1];
        return currentFileName === fileName;
      });

      if (exactMatches.length > 0) {
          // Smart Lookup Priority
          const preferred = exactMatches.filter(f => {
            const path = f.$path.toLowerCase();
            return !path.includes("/_resources/") && !path.includes("/example/");
          });

          if (preferred.length > 0) {
               // console.log(`[FileSectionsProvider] Selected Content: ${preferred[0].name} (Preferred) -> ${preferred[0].$path}`);
               return preferred[0];
          }
           // console.log(`[FileSectionsProvider] Selected Content: ${exactMatches[0].name} (Fallback) -> ${exactMatches[0].$path}`);
           return exactMatches[0];
      }
      
      // If no exact match (unlikely given query?), fall back to first result or prioritize?
      // Just return first valid logic as fallback if exact logic fails
      return pages[0];
    }
    
    // If not found, use ANY file with "enigmas" in the name as fallback
    if (fallbackPages && fallbackPages.length > 0) {
      console.warn(`File "${fileName}" not found. Using fallback file:`, fallbackPages[0].$path);
      return fallbackPages[0];
    }
    
    console.error("No files found matching criteria");
    return null;
  }, [pages, fallbackPages, fileName]);

  const [filePath, setFilePath] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (targetPage) {
      const loadedPath = targetPage.$path;
      setFilePath(loadedPath);
      if (onFilePathLoaded) onFilePathLoaded(loadedPath);
      const file = app.vault.getAbstractFileByPath(loadedPath);
      if (file) {
        app.vault.read(file).then((content) => {
          let fullText = content || "";

          // Optional: remove up to a marker
          const headerMarker = "#### AENIGMAS";
          const markerIndex = fullText.indexOf(headerMarker);
          if (markerIndex !== -1) {
            fullText = fullText.substring(markerIndex + headerMarker.length);
          }

          // Split into sections by lines of 3 or more dashes (preserving newlines)
          const rawSections = fullText
            .split(/^\s*-{3,}\s*$/m)
            .filter((section) => section.replace(/\s+/g, "") !== "");

          // Regexes to detect the iframe tag and src
          const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
          const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;

          // Function to remove leading/trailing blank lines and indentation
          function cleanLines(text) {
            const lines = text.split(/\r?\n/);
            while (lines.length && /^\s*$/.test(lines[0])) {
              lines.shift();
            }
            while (lines.length && /^\s*$/.test(lines[lines.length - 1])) {
              lines.pop();
            }
            return lines.map((line) => line.replace(/^\s+/, "")).join("\n");
          }

          const sectionsData = rawSections.map((originalSection) => {
            // Clean the section text first
            const finalText = cleanLines(originalSection);

            // Regexes to detect the iframe tag and src
            const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
            const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;
            let iframeTag = "";
            let iframeSrc = "";

            // Try to capture an iframe tag
            const iframeTagMatch = originalSection.match(iframeTagRegex);
            if (iframeTagMatch) {
                iframeTag = iframeTagMatch[0];
                const srcMatch = iframeTag.match(srcRegex);
                if (srcMatch) {
                iframeSrc = srcMatch[1];
                }
            } else {
                // If no iframe tag is found, check for a URL starting with "https://"
                const urlRegex = /(https:\/\/[^\s]+)/;
                const urlMatch = finalText.match(urlRegex);
                if (urlMatch) {
                iframeSrc = urlMatch[1];
                }
            }

            // New logic for YouTube:
            // If the iframeSrc is a YouTube embed URL, search the full text for an alternative URL that is not the embed version.
            if (iframeSrc && iframeSrc.includes("youtube.com/embed/")) {
                const youtubeUrlRegex = /(https:\/\/(?:www\.)?youtube\.com\/(?!embed)[^"'\s]+)/;
                const youtubeMatch = finalText.match(youtubeUrlRegex);
                if (youtubeMatch) {
                iframeSrc = youtubeMatch[1];
                }
            }

            // New logic for Instagram:
            // If the URL is for Instagram and ends with "/embed" or "/embed/", remove that trailing part.
            if (iframeSrc && iframeSrc.includes("instagram.com")) {
                iframeSrc = iframeSrc.replace(/\/embed\/?$/, '');
            }

            return {
                text: finalText,
                iframeTag,
                iframeSrc,
            };
            });




          setSections(sectionsData);
          if (onSectionsLoaded) onSectionsLoaded(sectionsData);
        });
      } else {
        console.error("File not found at path:", targetPage.$path);
      }
    } else {
      console.error("No target page found for file:", fileName);
    }
  }, [targetPage, fileName, onSectionsLoaded]);

  // When in editable mode, render the inline editing UI for the current section.
  if (editable && sections.length > 0) {
    const currentSection = sections[currentSectionIndex];
    return (
      <EditableSectionUI
        sectionText={currentSection.text}
        filePath={filePath}
        onSectionUpdate={(newText) => {
          const newSections = [...sections];
          newSections[currentSectionIndex].text = newText;
          setSections(newSections);
          if (onSectionUpdate) onSectionUpdate(newText);
        }}
      />
    );
  }
  return null;
}

return { EditableSectionUI, FileSectionsProvider };
