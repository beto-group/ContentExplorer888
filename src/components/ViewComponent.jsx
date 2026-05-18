const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const base = folderPath + "/src";


const { getIframesGuidelines } = await dc.require(`${base}/utils/IframesGuidelines.js`);
const { FileSectionsProvider } = await dc.require(`${base}/components/FileSectionsProvider.jsx`);
const { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeControls, IframeContainer } = await dc.require(`${base}/utils/UtilityFunctions.jsx`);

/**
 * Main View Component
 *
 * Combines the iFrame viewer with navigation controls and a hamburger
 * drawer for inline editing.
 */
function View({ title = "PHYSICAL.enigmas", spawnType = "fullTab", onBack = null, backLabel = "", folderPath, dc }) {
  const { useState, useEffect, useMemo, useRef } = dc;
  
  // Suppress third-party iframe errors (Instagram, Facebook, etc.) from console
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Filter out known third-party errors
      if (
        message.includes('Unable to parse uri') ||
        message.includes('ajax/bulk-route-definitions') ||
        message.includes('ErrorUtils caught an error') ||
        message.includes('fburl.com/debugjs') ||
        message.includes('Unexpected token') ||
        message.includes('<!DOCTYPE')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Filter out iframe-related warnings
      if (
        message.includes('third-party cookies') ||
        message.includes('Instagram') ||
        message.includes('Facebook')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  // Parse spawnType to determine initial mode and toggle visibility (case-insensitive)
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  //console.log("View component initialized with spawnType:", spawnType, "initialFullTab:", initialFullTab, "showFullTabToggle:", showFullTabToggle);
  
  // Use the title prop to load the content file
  const fileName = `${title}..md`;

  // ------------------------------
  // Container & iFrame states
  // ------------------------------
  const [width, setWidth] = useState(800); // Container Width (C.W)
  const [height, setHeight] = useState(600); // Container Height (C.H)
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);

  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800); // Iframe Width (I.W)
  const [iframeHeight, setIframeHeight] = useState(666); // Iframe Height (I.H)
  const [iframeScale, setIframeScale] = useState(1);     // Iframe Scale (I.S)
  const [iframeLeft, setIframeLeft] = useState(10);        // Iframe Left (I.L)
  const [iframeTop, setIframeTop] = useState(10);          // Iframe Top (I.T)
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);

  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);

  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Fine controls visibility toggle (edit component)
  const [showFineControls, setShowFineControls] = useState(false);

  // Touch/swipe detection
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // ------------------------------
  // Full-Tab Mode State & Utilities
  // ------------------------------
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  
  // Utility to find nearest ancestor with specific class
  function findNearestAncestorWithClass(element, className) {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Utility to find direct child with specific class
  function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.classList && child.classList.contains(className)) {
        return child;
      }
    }
    return null;
  }

  // ------------------------------
  // File Sections & Navigation Logic
  // ------------------------------
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedFilePath, setLoadedFilePath] = useState("");

  // State for the numeric input (1-indexed)
  const [entryInput, setEntryInput] = useState("1");

  // Update the entry input when currentIndex changes
  useEffect(() => {
    setEntryInput(String(currentIndex + 1));
  }, [currentIndex]);

  // ------------------------------
  // Title ref and header click simulation with press delay
  // ------------------------------
  const titleRef = useRef(null);
  // Compute header text from loaded file path
  const headerText = useMemo(() => {
    if (loadedFilePath) {
      // Extract filename from path
      const segments = loadedFilePath.split("/");
      const filename = segments[segments.length - 1];
      // Remove the ..md extension and return
      return filename.replace(/\.\.md$/, "").replace(/\.md$/, "");
    }
    // Fallback to fileName prop
    const parts = fileName.split("..md");
    return parts[0] || fileName.replace(/\.[^/.]+$/, "");
  }, [loadedFilePath, fileName]);

  /**
   * simulateTitleClickWithPressDelay simulates a header click by:
   * 1. Dispatching a mousedown event.
   * 2. Waiting for a press delay (default 200ms).
   * 3. Dispatching mouseup and click events.
   */
  function simulateTitleClickWithPressDelay(pressDelay = 10000) {
    if (!titleRef.current) {
      console.warn("titleRef.current is null, skipping simulated click");
      return;
    }
    
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    titleRef.current.dispatchEvent(mouseDownEvent);

    setTimeout(() => {
      if (!titleRef.current) return;
      
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      titleRef.current.dispatchEvent(mouseUpEvent);

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      titleRef.current.dispatchEvent(clickEvent);
    }, pressDelay);
  }

  /**
   * simulateTitleClickDelayed waits for an overall delay (default 500ms)
   * before calling the simulated press with a press delay.
   */
  function simulateTitleClickDelayed(delay = 500, pressDelay = 200) {
    setTimeout(() => {
      simulateTitleClickWithPressDelay(pressDelay);
    }, delay);
  }

  // When currentIndex changes, wait 500ms then simulate the header press.
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateTitleClickWithPressDelay();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Navigation functions with boundary handling.
  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev < sections.length - 1) {
        return prev + 1;
      } else {
        // At the last video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const goPrev = () => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      } else {
        // At the first video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const reloadCurrent = () => {
    // Force reload by temporarily changing index then back
    const current = currentIndex;
    setCurrentIndex(-1);
    setTimeout(() => {
      setCurrentIndex(current);
    }, 10);
  };

  // Update currentIndex based on numeric input value.
  function updateCurrentIndexFromInput() {
    const parsed = parseInt(entryInput, 10);
    if (!isNaN(parsed) && sections.length > 0) {
      let newIndex = parsed - 1; // Convert to 0-index
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sections.length) newIndex = sections.length - 1;
      setCurrentIndex(newIndex);
    }
  }

  // Handle numeric input key events.
  function handleEntryInputKeyDown(e) {
    if (e.key === "Enter") {
      updateCurrentIndexFromInput();
    }
  }
  function handleEntryInputBlur() {
    updateCurrentIndexFromInput();
  }

  // ------------------------------
  // Global keydown and wheel event handlers
  // ------------------------------
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      // Require Option (Alt) key for all shortcuts
      if (!e.altKey) return;

      if (showFineControls && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        return;
      }

      if (!showFineControls) {
        if (e.key === "ArrowRight" || e.key === "d") {
          setMenuOpen(true);
          e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "a") {
          setMenuOpen(false);
          e.preventDefault();
        } else if (e.key === "ArrowUp" || e.key === "w") {
          goPrev();
          e.preventDefault();
        } else if (e.key === "ArrowDown" || e.key === "s") {
          goNext();
          e.preventDefault();
        } else if (e.key === " ") {
          setDisableIframeInteraction((prev) => !prev);
          e.preventDefault();
        } else if (e.key === "v") {
          openCurrentLink();
          e.preventDefault();
        } else if (e.key === "c") {
          // Option+C for additional controls if needed
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFineControls, goPrev, goNext]);

  useEffect(() => {
    if (!showFineControls) return;

    function handleWheel(e) {
      const baseFactor = 0.2;
      const ilitFactor = 0.5;
      const scaleFactor = 0.001;

      // COMMAND + OPTION + SHIFT: Adjust I.L and I.T.
      if (e.metaKey && e.altKey && e.shiftKey) {
        if (e.deltaX !== 0) {
          setIframeLeft((prev) => prev + e.deltaX * ilitFactor);
        }
        if (e.deltaY !== 0) {
          setIframeTop((prev) => prev + e.deltaY * ilitFactor);
        }
        e.preventDefault();
      }
      // COMMAND + OPTION (without SHIFT): Adjust I.S (iframe scale) with finer increments.
      else if (e.metaKey && e.altKey && !e.shiftKey) {
        if (e.deltaY !== 0) {
          setIframeScale((prev) => {
            const newScale = Math.max(0.1, prev + (e.deltaY > 0 ? -scaleFactor : scaleFactor));
            return parseFloat(newScale.toFixed(3));
          });
          e.preventDefault();
        }
      }
      // COMMAND + SHIFT (without OPTION): Adjust container dimensions.
      else if (e.metaKey && e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
      // COMMAND only: Adjust I.W and I.H.
      else if (e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setIframeWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setIframeHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [showFineControls]);

  // Open the current iFrame link in a new tab.
  function openCurrentLink() {
    if (iframeSrc) {
      window.open(iframeSrc, "_blank");
    }
  }

  // ------------------------------
  // Touch/Swipe Handling
  // ------------------------------
  const handleTouchStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    touchStartY.current = e.touches[0].clientY;
   // console.log("Touch Start Y:", touchStartY.current);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    touchEndY.current = e.touches[0].clientY;
    //console.log("Touch Move Y:", touchEndY.current);
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // minimum distance for a swipe
    
    //console.log("Touch End - Start Y:", touchStartY.current, "End Y:", touchEndY.current, "Distance:", swipeDistance);

    if (swipeDistance > minSwipeDistance) {
      // Swiped up (go to next)
      //console.log("Swiped UP - Going to NEXT");
      goNext();
    } else if (swipeDistance < -minSwipeDistance) {
      // Swiped down (go to previous)
      //console.log("Swiped DOWN - Going to PREVIOUS");
      goPrev();
    } else {
      //console.log("Swipe distance too small:", swipeDistance);
    }

    // Reset values
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Add touch event listeners with capture phase
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    container.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    container.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [goNext, goPrev]);

  // ------------------------------
  // Full-Tab Mode DOM Manipulation
  // ------------------------------
  useEffect(() => {
    const container = containerRef.current;
    //console.log("Full-tab effect triggered. isFullTab:", isFullTab, "container:", container);
    
    if (!container) {
      console.warn("Container ref not available yet");
      return;
    }
    
    if (!isFullTab) {
      //console.log("Not in full-tab mode, skipping DOM manipulation");
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find the workspace-leaf-content ancestor
      const workspaceLeaf = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!workspaceLeaf) {
        console.warn("Could not find workspace-leaf-content ancestor");
        //console.log("Container parent chain:", container.parentElement);
        return;
      }
      //console.log("Found workspace-leaf-content:", workspaceLeaf);

      // Find view-content (like BasicView v2 does) or fallback to workspace-leaf-content
      const contentWrapper = findDirectChildByClass(workspaceLeaf, "view-content") || workspaceLeaf;
      //console.log("Found content wrapper:", contentWrapper);

      // Save original parent and position
      const originalParent = container.parentElement;
      const originalPosition = container.style.position;
      const originalTop = container.style.top;
      const originalLeft = container.style.left;
      const originalWidth = container.style.width;
      const originalHeight = container.style.height;
      const originalZIndex = container.style.zIndex;
      const originalBackground = container.style.backgroundColor;
      const originalOverflow = container.style.overflow;

      // Set parent position if static (like BasicView v2)
      const parentOriginalPosition = window.getComputedStyle(contentWrapper).position;
      if (parentOriginalPosition === "static") {
        contentWrapper.style.position = "relative";
      }

      // Create placeholder
      const placeholder = document.createElement("div");
      placeholder.style.display = "none";
      originalParent.insertBefore(placeholder, container);

      // Move to content wrapper
      contentWrapper.appendChild(container);
      //console.log("Container moved to content wrapper");

      // Apply full-tab styles (like BasicView v2)
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.zIndex = "9998";
      container.style.backgroundColor = "var(--background-primary)";
      container.style.overflow = "auto";
      //console.log("Full-tab styles applied");

      // Store cleanup data
      container._cleanupData = {
        placeholder,
        originalParent,
        originalPosition,
        originalTop,
        originalLeft,
        originalWidth,
        originalHeight,
        originalZIndex,
        originalBackground,
        originalOverflow,
        contentWrapper,
        parentOriginalPosition
      };
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      const cleanupData = container._cleanupData;
      if (cleanupData) {
        const { placeholder, originalParent, originalPosition, originalTop, originalLeft, originalWidth, originalHeight, originalZIndex, originalBackground, originalOverflow, contentWrapper, parentOriginalPosition } = cleanupData;
        
        if (placeholder && placeholder.parentElement) {
          placeholder.parentElement.insertBefore(container, placeholder);
          placeholder.remove();
        }
        
        // Restore parent position
        if (contentWrapper && parentOriginalPosition === "static") {
          contentWrapper.style.position = "";
        }
        
        // Restore original styles
        container.style.position = originalPosition;
        container.style.top = originalTop;
        container.style.left = originalLeft;
        container.style.width = originalWidth;
        container.style.height = originalHeight;
        container.style.zIndex = originalZIndex;
        container.style.backgroundColor = originalBackground;
        container.style.overflow = originalOverflow;
        
        delete container._cleanupData;
       // console.log("Full-tab mode cleaned up");
      }
    };
  }, [isFullTab]);

  // ------------------------------
  // Resize Handling
  // ------------------------------
  const updateDimensions = (newWidth) => {
    setWidth(newWidth);
    setIframeWidth(newWidth);
  };
  const observerRef = useResizeObserver(
    containerRef,
    isContainerManualRef,
    updateDimensions
  );
  useWindowResize(isContainerManual, updateDimensions);

  // Apply guidelines based on the URL.
  const applyGuidelines = (url) => {
    const guidelines = getGuidelinesForUrl(url, getIframesGuidelines);
    if (guidelines) {
      setIsContainerManual(true);
      isContainerManualRef.current = true;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      setWidth(guidelines.containerWidth);
      setHeight(guidelines.containerHeight);
      setIframeWidth(guidelines.iframeWidth);
      setIframeHeight(guidelines.iframeHeight);
      setIframeScale(guidelines.iframeScale);
      setIframeLeft(guidelines.iframeLeft);
      setIframeTop(guidelines.iframeTop);
      setDisableIframeInteraction(guidelines.disableIframeInteraction);
    }
  };

  // Update iFrame URL and guidelines when the carousel changes.
  useEffect(() => {
    if (sections.length > 0 && sections[currentIndex]) {
      const newUrl = sections[currentIndex].iframeSrc;
      if (newUrl) {
        setIframeSrc(newUrl);
        applyGuidelines(newUrl);
      } else {
        setIframeSrc("");
      }
    }
  }, [currentIndex, sections]);

  // Simulate a click in the iFrame if interaction is disabled.
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    window.requestAnimationFrame(() => {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      if (
        clickX >= iframeLeft &&
        clickX <= iframeLeft + iframeWidth &&
        clickY >= iframeTop &&
        clickY <= iframeTop + iframeHeight
      ) {
        const relativeX = (clickX - iframeLeft) / iframeScale;
        const relativeY = (clickY - iframeTop) / iframeScale;
        if (iframeWrapperRef.current) {
          const iframe = iframeWrapperRef.current.querySelector("iframe");
          if (iframe) {
            try {
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(
                relativeX,
                relativeY
              );
              if (targetElement) {
                const simulatedClick = new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: relativeX,
                  clientY: relativeY,
                });
                targetElement.dispatchEvent(simulatedClick);
              }
            } catch (error) {
              console.error("Unable to simulate click in iframe:", error);
            }
          }
        }
      }
    });
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* iFrame viewer area with header and controls */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{ flex: "1 1 auto", overflow: "hidden", position: "relative", touchAction: "none" }}
      >
        {/* Compact Header */}
        <dc.Stack style={{ 
          padding: "12px 16px",
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid #1a1a1a"
        }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "12px"
            }}
          >
            {/* Left: Back button (if provided) or Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "0 0 auto" }}>
              {onBack && (
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    backgroundColor: "#1a1a1a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                >
                  <dc.Icon icon="arrow-left" style={{ fontSize: "14px" }} />
                  <span>Back to Explorer</span>
                </button>
              )}
              <h1 ref={titleRef} style={{ 
                margin: 0, 
                fontSize: "1em",
                color: backLabel ? "#a0a0a0" : "#e0e0e0",
                fontWeight: "500",
                borderLeft: (onBack && backLabel) ? "1px solid #2a2a2a" : "none",
                paddingLeft: (onBack && backLabel) ? "12px" : "0"
              }}>
                {backLabel || headerText}
              </h1>
            </div>
            
            {/* Center: Navigation Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "0 0 auto" }}>
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: currentIndex > 0 ? "#a0a0a0" : "#444",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : (currentIndex > 0 ? "pointer" : "default"),
                  opacity: showFineControls ? 0.5 : 1,
                  visibility: currentIndex > 0 ? "visible" : "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? goPrev : undefined}
              >
                <dc.Icon icon="chevron-up" style={{ fontSize: "14px" }} />
              </button>
              
              {sections.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px",
                  color: "#a0a0a0",
                  fontSize: "12px"
                }}>
                  <input
                    type="number"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={handleEntryInputKeyDown}
                    onBlur={handleEntryInputBlur}
                    style={{ 
                      width: "40px", 
                      textAlign: "center",
                      background: "#141414",
                      color: "#e0e0e0",
                      border: "1px solid #2a2a2a",
                      borderRadius: "4px",
                      padding: "3px",
                      fontSize: "12px"
                    }}
                  />
                  <span style={{ whiteSpace: "nowrap" }}>/{sections.length}</span>
                </div>
              )}
              
              {/* Reload Button */}
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : "pointer",
                  opacity: showFineControls ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? reloadCurrent : undefined}
                title="Reload current entry"
              >
                <dc.Icon icon="refresh-cw" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: currentIndex < sections.length - 1 ? "#a0a0a0" : "#444",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : (currentIndex < sections.length - 1 ? "pointer" : "default"),
                  opacity: showFineControls ? 0.5 : 1,
                  visibility: currentIndex < sections.length - 1 ? "visible" : "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? goNext : undefined}
              >
                <dc.Icon icon="chevron-down" style={{ fontSize: "14px" }} />
              </button>
            </div>
            
            {/* Right: Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: "0 0 auto" }}>
              <button
                style={{
                  background: disableIframeInteraction ? "#1a1a1a" : "#8b5cf6",
                  color: disableIframeInteraction ? "#a0a0a0" : "#ffffff",
                  border: "1px solid " + (disableIframeInteraction ? "#2a2a2a" : "#8b5cf6"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDisableIframeInteraction(!disableIframeInteraction);
                }}
                title={disableIframeInteraction ? "Enable iframe interaction" : "Disable iframe interaction"}
              >
                {disableIframeInteraction ? "EN" : "DIS"}
              </button>
              
              <button
                style={{
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openCurrentLink();
                }}
                title="Open in new tab"
              >
                <dc.Icon icon="external-link" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={{
                  background: menuOpen ? "#8b5cf6" : "#1a1a1a",
                  color: menuOpen ? "#ffffff" : "#a0a0a0",
                  border: "1px solid " + (menuOpen ? "#8b5cf6" : "#2a2a2a"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="Toggle menu"
              >
                <dc.Icon icon="menu" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={{
                  background: showFineControls ? "#8b5cf6" : "#1a1a1a",
                  color: showFineControls ? "#ffffff" : "#a0a0a0",
                  border: "1px solid " + (showFineControls ? "#8b5cf6" : "#2a2a2a"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFineControls((prev) => !prev);
                }}
                title="Toggle fine controls"
              >
                <dc.Icon icon="settings" style={{ fontSize: "14px" }} />
              </button>
              
              {/* Full-Tab Toggle Button - Only show if enabled */}
              {showFullTabToggle && (
                <button
                  style={{
                    background: isFullTab ? "#8b5cf6" : "#1a1a1a",
                    color: isFullTab ? "#ffffff" : "#a0a0a0",
                    border: "1px solid " + (isFullTab ? "#8b5cf6" : "#2a2a2a"),
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullTab(!isFullTab);
                  }}
                  title={isFullTab ? "Exit full-tab mode" : "Enter full-tab mode"}
                >
                  <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
                </button>
              )}
            </div>
          </div>
          {/* Fine controls row */}
          {showFineControls && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#141414",
                borderRadius: "8px",
                border: "1px solid #2a2a2a",
                alignItems: "center",
              }}
            >
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                C.W
                <input
                  type="number"
                  value={width}
                  onChange={(e) =>
                    setWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                C.H
                <input
                  type="number"
                  value={height}
                  onChange={(e) =>
                    setHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.W
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) =>
                    setIframeWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.H
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) =>
                    setIframeHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.S
                <input
                  type="number"
                  step="0.001"
                  value={iframeScale.toFixed(3)}
                  onChange={(e) =>
                    setIframeScale(parseFloat(e.target.value) || 1)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.L
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) =>
                    setIframeLeft(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.T
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) =>
                    setIframeTop(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
            </div>
          )}
        </dc.Stack>

        {iframeSrc && (
          <dc.Stack style={{ padding: "10px" }}>
            <IframeContainer
              width={width}
              height={height}
              iframeSrc={iframeSrc}
              iframeWidth={iframeWidth}
              iframeHeight={iframeHeight}
              iframeScale={iframeScale}
              iframeLeft={iframeLeft}
              iframeTop={iframeTop}
              disableIframeInteraction={disableIframeInteraction}
              iframeWrapperRef={iframeWrapperRef}
            />
          </dc.Stack>
        )}

        {/* Hamburger drawer for inline editing - inside containerRef so it moves with full-tab */}
        {menuOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "300px",
              height: "100%",
              background: "#0a0a0a",
              borderLeft: "1px solid #2a2a2a",
              padding: "20px",
              overflowY: "auto",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, color: "#e0e0e0", fontSize: "16px" }}>Edit Section</h2>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ 
                  fontSize: "14px", 
                  cursor: "pointer", 
                  padding: "6px 12px",
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px"
                }}
              >
                <dc.Icon icon="x" style={{ fontSize: "14px" }} />
              </button>
            </div>
            <FileSectionsProvider
              fileName={fileName}
              editable={true}
              currentSectionIndex={currentIndex}
              onSectionUpdate={(newText) => {
                const newSections = [...sections];
                newSections[currentIndex].text = newText;
                setSections(newSections);
              }}
            />
          </div>
        )}

      </div>

      {/* FileSectionsProvider loads sections based on the dynamic fileName */}
      <FileSectionsProvider fileName={fileName} onSectionsLoaded={setSections} onFilePathLoaded={setLoadedFilePath} />
    </div>
  );
}

return { View };
