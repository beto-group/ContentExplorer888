const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
const outerFolderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const base = outerFolderPath + "/src";

const { getIframesGuidelines } = await dc.require(`${base}/utils/IframesGuidelines.js`);
const { FileSectionsProvider } = await dc.require(`${base}/components/FileSectionsProvider.jsx`);
const { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeControls, IframeContainer } = await dc.require(`${base}/utils/UtilityFunctions.jsx`);

/**
 * Main View Component
 *
 * Combines the iFrame viewer with navigation controls and a hamburger
 * drawer for inline editing. Adopts the custom glassmorphism OLED design system of CUSTOM FEED.
 */
function View({ title = "PHYSICAL.enigmas", spawnType = "fullTab", onBack = null, backLabel = "", folderPath, dc }) {
  const { useState, useEffect, useMemo, useRef } = dc;
  const resolvedFolderPath = folderPath || outerFolderPath;
  
  // Suppress third-party iframe errors (Instagram, Facebook, etc.) from console
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('Unable to parse uri') ||
        message.includes('ajax/bulk-route-definitions') ||
        message.includes('ErrorUtils caught an error') ||
        message.includes('fburl.com/debugjs') ||
        message.includes('Unexpected token') ||
        message.includes('<!DOCTYPE')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('third-party cookies') ||
        message.includes('Instagram') ||
        message.includes('Facebook')
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  // Parse spawnType to determine initial mode and toggle visibility
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  const fileName = `${title}..md`;

  // Container & iFrame states
  const [width, setWidth] = useState(800); 
  const [height, setHeight] = useState(600); 
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);

  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800); 
  const [iframeHeight, setIframeHeight] = useState(666); 
  const [iframeScale, setIframeScale] = useState(1);     
  const [iframeLeft, setIframeLeft] = useState(10);        
  const [iframeTop, setIframeTop] = useState(10);          
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);

  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showFineControls, setShowFineControls] = useState(false);

  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
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

  // File Sections & Navigation Logic
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedFilePath, setLoadedFilePath] = useState("");
  const [entryInput, setEntryInput] = useState("1");

  useEffect(() => {
    setEntryInput(String(currentIndex + 1));
  }, [currentIndex]);

  const titleRef = useRef(null);
  
  const headerText = useMemo(() => {
    if (loadedFilePath) {
      const segments = loadedFilePath.split("/");
      const filename = segments[segments.length - 1];
      return filename.replace(/\.\.md$/, "").replace(/\.md$/, "");
    }
    const parts = fileName.split("..md");
    return parts[0] || fileName.replace(/\.[^/.]+$/, "");
  }, [loadedFilePath, fileName]);

  // Simulated click with press delay logic
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

  function simulateTitleClickDelayed(delay = 500, pressDelay = 200) {
    setTimeout(() => {
      simulateTitleClickWithPressDelay(pressDelay);
    }, delay);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      simulateTitleClickWithPressDelay();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Navigation handlers
  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev < sections.length - 1) {
        return prev + 1;
      } else {
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
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const reloadCurrent = () => {
    const current = currentIndex;
    setCurrentIndex(-1);
    setTimeout(() => {
      setCurrentIndex(current);
    }, 10);
  };

  function updateCurrentIndexFromInput() {
    const parsed = parseInt(entryInput, 10);
    if (!isNaN(parsed) && sections.length > 0) {
      let newIndex = parsed - 1;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sections.length) newIndex = sections.length - 1;
      setCurrentIndex(newIndex);
    }
  }

  function handleEntryInputKeyDown(e) {
    if (e.key === "Enter") {
      updateCurrentIndexFromInput();
    }
  }
  function handleEntryInputBlur() {
    updateCurrentIndexFromInput();
  }

  // Keyboard Alt shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

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
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFineControls, goPrev, goNext]);

  // Fine Controls Wheel adjusters
  useEffect(() => {
    if (!showFineControls) return;

    function handleWheel(e) {
      const baseFactor = 0.2;
      const ilitFactor = 0.5;
      const scaleFactor = 0.001;

      if (e.metaKey && e.altKey && e.shiftKey) {
        if (e.deltaX !== 0) {
          setIframeLeft((prev) => prev + e.deltaX * ilitFactor);
        }
        if (e.deltaY !== 0) {
          setIframeTop((prev) => prev + e.deltaY * ilitFactor);
        }
        e.preventDefault();
      }
      else if (e.metaKey && e.altKey && !e.shiftKey) {
        if (e.deltaY !== 0) {
          setIframeScale((prev) => {
            const newScale = Math.max(0.1, prev + (e.deltaY > 0 ? -scaleFactor : scaleFactor));
            return parseFloat(newScale.toFixed(3));
          });
          e.preventDefault();
        }
      }
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

  function openCurrentLink() {
    if (iframeSrc) {
      window.open(iframeSrc, "_blank");
    }
  }

  // Touch Swipe Gesture handlers
  const handleTouchStart = (e) => {
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; 
    
    if (swipeDistance > minSwipeDistance) {
      goNext();
    } else if (swipeDistance < -minSwipeDistance) {
      goPrev();
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    container.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
    container.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [goNext, goPrev]);

  // Fullscreen Portal DOM handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!isFullTab) return;

    // Inject impeccable status bar suppression stylesheet
    const styleId = `impeccable-status-viewer-${title.replace(/[^a-zA-Z0-9]/g, "")}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        /* Hide global status bar and view footers */
        .status-bar, .view-footer, .workspace-leaf-content-footer { 
            display: none !important; 
        }
        
        /* Expand workspace-leaf-content to edge-to-edge container */
        .workspace-leaf-content { 
            padding: 0 !important; 
            margin: 0 !important; 
            border-radius: 0 !important; 
        }
      `;
      document.head.appendChild(styleEl);
    }

    const timer = setTimeout(() => {
      const workspaceLeaf = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!workspaceLeaf) return;

      const contentWrapper = findDirectChildByClass(workspaceLeaf, "view-content") || workspaceLeaf;

      const originalParent = container.parentElement;
      const originalPosition = container.style.position;
      const originalTop = container.style.top;
      const originalLeft = container.style.left;
      const originalWidth = container.style.width;
      const originalHeight = container.style.height;
      const originalZIndex = container.style.zIndex;
      const originalBackground = container.style.backgroundColor;
      const originalOverflow = container.style.overflow;

      const parentOriginalPosition = window.getComputedStyle(contentWrapper).position;
      if (parentOriginalPosition === "static") {
        contentWrapper.style.position = "relative";
      }

      const placeholder = document.createElement("div");
      placeholder.style.display = "none";
      originalParent.insertBefore(placeholder, container);

      contentWrapper.appendChild(container);

      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.zIndex = "9998";
      container.style.backgroundColor = "var(--background-primary)";
      container.style.overflow = "auto";

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
        parentOriginalPosition,
        styleId
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      const el = document.getElementById(styleId);
      if (el) el.remove();

      const cleanupData = container._cleanupData;
      if (cleanupData) {
        const { placeholder, originalParent, originalPosition, originalTop, originalLeft, originalWidth, originalHeight, originalZIndex, originalBackground, originalOverflow, contentWrapper, parentOriginalPosition } = cleanupData;
        
        if (placeholder && placeholder.parentElement) {
          placeholder.parentElement.insertBefore(container, placeholder);
          placeholder.remove();
        }
        
        if (contentWrapper && parentOriginalPosition === "static") {
          contentWrapper.style.position = "";
        }
        
        container.style.position = originalPosition;
        container.style.top = originalTop;
        container.style.left = originalLeft;
        container.style.width = originalWidth;
        container.style.height = originalHeight;
        container.style.zIndex = originalZIndex;
        container.style.backgroundColor = originalBackground;
        container.style.overflow = originalOverflow;
        
        delete container._cleanupData;
      }
    };
  }, [isFullTab]);

  // Resize handler
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
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(relativeX, relativeY);
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

  return (
    <div style={styles.cfContainer}>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={styles.viewerArea}
      >
        {/* Glassmorphism Header */}
        <div style={styles.cfHeader}>
          <div style={styles.headerTitleArea}>
            {onBack && (
              <button
                style={styles.backBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                title="Back to Ring Node Explorer"
              >
                <dc.Icon icon="arrow-left" style={{ fontSize: "14px", marginRight: "6px" }} />
                <span>Back to Explorer</span>
              </button>
            )}
            <dc.Icon icon="rss" style={styles.headerIcon} />
            <h1 ref={titleRef} style={styles.headerTitle}>
              {backLabel || headerText}
            </h1>
          </div>
          
          {/* Navigation & Action Controls */}
          <div style={styles.controlsRow}>
            <div style={styles.navButtonGroup}>
              <button
                disabled={showFineControls || currentIndex <= 0}
                style={currentIndex > 0 && !showFineControls ? styles.navBtn : styles.navBtnDisabled}
                onClick={currentIndex > 0 && !showFineControls ? goPrev : undefined}
                title="Previous section"
              >
                <dc.Icon icon="chevron-left" style={{ fontSize: "16px" }} />
              </button>
              
              {sections.length > 0 && (
                <div style={styles.counterBadge}>
                  <input
                    type="number"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={handleEntryInputKeyDown}
                    onBlur={handleEntryInputBlur}
                    style={styles.counterInput}
                  />
                  <span style={styles.counterTotal}>/ {sections.length}</span>
                </div>
              )}
              
              <button
                disabled={showFineControls || currentIndex >= sections.length - 1}
                style={currentIndex < sections.length - 1 && !showFineControls ? styles.navBtn : styles.navBtnDisabled}
                onClick={currentIndex < sections.length - 1 && !showFineControls ? goNext : undefined}
                title="Next section"
              >
                <dc.Icon icon="chevron-right" style={{ fontSize: "16px" }} />
              </button>
            </div>
            
            <div style={styles.actionButtonGroup}>
              <button
                style={disableIframeInteraction ? styles.actionBtn : styles.actionBtnActive}
                onClick={(e) => {
                  e.stopPropagation();
                  setDisableIframeInteraction(!disableIframeInteraction);
                }}
                title={disableIframeInteraction ? "Interact mode is Lock" : "Interact mode is Unlock"}
              >
                <dc.Icon icon={disableIframeInteraction ? "lock" : "unlock"} style={{ fontSize: "14px" }} />
                <span style={{ fontSize: "11px", fontWeight: "600", marginLeft: "4px" }}>
                  {disableIframeInteraction ? "LOCK" : "UNLOCKED"}
                </span>
              </button>
              
              <button
                style={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  openCurrentLink();
                }}
                title="Open original website link in browser"
              >
                <dc.Icon icon="external-link" style={{ fontSize: "14px" }} />
              </button>

              <button
                style={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  reloadCurrent();
                }}
                title="Reload current section"
              >
                <dc.Icon icon="refresh-cw" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={menuOpen ? styles.actionBtnActive : styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="Edit current section text"
              >
                <dc.Icon icon="edit-3" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={showFineControls ? styles.actionBtnActive : styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFineControls((prev) => !prev);
                }}
                title="Tune layout fine offsets"
              >
                <dc.Icon icon="sliders" style={{ fontSize: "14px" }} />
              </button>
              
              {showFullTabToggle && (
                <button
                  style={isFullTab ? styles.actionBtnActive : styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullTab(!isFullTab);
                  }}
                  title={isFullTab ? "Exit Fullscreen Portal" : "Enter Fullscreen Portal"}
                >
                  <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
                </button>
              )}
            </div>
          </div>

          {/* Fine Tuning Panel */}
          {showFineControls && (
            <div style={styles.fineTunePanel}>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>C.W</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>C.H</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>I.W</span>
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) => setIframeWidth(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>I.H</span>
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>I.S</span>
                <input
                  type="number"
                  step="0.001"
                  value={iframeScale}
                  onChange={(e) => setIframeScale(parseFloat(e.target.value) || 1)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>I.L</span>
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) => setIframeLeft(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
              <div style={styles.fineField}>
                <span style={styles.fineLabel}>I.T</span>
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) => setIframeTop(parseFloat(e.target.value) || 0)}
                  style={styles.fineInput}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Main Stream */}
        <div style={styles.streamBody}>
          {iframeSrc ? (
            <div style={styles.stageFrame}>
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
            </div>
          ) : (
            <div style={styles.noFrameStage}>
              <dc.Icon icon="alert-circle" style={{ fontSize: "36px", color: "hsla(0,0%,100%,0.2)" }} />
              <span style={{ color: "hsla(0,0%,100%,0.4)", fontSize: "14px", marginTop: "8px" }}>
                No active media embed link detected in this section.
              </span>
            </div>
          )}
        </div>

        {/* Hamburger/Slide drawer for edit pane */}
        {menuOpen && (
          <div style={styles.drawerPane}>
            <div style={styles.drawerHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <dc.Icon icon="file-text" style={{ fontSize: "16px", color: "hsl(250, 84%, 66%)" }} />
                <h2 style={styles.drawerTitle}>Edit Document Block</h2>
              </div>
              <button onClick={() => setMenuOpen(false)} style={styles.drawerCloseBtn}>
                <dc.Icon icon="x" style={{ fontSize: "14px" }} />
              </button>
            </div>
            <div style={styles.drawerBody}>
              <FileSectionsProvider
                fileName={fileName}
                folderPath={resolvedFolderPath}
                editable={true}
                currentSectionIndex={currentIndex}
                onSectionUpdate={(newText) => {
                  const newSections = [...sections];
                  newSections[currentIndex].text = newText;
                  setSections(newSections);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <FileSectionsProvider 
        fileName={fileName} 
        folderPath={resolvedFolderPath}
        onSectionsLoaded={setSections} 
        onFilePathLoaded={setLoadedFilePath} 
      />
    </div>
  );
}

// Curated Elite HSL Styling System (OLED Edge-to-Edge Theme)
const styles = {
  cfContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "hsl(220, 20%, 4%)",
    color: "hsl(220, 10%, 90%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  viewerArea: {
    flex: "1 1 auto",
    overflow: "hidden",
    position: "relative",
    touchAction: "none",
    height: "100%",
    width: "100%"
  },
  cfHeader: {
    padding: "16px 24px",
    backgroundColor: "hsla(220, 20%, 4%, 0.7)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid hsla(0, 0%, 100%, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    zIndex: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
  },
  headerTitleArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  headerIcon: {
    fontSize: "18px",
    color: "hsl(250, 84%, 66%)"
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.1em",
    fontWeight: "600",
    letterSpacing: "0.2px",
    color: "hsl(220, 10%, 95%)"
  },
  backBtn: {
    background: "hsla(0,0%,100%,0.04)",
    color: "hsl(220, 10%, 85%)",
    border: "1px solid hsla(0,0%,100%,0.08)",
    borderRadius: "8px",
    padding: "0 14px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    marginRight: "8px"
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap"
  },
  navButtonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "hsla(0,0%,100%,0.03)",
    borderRadius: "10px",
    padding: "4px",
    border: "1px solid hsla(0,0%,100%,0.04)"
  },
  navBtn: {
    background: "none",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    color: "hsl(220, 10%, 80%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  navBtnDisabled: {
    background: "none",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    color: "hsla(0,0%,100%,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default"
  },
  counterBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "hsl(220, 10%, 75%)",
    fontSize: "13px",
    padding: "0 8px"
  },
  counterInput: {
    width: "36px",
    textAlign: "center",
    background: "hsla(0,0%,100%,0.04)",
    color: "hsl(220, 10%, 90%)",
    border: "1px solid hsla(0,0%,100%,0.08)",
    borderRadius: "6px",
    padding: "3px",
    fontSize: "12px",
    outline: "none",
    transition: "all 0.2s ease"
  },
  counterTotal: {
    color: "hsla(0,0%,100%,0.4)"
  },
  actionButtonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  actionBtn: {
    background: "hsla(0,0%,100%,0.04)",
    color: "hsl(220, 10%, 80%)",
    border: "1px solid hsla(0,0%,100%,0.06)",
    borderRadius: "8px",
    padding: "0 10px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  actionBtnActive: {
    background: "hsla(250, 84%, 66%, 0.2)",
    color: "hsl(250, 84%, 85%)",
    border: "1px solid hsl(250, 84%, 66%)",
    borderRadius: "8px",
    padding: "0 10px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  fineTunePanel: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px",
    padding: "12px",
    backgroundColor: "hsla(0,0%,0%,0.4)",
    borderRadius: "10px",
    border: "1px solid hsla(0,0%,100%,0.06)"
  },
  fineField: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "hsla(0,0%,100%,0.02)",
    border: "1px solid hsla(0,0%,100%,0.04)",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  fineLabel: {
    color: "hsla(0,0%,100%,0.4)",
    fontSize: "11px",
    fontWeight: "bold"
  },
  fineInput: {
    width: "48px",
    background: "none",
    border: "none",
    color: "hsl(220, 10%, 90%)",
    fontSize: "12px",
    outline: "none",
    textAlign: "center"
  },
  streamBody: {
    width: "100%",
    height: "calc(100% - 110px)",
    overflowY: "auto",
    padding: "32px 16px 80px 16px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  stageFrame: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  noFrameStage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center"
  },
  drawerPane: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "350px",
    height: "100%",
    background: "hsla(220, 20%, 4%, 0.95)",
    backdropFilter: "blur(30px)",
    borderLeft: "1px solid hsla(0, 0%, 100%, 0.08)",
    padding: "24px",
    boxSizing: "border-box",
    overflowY: "auto",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxShadow: "-10px 0 30px rgba(0,0,0,0.6)"
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid hsla(0,0%,100%,0.06)",
    paddingBottom: "12px"
  },
  drawerTitle: {
    margin: 0,
    color: "hsl(220, 10%, 90%)",
    fontSize: "15px",
    fontWeight: "600"
  },
  drawerCloseBtn: {
    border: "none",
    background: "hsla(0,0%,100%,0.04)",
    color: "hsla(0,0%,100%,0.5)",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  drawerBody: {
    flex: "1 1 auto",
    overflowY: "auto"
  }
};

return { View };
