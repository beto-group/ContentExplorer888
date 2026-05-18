////////////////////////////////////////////////////
///       Future Proof Radial Header View         ///
////////////////////////////////////////////////////

const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const base = folderPath + "/src";

const { useState, useMemo, useRef, useEffect } = dc;
const centerHeader = "888.namzu";

// ---------------------------------------------------------------------
// DOM Traversal Utilities (from BasicView v2)
// ---------------------------------------------------------------------
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
      return child;
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// 1) parseHeaderName
// ---------------------------------------------------------------------
function parseHeaderName(str) {
  let cleaned = str.replace(/\[\[|\]\]/g, "").trim();
  if (cleaned.includes("|")) {
    cleaned = cleaned.split("|").pop().trim();
  }
  // NEW: If path separators exist, take only the filename
  if (cleaned.includes("/")) {
    cleaned = cleaned.split("/").pop().trim();
  }
  return cleaned;
}

// ---------------------------------------------------------------------
// angleDiff – compute the difference between two angles (in radians)
// ---------------------------------------------------------------------
function angleDiff(a, b) {
  let diff = a - b;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return diff;
}

// ---------------------------------------------------------------------
// Helper: ringDistance – Euclidean distance between points on two circles
// with radii r2 and r3 at angles a and c respectively.
// ---------------------------------------------------------------------
function ringDistance(a, c, r2, r3) {
  const diff = a - c;
  return Math.sqrt(r2 * r2 + r3 * r3 - 2 * r2 * r3 * Math.cos(diff));
}

// ---------------------------------------------------------------------
// Helper: pickBestSlot – given a set of available angles (slots) and a target angle,
// pick the slot that is closest (in absolute angular difference).
// ---------------------------------------------------------------------
function pickClosestSlot(availableSlots, targetAngle) {
  let bestSlot = availableSlots[0];
  let bestDiff = Math.abs(angleDiff(bestSlot, targetAngle));
  for (let i = 1; i < availableSlots.length; i++) {
    const d = Math.abs(angleDiff(availableSlots[i], targetAngle));
    if (d < bestDiff) {
      bestSlot = availableSlots[i];
      bestDiff = d;
    }
  }
  return bestSlot;
}

// ---------------------------------------------------------------------
// Assume GetImagesPlaceholders is defined elsewhere
// ---------------------------------------------------------------------
const { GetImagesPlaceholders } = await dc.require(`${base}/components/ImagesPlaceholder.jsx`);

// ---------------------------------------------------------------------
// 2) CenterNode Component
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// 2) CenterNode Component
// ---------------------------------------------------------------------
function CenterNode({ 
  centerLabel, 
  onMiddleClick, 
  circleRadius, 
  placeholderMarkdown,
  onDrop,       // NEW
  onDragOver    // NEW
}) {
  const iconName = parseHeaderName(centerLabel).replace(".namzu", "");
  const textPathRadius = circleRadius * 1.2;
  const imageSize = circleRadius * 1.33;
  const pathId = `center-title-path-${circleRadius}`;

  return (
    <g 
      onClick={onMiddleClick} 
      onDrop={onDrop}           // NEW
      onDragOver={onDragOver}   // NEW
      style={{ cursor: "pointer" }}
    >
      <defs>
        <path
          id={pathId}
          d={`M ${-textPathRadius},0 
             A ${textPathRadius},${textPathRadius} 0 1,1 ${textPathRadius},0 
             A ${textPathRadius},${textPathRadius} 0 1,1 ${-textPathRadius},0`}
          fill="none"
        />
      </defs>
      <circle r={circleRadius} fill="#000" />
      <GetImagesPlaceholders
        iconName={iconName}
        size={imageSize}
        x={-imageSize / 2}
        y={-imageSize / 2}
        fallbackMarkdown={placeholderMarkdown}
      />
      <g style={{ animation: "rotateThis 8s linear infinite" }}>
        <text
          fill="white"
          fontSize={Math.max(10, circleRadius / 1.5)}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <textPath xlinkHref={`#${pathId}`} startOffset="50%">
            {iconName}
          </textPath>
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------
// 3) OuterNode for ring2 – uniform sizing for all nodes
// ---------------------------------------------------------------------
function OuterNode({
  header,
  onCenterClick,
  nodeRadius = 22,
  hoverScale = 1.6,
  placeholderMarkdown,
  onHover = () => {},
  onHoverEnd = () => {},
}) {
  const [isHovered, setIsHovered] = useState(false);
  const label = parseHeaderName(header);
  const newCenter = label.endsWith(".namzu") ? label : `${label}.namzu`;
  const pathId = `node-path-${label.replace(/\s+/g, "")}-${nodeRadius}`;
  const scaleFactor = isHovered ? hoverScale : 1.0;

  const nodeContent = (
    <g transform={`scale(${scaleFactor})`}>
      <defs>
        <path
          id={pathId}
          d={`
            M 0 -${nodeRadius}
            a ${nodeRadius},${nodeRadius} 0 1,1 0,${2 * nodeRadius} 
            a ${nodeRadius},${nodeRadius} 0 1,1 0,-${2 * nodeRadius}`}
          fill="none"
        />
      </defs>
      <circle r={nodeRadius} fill="#000" />
      <GetImagesPlaceholders
        iconName={label}
        size={nodeRadius * 1.4}
        x={-nodeRadius * 0.7}
        y={-nodeRadius * 0.7}
        fallbackMarkdown={placeholderMarkdown}
      />
      <g style={{ animation: "rotateThis 8s linear infinite" }}>
        <text
          fill="white"
          fontSize={Math.max(10, nodeRadius / 2)}
          fontWeight="bold"
          textAnchor="middle"
        >
          <textPath xlinkHref={`#${pathId}`} startOffset="50%">
            {label}
          </textPath>
        </text>
      </g>
    </g>
  );

  return (
    <g
      style={{ cursor: "pointer", transform: `scale(${scaleFactor})` }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverEnd();
      }}
      onClick={() => onCenterClick(newCenter)}
    >
      {nodeContent}
    </g>
  );
}

// ---------------------------------------------------------------------
// 3a) OuterNodeRing3 for ring3 – dynamic sizing + label shrinking
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// 3a) OuterNodeRing3 for ring3 – dynamic sizing + label shrinking
// ---------------------------------------------------------------------
function OuterNodeRing3({
  header,
  angle, // node's angle in radians
  onCenterClick,
  nodeRadius = 18,
  hoverScale = 1.4,
  placeholderMarkdown,
  onHover = () => {},
  onHoverEnd = () => {},
  leftTopPadding = -2,  // optional, in pixels
  rightTopPadding = 4, // optional, in pixels
  isDense = false, // New prop: if true, hide text by default
}) {
  const [isHovered, setIsHovered] = useState(false);
  const label = parseHeaderName(header);
  const newCenter = label.endsWith(".namzu") ? label : `${label}.namzu`;
  const scaleFactor = isHovered ? hoverScale : 1;

  // Determine if node is on the left half.
  const shouldFlip = angle !== undefined && Math.cos(angle) < 0;
  
  // For right-side nodes, use a minimal fixed offset.
  const rightOffset = nodeRadius + 2;
  // For left-side nodes, extra margin is now 2.5 * nodeRadius.
  const leftExtraMargin = -2.5 * nodeRadius;
  const leftOffset = -(nodeRadius + leftExtraMargin);
  
  // Choose offset based on side.
  const xOffset = shouldFlip ? leftOffset : rightOffset;
  const textAnchor = shouldFlip ? "end" : "start";
  const transformTextBase = shouldFlip ? `rotate(180, ${xOffset}, 0)` : "";
  
  // Use provided top padding for left/right if given; otherwise default to -0.2 * nodeRadius.
  const defaultTopPadding = -0.2 * nodeRadius;
  const chosenTopPadding = shouldFlip
    ? (typeof leftTopPadding === "number" ? leftTopPadding : defaultTopPadding)
    : (typeof rightTopPadding === "number" ? rightTopPadding : defaultTopPadding);
  
  const transformText = `translate(0, ${chosenTopPadding}) ${transformTextBase}`.trim();

  const defaultFontSize = Math.max(10, nodeRadius / 2);
  const [computedFontSize, setComputedFontSize] = useState(defaultFontSize);
  const textRef = useRef(null);
  const maxLabelWidth = 100;

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      if (bbox.width > maxLabelWidth && computedFontSize > 5) {
        const newSize = computedFontSize * (maxLabelWidth / bbox.width);
        if (Math.abs(newSize - computedFontSize) > 0.5) {
          setComputedFontSize(newSize);
        }
      }
    }
  }, [label, computedFontSize, maxLabelWidth]);

  const hasDot = label.includes(".");
  let firstPart = label;
  let secondPart = "";
  if (hasDot) {
    const parts = label.split(".");
    firstPart = parts[0];
    secondPart = "." + parts.slice(1).join(".");
  }

  // Cancel parent's rotation for the image
  const cancellationDeg = angle ? (angle * 180) / Math.PI : 0;

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverEnd();
      }}
      onClick={() => onCenterClick(newCenter)}
    >
      {/* Image group: cancel parent's rotation so image stays upright */}
      <g transform={`scale(${scaleFactor}) rotate(${-cancellationDeg})`}>
        <circle r={nodeRadius} fill="#000" />
        <GetImagesPlaceholders
          iconName={label}
          size={nodeRadius * 1.3}
          x={-nodeRadius * 0.65}
          y={-nodeRadius * 0.65}
          fallbackMarkdown={placeholderMarkdown}
        />
      </g>
      {/* Text: Always visible label with readable minimum size */}
      <text
        ref={textRef}
        x={xOffset}
        y={0}
        textAnchor={textAnchor}
        alignmentBaseline="middle"
        fill="white"
        fontSize={Math.max(8, computedFontSize)}
        transform={transformText}
        xmlSpace="preserve"
        style={{ pointerEvents: "none", textShadow: "0px 0px 2px rgba(0,0,0,0.8)" }}
      >
        <tspan>{firstPart}</tspan>
        {hasDot && (
          <tspan fontSize={Math.max(6, computedFontSize * 0.7)} dx="2">
            {secondPart}
          </tspan>
        )}
      </text>
    </g>
  );
}



// ---------------------------------------------------------------------
// 4) RadialHeaderView – ring2 assignment with fixed slots (doubled if <5 groups)
// ---------------------------------------------------------------------
function RadialHeaderView({
  centerLabel = centerHeader,
  secondRingData = [],
  width = 600,
  height = 600,
  backgroundColor = "#333",
  onCenterClick,
  onMiddleClick,
  placeholderMarkdown,
}) {
  // Basic geometry
  const minDim = Math.min(width, height);
  const centerRadius = Math.max(20, minDim * 0.06);
  const centerX = 0;
  const centerY = 0;

  // --- Zoom / Pan State ---
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.78 });
  const [hasCentered, setHasCentered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (width > 0 && height > 0 && !hasCentered) {
      const initialScale = 0.78;
      const verticalOffset = 40; // Shift down by 40px to perfectly clear floating breadcrumbs
      setTransform({
        x: (width / 2) * (1 - initialScale),
        y: (height / 2 + verticalOffset) * (1 - initialScale),
        k: initialScale
      });
      setHasCentered(true);
    }
  }, [width, height, hasCentered]);

  // Zoom Handler
  const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const scaleFactor = Math.exp(delta); // exponential zoom needed for smooth feel
      
      // Clamp scale
      const newScale = Math.max(0.1, Math.min(10, transform.k * scaleFactor));
      // effective factor
      const s = newScale / transform.k;

      // Calculate mouse position relative to the SVG container
      // Note: We need to account for the DOMRect to get 'offsetX/Y' robustly
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust translation to zoom towards mouse
      // new_tx = mx - (mx - old_tx) * s
      const newX = mouseX - (mouseX - transform.x) * s;
      const newY = mouseY - (mouseY - transform.y) * s;

      setTransform({ x: newX, y: newY, k: newScale });
  };

  // Pan Handlers
  const handleMouseDown = (e) => {
      // Allow clicking on nodes/buttons to propagate (checking direct target or implementing click vs drag threshold)
      // For now, middle/right click or left click on background
      // User might want to drag perfectly on background.
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleMouseLeave = () => {
      setIsDragging(false);
  };

  // Configuration
  // Shrink Ring 2 base slightly, but it will be dynamic
  const baseRing2NodeRadius = Math.max(10, minDim * 0.05); 
  const ring2Radius = 0.55 * (minDim / 2);
  const ring2HoverScale = 1.2;
  // Expand Ring 3 radius to give more space
  const ring3Radius = 0.96 * (minDim / 2); 
  // Enlarge Ring 3 significantly to 0.045 (User request: "too small")
  const baseRing3NodeRadius = Math.max(2, minDim * 0.045);
  const ring3HoverScale = 2.2;

  // Sizing ring2 nodes
  // GLOBAL DYNAMIC UNIFORMITY
  // 1. We determine the weighting for all groups first.
  const groups = secondRingData.map((g, i) => ({
    ...g,
    originalIndex: i,
    childCount: g.children ? g.children.length : 0,
    // Keep Weight 6 to ensure sparse categories get wide wedges
    weight: Math.max(6, g.children ? g.children.length : 0)
  }));
  
  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0);
  const isSingleGroup = groups.length === 1;
  const AVAILABLE_ARC = isSingleGroup ? (Math.PI * 1.5) : (Math.PI * 2);
  const START_OFFSET = isSingleGroup ? (Math.PI * 0.25) : 0;

  // 2. Calculate the GLOBAL safe radius for Ring 2.
  //    "unitArc" is the angle for a weight of 1.
  const unitArc = totalWeight > 0 ? (AVAILABLE_ARC / totalWeight) : 0;
  //    The smallest possible wedge has weight 6.
  const minWedgeArc = unitArc * 6;
  //    Calculate the linear arc length for that smallest wedge.
  const minWedgeLength = minWedgeArc * ring2Radius;
  //    Calculate the maximum node radius that fits in that smallest wedge with safety gap.
  //    Gap = 15px.
  const maxSafeRadius = (minWedgeLength - 15) / 2;
  //    The final uniform radius is the smaller of: Base Target vs Max Safe.
  //    This guarantees NO overlap even for the smallest wedge, and enforces uniformity.
  const finalUniformRing2Radius = Math.max(5, Math.min(baseRing2NodeRadius, maxSafeRadius));

  // GLOBAL DYNAMIC UNIFORMITY (RING 3)
  // 1. Scan all groups to find the "worst case" density.
  let minArcPerChildRing3 = Infinity;
  let hasChildren = false;

  groups.forEach(group => {
    if (group.childCount > 0) {
        hasChildren = true;
        const fraction = totalWeight > 0 ? (group.weight / totalWeight) : 1;
        const wedgeSize = fraction * AVAILABLE_ARC;
        // Total arc length available for this group at Ring 3 radius
        const totalGroupArc = wedgeSize * ring3Radius;
        // Average arc per child in this group
        const arcPerChild = totalGroupArc / group.childCount;
        if (arcPerChild < minArcPerChildRing3) {
            minArcPerChildRing3 = arcPerChild;
        }
    }
  });

  // 2. Calculate safe radius fitting the worst case.
  //    Gap buffer = 5px.
  //    If no children exist, default to base size.
  let finalUniformRing3Radius = baseRing3NodeRadius;
  if (hasChildren && minArcPerChildRing3 !== Infinity) {
      const maxSafeR3 = (minArcPerChildRing3 - 5) / 2;
      finalUniformRing3Radius = Math.max(2, Math.min(baseRing3NodeRadius, maxSafeR3));
  }

  let currentAngle = START_OFFSET;
  const ring2Positions = [];
  const ring3Positions = [];

  groups.forEach(group => {
    const fraction = totalWeight > 0 ? (group.weight / totalWeight) : 1;
    const wedgeSize = fraction * AVAILABLE_ARC;
    
    // Ring 2 Parent Node Sizing: 
    // GLOBAL UNIFORMITY: Everyone gets the calculated safe radius.
    const finalR2Radius = finalUniformRing2Radius;

    // Parent Position
    const parentAngle = currentAngle + (wedgeSize / 2);
    const r2Pos = {
        x: centerX + ring2Radius * Math.cos(parentAngle),
        y: centerY + ring2Radius * Math.sin(parentAngle),
        angle: parentAngle,
        heading: group.heading,
        nodeRadius: finalR2Radius,
        groupIndex: group.originalIndex
    };
    ring2Positions.push(r2Pos);
    
    // Children Positions
    if (group.childCount > 0) {
        const step = wedgeSize / group.childCount;
        
        // GLOBAL UNIFORMITY RING 3:
        // Apply the calculated global safe size.
        const dynamicRadius = finalUniformRing3Radius;

        // Smart Dense Mode: 
        // Hide text if the global size had to shrink significantly (< 5px).
        // This keeps the view clean if we are in "super dense" mode.
        const isDense = dynamicRadius < 5;

        group.children.forEach((childLabel, idx) => {
            const childAngle = currentAngle + (idx + 0.5) * step;
            const r3Pos = {
                x: centerX + ring3Radius * Math.cos(childAngle),
                y: centerY + ring3Radius * Math.sin(childAngle),
                angle: childAngle,
                label: childLabel,
                nodeRadius: dynamicRadius, 
                parent: r2Pos,
                isDense: isDense // Pass the flag down
            };
            ring3Positions.push(r3Pos);
        });
    }
    currentAngle += wedgeSize;
  });

  // Generate Lines
  const ring2Lines = ring2Positions.map((pos) => ({
    x1: centerX, y1: centerY, x2: pos.x, y2: pos.y
  }));
  const ring3Lines = ring3Positions.map((pos) => ({
    x1: pos.parent.x, y1: pos.parent.y, x2: pos.x, y2: pos.y
  }));

  // SVG ViewBox
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const pad = 55;
  function updateBounds(x, y, r) {
    if (x - r < minX) minX = x - r;
    if (x + r > maxX) maxX = x + r;
    if (y - r < minY) minY = y - r;
    if (y + r > maxY) maxY = y + r;
  }
  updateBounds(centerX, centerY, centerRadius);
  ring2Positions.forEach((p) => updateBounds(p.x, p.y, p.nodeRadius * ring2HoverScale));
  ring3Positions.forEach((p) => updateBounds(p.x, p.y, (p.nodeRadius || baseRing3NodeRadius) * ring3HoverScale + 30));
  
  const finalWidth = maxX - minX;
  const finalHeight = maxY - minY;
  const viewBox = [minX - pad, minY - pad, finalWidth + 2 * pad, finalHeight + 2 * pad].join(" ");

  // Render Elements
  const ring2LineEls = ring2Lines.map((ln, idx) => (
    <line key={`r2-line-${idx}`} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke="white" strokeWidth="1.2" />
  ));
  const ring3LineEls = ring3Lines.map((ln, idx) => (
    <line key={`r3-line-${idx}`} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke="white" strokeWidth="0.8" />
  ));
  const ring2NodeEls = ring2Positions.map((pos, idx) => (
    <g key={`r2-node-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
      <OuterNode header={pos.heading} nodeRadius={pos.nodeRadius} hoverScale={ring2HoverScale} placeholderMarkdown={placeholderMarkdown} onCenterClick={onCenterClick} />
    </g>
  ));
  const ring3NodeEls = ring3Positions.map((pos, idx) => {
    const deg = (pos.angle * 180) / Math.PI;
    return (
      <g key={`r3-node-${idx}`} transform={`translate(${pos.x}, ${pos.y}) rotate(${deg})`}>
        <OuterNodeRing3 
            header={pos.label} 
            angle={pos.angle} 
            nodeRadius={pos.nodeRadius} 
            hoverScale={ring3HoverScale} 
            placeholderMarkdown={placeholderMarkdown} 
            onCenterClick={onCenterClick}
            isDense={pos.isDense} 
        />
      </g>
    );
  });

  // HANDLER: Drop on Center Node
  const handleCenterDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const textData = e.dataTransfer.getData("text/plain");
      if (!textData) return;

      const cleanName = parseHeaderName(centerLabel).replace(".namzu", "");
      new Notice(`Importing to ${cleanName}...`);

      // Find the Enigma file
      // We search for the specific file name pattern
      const targetName = `${cleanName}.enigmas..md`; 
      const allFiles = app.vault.getFiles();
      let targetFile = allFiles.find(f => f.name === targetName);

      // Smart Fallback: If not found immediately, look for sibling of .namzu
      if (!targetFile) {
          const namzuName = `${cleanName}.namzu.md`;
          const namzuFile = allFiles.find(f => f.name === namzuName);
          if (namzuFile) {
              const dir = namzuFile.parent.path;
              // Construct path expecting it to be in the same folder
              const potentialPath = `${dir}/${targetName}`;
              const potentialFile = app.vault.getAbstractFileByPath(potentialPath);
              if (potentialFile) targetFile = potentialFile;
          }
      }

      if (targetFile) {
          try {
              const content = await app.vault.read(targetFile);
              let newContent;
              
              // Try to insert below #### AENIGMAS using Regex for robustness
              // Matches #### AENIGMAS (case insensitive just in case, multiline)
              const headerRegex = /^(#{1,6})\s*AENIGMAS\s*$/im;
              const match = content.match(headerRegex);
              
              if (match) {
                  // match.index is start of header. match[0].length is length of header line content (excluding potential newline if not captured, but $ matches end of line)
                  // We need to find the newline AFTER this match
                  const headerEndIndex = match.index + match[0].length;
                  
                  // Check if there is a newline character immediately following
                  let insertIndex = headerEndIndex;
                  if (content[headerEndIndex] === '\n') {
                      insertIndex++;
                  } else if (content[headerEndIndex] === '\r' && content[headerEndIndex+1] === '\n') {
                       insertIndex += 2;
                  }

                  const before = content.substring(0, insertIndex);
                  const after = content.substring(insertIndex);
                  
                  // Ensure we have a newline buffer
                  newContent = before + "\n" + textData.trim() + "\n\n" + after;
                  new Notice(`Inserted below Header!`);
              } else {
                  // Fallback: Append to end
                  // console.log("Could not find #### AENIGMAS header.");
                  newContent = content + "\n\n" + textData;
                  new Notice(`Header not found. Appended to bottom.`);
              }

              await app.vault.modify(targetFile, newContent);
              new Notice(`Successfully imported resources to top of AENIGMAS!`);
          } catch (err) {
              console.error(err);
              new Notice(`Failed to write to file.`);
          }
      } else {
          new Notice(`Could not find .enigmas..md file for ${cleanName}`);
      }
  };

  return (
    <div style={{ padding: "0px", width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <svg 
        width="100%" 
        height="100%" 
        style={{ 
            backgroundColor, 
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none" // Prevent browser scrolling
        }} 
        // We remove viewBox because we are handling transform manually for Zoom/Pan
        // Or we use viewBox to center initially and then apply transform on top?
        // Simpler: Just map 0,0 to center of screen initially via logic, or relying on <g> centering.
        // Actually, let's keep it simple: No viewBox, 1:1 mapping, and we just transform the content.
        // BUT the existing code relies on viewBox to "fit" the content. 
        // Solution: Keep viewBox for initial layout? No, that fights manual zoom.
        // Solution: Remove viewBox, and initialize transform.x/y to center the content.
        // Problem: We don't know the exact bounds until render.
        // Hybrid: Use a 'base' group that is centered, and the zoom group transforms that.
        // Let's stick to viewBox but apply transform to a group? No, viewBox scales everything including your mouse coordinates logic.
        // Best approach for manual zoom: No viewBox.
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <style>{`
            @keyframes rotateThis { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </defs>
        
        {/* Zoom/Pan Group */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Center the content initially if needed, or rely on centerX=0, centerY=0 being top-left? 
                The logic defines centerX=0, centerY=0.
                In SVG without viewBox, 0,0 is top left.
                So we need to shift content to center of screen.
                We can add an initial 'centering' translation to the group or 'width/2, height/2' constant.
            */}
             <g transform={`translate(${width/2}, ${height/2 + 40})`}>
                <g>{ring2LineEls}</g>
                <g>{ring3LineEls}</g>
                <g>{ring2NodeEls}</g>
                <g>{ring3NodeEls}</g>
                {/* Center Node */}
                <g transform={`translate(${centerX}, ${centerY})`}>
                  <CenterNode 
                    centerLabel={centerLabel} 
                    circleRadius={centerRadius} 
                    onMiddleClick={onMiddleClick} 
                    placeholderMarkdown={placeholderMarkdown}
                    onDrop={handleCenterDrop}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onCenterClick={onCenterClick}
                  />
                </g>
             </g>
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------
// 5) ResponsiveRadialHeaderView (Wrapper)
// ---------------------------------------------------------------------
function ResponsiveRadialHeaderView({
  centerLabel,
  secondRingData = [],
  placeholderMarkdown,
  backgroundColor,
  onCenterClick,
  onMiddleClick,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // Init 0 to prevent initial mis-centering
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update if dimensions actually changed significantly to avoid loop
        if (rect.width > 0 && rect.height > 0) {
           setDimensions((prev) => {
               if(Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1) return prev;
               return { width: rect.width, height: rect.height };
           });
        }
      }
    }
    
    // Initial check
    updateDimensions();

    const observer = new ResizeObserver(() => {
        // Debounce slightly or just raw update? Raw is usually fine for canvas/svg unless heavy.
        requestAnimationFrame(updateDimensions);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    function handleFocus() {
      setRefreshKey((prev) => prev + 1);
    }
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <RadialHeaderView
        key={refreshKey}
        centerLabel={centerLabel}
        secondRingData={secondRingData}
        placeholderMarkdown={placeholderMarkdown}
        backgroundColor={backgroundColor}
        onCenterClick={onCenterClick}
        onMiddleClick={onMiddleClick}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// 6) AutoRadialNamzuView (Parent) – file query + navigation
// ---------------------------------------------------------------------
// --- Recursive Breadcrumb Component ---
function RecursiveBreadcrumb({ path, currentCenter, setCurrentCenter, setCenterFuture, onNavigate, isRoot = false, visited = [] }) {
    return <RecursiveBreadcrumbLogic path={path} currentCenter={currentCenter} setCurrentCenter={setCurrentCenter} setCenterFuture={setCenterFuture} onNavigate={onNavigate} isRoot={isRoot} visited={visited} />;
}

function RecursiveBreadcrumbLogic({ path, currentCenter, setCurrentCenter, setCenterFuture, onNavigate, isRoot, visited }) {
    if (!path) return null;
    
    // Cycle Detection
    if (visited.includes(path)) return null; 
    const newVisited = [...visited, path];

    // clean label extraction (early)
    let rawLabel = path.split("/").pop();
    let label = (rawLabel || "Unknown")
                    .replace(".namzu.md","")
                    .replace(".namzu","")
                    .replace(".md","");
    if (label.startsWith("VAULT.")) label = label.replace("VAULT.", "");
    
    // ROOT GUARD: If we are at 888, STOP recursing up.
    if (label === "888") {
        return (
             <span style={{ display: 'contents' }}>
                <span 
                    style={{ 
                        cursor: "pointer", 
                        color: "var(--text-muted)", 
                        textDecoration: "underline",
                        fontWeight: isRoot ? "bold" : "normal"
                    }}
                    onClick={() => {
                         if (onNavigate) onNavigate("VAULT.888");
                         else {
                            setCurrentCenter("VAULT.888"); 
                            setCenterFuture([]); 
                         }
                    }}
                    title={`Go to 888`}
                >
                    888
                </span>
                <span style={{ opacity: 0.5 }}> / </span>
            </span>
        );
    }

    const queryPath = path.endsWith(".md") ? path : path + ".md";
    const isNamzu = path.endsWith(".namzu.md");
    const siblingPath = isNamzu ? path.replace(".namzu.md", ".md") : "";
    
    // Query Self (First)
    const fileData = dc.useQuery(`@page and contains($path, "${path}")`);
    const siblingData = isNamzu ? dc.useQuery(`@page and contains($path, "${siblingPath}")`) : [];
    
    // Helper to find best match
    const getBestMatch = (candidates, targetPath) => {
        if (!candidates || candidates.length === 0) return null;
        const exact = candidates.find(f => f.$path === targetPath);
        if (exact) return exact;
        const nameMatch = candidates.find(f => f.name === targetPath || f.name === targetPath.split('/').pop());
        if (nameMatch) return nameMatch;
        const filtered = candidates.filter(f => !f.$path.includes("/_resources/") && !f.$path.includes("/example/"));
        if (filtered.length > 0) return filtered[0];
        return candidates[0];
    };

    const file = getBestMatch(fileData, path);
    const sibling = getBestMatch(siblingData, siblingPath);
    
    // Query INBOUND Parents (Who links to ME?)
    const targetPath = file ? file.$path : "";
    const targetSiblingPath = sibling ? sibling.$path : "";
    
    // Query all pages and perform safe JS filtering to bypass Datacore outlinks mapping bug
    const allPages = dc.useQuery("@page");
    
    const inboundParents = useMemo(() => {
        if (!allPages || (!targetPath && !targetSiblingPath)) return [];
        return allPages.filter(p => {
            if (!p.file || !p.file.outlinks) return false;
            return p.file.outlinks.some(link => {
                if (!link) return false;
                const linkPath = typeof link === 'string' ? link : (link.path || link.display || "");
                return linkPath === targetPath || linkPath === targetSiblingPath;
            });
        });
    }, [allPages, targetPath, targetSiblingPath]);

    // Filter Inbound Candidates
    const bestInboundParent = inboundParents ? inboundParents.find(p => 
        !p.$path.includes("_resources") && 
        !p.$path.includes(path) && // Don't link to self
        !visited.includes(p.$path) // Don't loop back to visited
    ) : null;

    const [resolvedParentPath, setResolvedParentPath] = useState(null);
    const [isResolving, setIsResolving] = useState(true);

    // DEBUG LOGGING - REMOVED

    useEffect(() => {
        
        // Priority 1: Inbound Link (Hierarchy)
        if (bestInboundParent) {
            setResolvedParentPath(bestInboundParent.$path);
            setIsResolving(false);
            return;
        }

        if (!file && !sibling) {
            setIsResolving(false);
            return;
        }

        let parentPath = null;
        const checkFM = (f) => {
            if (!f || !f.$frontmatter) return null;
            const fm = f.$frontmatter;
            if (fm.parent) {
                if (fm.parent.value && fm.parent.value.path) return fm.parent.value.path;
                if (fm.parent.path) return fm.parent.path;
                if (typeof fm.parent === 'string') {
                    const match = fm.parent.match(/\[\[(.*?)\]\]/);
                    return match ? match[1] : fm.parent;
                }
            }
            return null;
        };
        
        // Priority 2: Frontmatter (File)
        parentPath = checkFM(file) || checkFM(sibling);

        // Priority 3: Content Parsing (NAVIGATE - BACK)
        const findParentInContent = async (targetFile) => {
             if (!app || !targetFile) return null;
             try {
                 const abstractFile = app.vault.getAbstractFileByPath(targetFile.$path);
                 if (abstractFile) {
                     const content = await app.vault.read(abstractFile);
                     // Regex for "###### NAVIGATE - BACK : [[Target]]"
                     const match = content.match(/NAVIGATE\s?-\s?BACK\s?:\s?\[\[(.*?)\]\]/i);
                     if (match && match[1]) return match[1].split('|')[0];
                 }
             } catch (e) { console.error("Error reading breadcrumb content", e); }
             return null;
        };

        if (parentPath) {
             if (!parentPath.endsWith(".md") && !parentPath.endsWith(".namzu")) parentPath += ".md";
             setResolvedParentPath(parentPath);
             setIsResolving(false);
        } else {
             // Async check
             (async () => {
                 let p = await findParentInContent(file);
                 if (!p && sibling) p = await findParentInContent(sibling);
                 
                 if (p) {
                     if (!p.endsWith(".md") && !p.endsWith(".namzu")) p += ".md";
                     setResolvedParentPath(p);
                 } else if (bestInboundParent) {
                     // Priority 3: Inbound Link (discovery) - LAST RESORT
                     setResolvedParentPath(bestInboundParent.$path);
                 }
                 setIsResolving(false);
             })();
        }
        
    }, [file, sibling, bestInboundParent]);

    // Circular guard (Immediate)
    if (resolvedParentPath === path) setResolvedParentPath(null);

    // Robust target: preserve extension to keep navigation context consistent
    const target = rawLabel.includes(".namzu") ? label + ".namzu" : label;

    return (
        <>
            {/* Render Parent First (Head Recursion) */}
            {!isResolving && resolvedParentPath && !visited.includes(resolvedParentPath) && (
                <RecursiveBreadcrumb 
                    path={resolvedParentPath} 
                    currentCenter={currentCenter} 
                    setCurrentCenter={setCurrentCenter} 
                    setCenterFuture={setCenterFuture}
                    onNavigate={onNavigate}
                    visited={newVisited}
                />
            )}
            
            {/* Render Self */}
            <span style={{ display: 'contents' }}>
                <span 
                    style={{ 
                        cursor: "pointer", 
                        color: "var(--text-muted)", 
                        textDecoration: "underline",
                        fontWeight: isRoot ? "bold" : "normal"
                    }}
                    onClick={() => {
                         if (onNavigate) onNavigate(target);
                         else {
                            setCurrentCenter(target); 
                            setCenterFuture([]); 
                         }
                    }}
                    title={`Go to ${target}`}
                >
                    {label}
                </span>
                <span style={{ opacity: 0.5 }}> / </span>
            </span>
        </>
    );
}

function AutoRadialNamzuView({ centerLabel = centerHeader, ignoreFirstHeader = true, onFileSelect, showViewButton = true, spawnType = "fullTab", app }) {

  
  // Parse spawnType for full-tab mode
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  // --- Persistence Logic ---
  // Generate a unique key for this view instance based on file path
  // If no file path (embedded query?), use a generic key.
  const storageKey = `contentExplorer_state_${app.workspace.getActiveFile()?.path || "generic"}`;

  // Initialize state from storage if available
  const [currentCenter, setCurrentCenter] = useState(() => {
      try {
          const saved = sessionStorage.getItem(storageKey);
          if (saved) {
              const parsed = JSON.parse(saved);
              // Only restore if valid
              if (parsed.currentCenter) return parsed.currentCenter;
          }
      } catch (e) {
          console.error("Error loading saved state:", e);
      }
      return centerLabel;
  });

  const [centerHistory, setCenterHistory] = useState(() => {
     try {
          const saved = sessionStorage.getItem(storageKey);
          if (saved) {
              const parsed = JSON.parse(saved);
              return parsed.centerHistory || [];
          }
      } catch (e) {}
      return [];
  });
  
  const [centerFuture, setCenterFuture] = useState(() => {
      try {
          const saved = sessionStorage.getItem(storageKey);
          if (saved) {
              const parsed = JSON.parse(saved);
              return parsed.centerFuture || [];
          }
      } catch (e) {}
      return [];
  });

  // Save state on change
  useEffect(() => {
      const state = {
          currentCenter,
          centerHistory,
          centerFuture
      };
      sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [currentCenter, centerHistory, centerFuture, storageKey]);

  
  // Full-tab DOM manipulation effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    // 1. Locate nearest leaf content wrapper
    const leaf = container.closest('.workspace-leaf-content');
    if (!leaf) return;
    
    // 2. Select the view-content container below the header
    const contentWrapper = leaf.querySelector(':scope > .view-content') || leaf;
    const currentParent = container.parentNode;
    if (!currentParent) return;
    
    // 3. Setup placeholder in standard DOM layout
    stateRefs.originalParent = currentParent;
    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    if (container.nextSibling) {
      currentParent.insertBefore(placeholder, container.nextSibling);
    } else {
      currentParent.appendChild(placeholder);
    }
    stateRefs.placeholder = placeholder;
    
    // 4. Inject impeccable status bar suppression stylesheet
    const styleId = `impeccable-status-bounty`;
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
    
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      originalInlinePosition: contentWrapper.style.position,
    };
    
    if (window.getComputedStyle(contentWrapper).position === 'static') {
      contentWrapper.style.position = "relative";
    }
    
    // 5. Append component to view-content
    contentWrapper.appendChild(container);
    
    requestAnimationFrame(() => {
      Object.assign(contentWrapper.style, {
        padding: "0",
        margin: "0",
        height: "100%",
        width: "100%",
        display: "block",
        overflow: "hidden"
      });
    });
    
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "hidden",
      backgroundColor: "var(--background-primary)",
    });
    
    // 6. Graceful cleanup on unmount
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      } else if (stateRefs.originalParent) {
        stateRefs.originalParent.appendChild(container);
      }
      
      const el = document.getElementById(styleId);
      if (el) el.remove();
      
      if (stateRefs.parentPositionInfo?.element) {
        const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
        element.style.position = originalInlinePosition || '';
        element.style.padding = '';
        element.style.margin = '';
        element.style.height = '';
        element.style.width = '';
        element.style.overflow = '';
      }
      
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  const queryString = useMemo(
    () => `@page and contains($path, "${currentCenter}.md")`,
    [currentCenter]
  );
  const data = dc.useQuery(queryString);
  const file = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // Smart Lookup Priority: Prefer non-resource files
    const preferred = data.filter(f => {
        const path = f.$path.toLowerCase();
        return !path.includes("/_resources/") && !path.includes("/example/");
    });

    if (preferred.length > 0) {
        // console.log(`[AutoRadialNamzuView] Selected Main: ${preferred[0].name} (Preferred) -> ${preferred[0].$path}`);
        return preferred[0];
    }
    
    // console.log(`[AutoRadialNamzuView] Selected Main: ${data[0].name} (Fallback) -> ${data[0].$path}`);
    return data[0];
  }, [data]);

  // Navigation handlers
  function handleCenterClick(newCenter) {
    if (newCenter !== currentCenter) {
      setCenterHistory((prev) => [...prev, currentCenter]);
      setCenterFuture([]); // Clear future on new branch
      setCurrentCenter(newCenter);
    }
  }
  function handleBack() {
    if (centerHistory.length > 0) {
      const newHistory = [...centerHistory];
      const previousCenter = newHistory.pop();
      setCenterFuture(prev => [...prev, currentCenter]); // Save to future
      setCenterHistory(newHistory);
      setCurrentCenter(previousCenter);
    }
  }
  function handleForward() {
    if (centerFuture.length > 0) {
      const newFuture = [...centerFuture];
      const nextCenter = newFuture.pop();
      setCenterHistory(prev => [...prev, currentCenter]); // Save to history
      setCenterFuture(newFuture);
      setCurrentCenter(nextCenter);
    }
  }

  // --- Consolidated State & Logic (To prevent ReferenceErrors/TDZ) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const [tempCategories, setTempCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // 1. ring2 logic (Must be after state definitions)
  const ring2Raw = useMemo(() => getDesiredHeaders(file, ignoreFirstHeader), [file, ignoreFirstHeader]);
  useEffect(() => {
    if (tempCategories.length === 0) return;
    const itemsInFile = tempCategories.filter(temp => ring2Raw.includes(temp));
    if (itemsInFile.length > 0) {
        setTempCategories(prev => prev.filter(c => !itemsInFile.includes(c)));
    }
  }, [ring2Raw, tempCategories]);

  const combinedRing2 = useMemo(() => {
      const set = new Set(ring2Raw);
      tempCategories.forEach(c => set.add(c));
      return Array.from(set);
  }, [ring2Raw, tempCategories]);

  const ring2Unique = combinedRing2.filter(c => !hiddenCategories.includes(c));

  // 2. Focus Snap-Back (Return focus to container when modals close)
  useEffect(() => {
    const anyModalOpen = isModalOpen || isDeleteModalOpen || isEntryModalOpen || isSearchModalOpen || isLegendModalOpen;
    if (!anyModalOpen) {
      // Small delay to ensure the modal DOM is gone and focus can be grabbed
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.focus({ preventScroll: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, isDeleteModalOpen, isEntryModalOpen, isSearchModalOpen, isLegendModalOpen]);
  function handleMiddleClick() {
    handleBack();
  }
  function handleHomeClick() {
    setCenterHistory([]);
    setCenterFuture([]);
    setCurrentCenter(centerLabel);
  }
  function convertNameToEnigmas(name) {
    return name.replace(/\.namzu$/, ".enigmas");
  }
  function handleTiktokFeedClick() {
    if (onFileSelect) {
      onFileSelect(convertNameToEnigmas(currentCenter));
    }
  }

  // --- Add Category Logic ---


  // Focus input when modal opens
  const inputRef = useRef(null);
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
        // Small timeout to ensure render
        setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isModalOpen]);

  async function executeAddCategory(categoryName) {
      if (!app) {
          new Notice("Error: App not available.");
          return;
      }
      
      const cleanName = categoryName.trim().toUpperCase();
      const permalink = cleanName.toLowerCase();
      if (!cleanName) return;

      // Optimistic UI update
      // 1. Remove from hiddenCategories if it was there (Re-add scenario)
      if (hiddenCategories.includes(cleanName)) {
          // console.log("Re-adding previously deleted category:", cleanName);
          setHiddenCategories(prev => prev.filter(c => c !== cleanName));
      }
      // 2. Add to tempCategories
      if (!tempCategories.includes(cleanName)) {
        console.log("Optimistically adding to tempCategories:", cleanName);
        setTempCategories(prev => [...prev, cleanName]);
      }

      const currentFile = file; // already resolved from query
      if (!currentFile) {
          new Notice("Error: Could not find current file to update.");
          return;
      }

      // 1. Update Parent File
      try {
          const fileObj = app.vault.getAbstractFileByPath(currentFile.$path);
          if (fileObj) {
              // Read current content
              let content = await app.vault.read(fileObj);
              
              // Prepare new block
              const newBlock = `\n###### [[${cleanName}]]\n`;
              
              // Check if already exists to avoid duplicates
              if (!content.includes(`[[${cleanName}]]`)) {
                  content += newBlock;
                  await app.vault.modify(fileObj, content);
                  new Notice(`Linked "${cleanName}" to parent.`);
              } else {
                  console.log("Link already exists in parent.");
              }
          } else {
              new Notice("Error: File object not found.");
              return;
          }
      } catch (e) {
          console.error(e);
          new Notice("Error updating parent file.");
          return;
      }

      // 2. Create Main Note File ([Category].md)
      const dirPath = currentFile.$path.substring(0, currentFile.$path.lastIndexOf("/"));
      const mainFileName = `${cleanName}.md`;
      const mainContent = `---
permalink: "${permalink}"
---

###### NAVIGATE - BACK : [[${currentCenter.replace(".namzu", "")}]]
-----

>[!example]- [[${cleanName}.namzu]]
>![[${cleanName}.namzu#CATEGORIAE]]

----

>[!example]- [[${cleanName}.sud]]
>![[${cleanName}.sud]]

---
>[!danger]- *[[${cleanName}.enigmas.]]*
-----
`;
      try {
          const existing = app.vault.getAbstractFileByPath(`${dirPath}/${mainFileName}`);
          if (!existing) {
             await app.vault.create(`${dirPath}/${mainFileName}`, mainContent);
             console.log("Created main note:", mainFileName);
          } else {
             console.log("Main note already exists:", mainFileName);
          }
      } catch (e) {
          console.error("Error creating main note:", e);
          new Notice("Error creating main note.");
      }

      // 3. Create SUD File ([Category].sud.md)
      const sudFileName = `${cleanName}.sud.md`;
      const sudContent = `---
permalink: "${permalink}.sud"
---

###### NAVIGATE - BACK : [[${cleanName}]]
----
#### SUD
`;
      try {
          const existing = app.vault.getAbstractFileByPath(`${dirPath}/${sudFileName}`);
          if (!existing) {
             await app.vault.create(`${dirPath}/${sudFileName}`, sudContent);
             console.log("Created SUD file:", sudFileName);
          } else {
             console.log("SUD file already exists:", sudFileName);
          }
      } catch (e) {
          console.error("Error creating SUD file:", e);
      }

      // 4. Create New Namzu File
      const namzuFileName = `${cleanName}.namzu.md`;
      const namzuContent = `---
permalink: "${permalink}.namzu"
---

###### NAVIGATE - BACK : [[${currentCenter.replace(".namzu", "")}]]
-----
#### CATEGORIAE
`;
      try {
          const existing = app.vault.getAbstractFileByPath(`${dirPath}/${namzuFileName}`);
          if (!existing) {
             await app.vault.create(`${dirPath}/${namzuFileName}`, namzuContent);
              console.log("Created namzu file:", namzuFileName);
          } else {
             // File exists
          }
      } catch (e) {
          console.error(e);
          new Notice("Error creating namzu file.");
      }

      // 5. Create New Enigmas File
      const enigmasFileName = `${cleanName}.enigmas..md`;
      const enigmasContent = `---
permalink: "${permalink}.enigmas."
---

###### NAVIGATE - BACK : [[${cleanName}]]
----
>[!info]- [[${cleanName}.enigmas.]]
----
#### AENIGMAS
`;
      try {
          const existing = app.vault.getAbstractFileByPath(`${dirPath}/${enigmasFileName}`);
          if (!existing) {
             await app.vault.create(`${dirPath}/${enigmasFileName}`, enigmasContent);
             new Notice(`Category "${cleanName}" created successfully!`);
             console.log("Created enigmas file:", enigmasFileName);
          } else {
             new Notice(`File ${enigmasFileName} already exists.`);
             console.log("Enigmas file already exists:", enigmasFileName);
          }
      } catch (e) {
          console.error("Error creating enigmas file:", e);
           new Notice("Error creating enigmas file.");
      }
  }

  // --- Delete Category Logic ---



  // --- Recursive Deletion Logic ---
  async function scanSubcategories(categoryName, visited = new Set()) {
      if (!categoryName || visited.has(categoryName)) return visited;
      visited.add(categoryName);

      const cleanName = categoryName.trim().toUpperCase();
      // Look for .namzu file first, as it defines the "children" structure
      // Current directory approach:
      if (!file) return visited;
      const dirPath = file.$path.substring(0, file.$path.lastIndexOf("/"));
      
      // Try finding the namzu file for this category
      const probableNamzuPath = `${dirPath}/${cleanName}.namzu.md`;
      const namzuFile = app.vault.getAbstractFileByPath(probableNamzuPath);
      
      if (namzuFile) {
          try {
              const content = await app.vault.read(namzuFile);
              // Regex to find links like ###### [[CHILD]]
              const linkRegex = /###### \[\[(.*?)\]\]/g;
              let match;
              while ((match = linkRegex.exec(content)) !== null) {
                  const childName = match[1].trim().toUpperCase();
                  if (childName && !visited.has(childName)) {
                      await scanSubcategories(childName, visited);
                  }
              }
          } catch (e) {
              console.error(`Error scanning ${cleanName}:`, e);
          }
      }
      return visited;
  }

  async function handleRecursiveDelete(categoryName) {
      if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return;

      const subcategories = await scanSubcategories(categoryName);
      // Remove self from count to show subcategory count
      const childrenCount = subcategories.size - 1; 

      if (childrenCount > 0) {
          const childrenList = Array.from(subcategories).filter(c => c !== categoryName).join(", ");
          if (!confirm(`Warning: "${categoryName}" has ${childrenCount} subcategories:\n${childrenList}\n\nDo you want to delete ALL of them too?`)) {
              return; // Cancel entire operation if they say no to recursive delete? 
              // Or maybe just delete the parent? User asked for confirm "before it deletes".
              // Assuming "Cancel" means "Stop".
          }
      }

      // Proceed with deletion of all found categories
      for (const cat of subcategories) {
          await executeDeleteCategory(cat);
      }
      setIsDeleteModalOpen(false);
  }

  async function executeDeleteCategory(categoryName) {
      // ... (keep existing logic, but maybe remove the setIsDeleteModalOpen(false) at the end 
      // if it disturbs the loop, or handle it carefully. 
      // Actually, executeDeleteCategory is atomic. handleRecursiveDelete manages the loop/modal.)
      if (!app) {
          new Notice("Error: App not available.");
          return;
      }
      
      const cleanName = categoryName.trim().toUpperCase();
      if (!cleanName) return;

      // Optimistic UI update: Hide immediately
      setHiddenCategories(prev => [...prev, cleanName]);
      
      // Also remove from temp if it was a temp category
      if (tempCategories.includes(cleanName)) {
        setTempCategories(prev => prev.filter(c => c !== cleanName));
      }

      // Needs 'file' (current parent) context to unlink from parent
      // Note: In recursive delete, 'file' is the CURRENT view (Grandparent).
      // If we delete Child -> Grandchild, Child is linked in Grandparent. Grandchild is linked in Child.
      // Unlinking Grandchild from Child (which is being deleted) is redundant but harmless.
      // Unlinking Child from Grandparent IS necessary.
      // So calling executeDeleteCategory on all of them is fine, 
      // as long as they try to unlink from 'file' (Grandparent).
      // Wait, Grandchild is NOT linked in Grandparent ('file').
      // So unlinking attempt for Grandchild on 'file' will do nothing (regex won't match), which is fine.
      
      // However, we still want to delete the FILES.
      const currentFile = file; // Might be null if we are in empty state, but we check earlier.
      // If recursion happens deep down, we just want to ensure FILES are gone.

      let targetDirPath = "";
       if (currentFile) {
          targetDirPath = currentFile.$path.substring(0, currentFile.$path.lastIndexOf("/"));
       } else {
           // If no current file, try to guess path from 888? 
           // For now assume we are in a valid view.
           return; 
       }

      try {
          // 1. Unlink from Parent File (Only if this category is directly in the parent)
          // We try to unlink *every* category from the current view file.
          // This correctly handles the direct child. Subchildren won't be found, so no change.
          const fileObj = app.vault.getAbstractFileByPath(currentFile.$path);
          if (fileObj) {
              let content = await app.vault.read(fileObj);
              
              // Robust pattern to remove link with optional alias and whitespace
              const simplePattern = new RegExp(`\\n*###### \\s*\\[\\[${cleanName}(?:\\|.*?)?\\]\\]\\s*\\n*`, "g");
              let newContent = content.replace(simplePattern, "\n");
              
              if (newContent !== content) {
                  await app.vault.modify(fileObj, newContent);
                  // Unlink success (silent)
              }
          }

          // 2. Delete the actual files
          const mainPath = `${targetDirPath}/${cleanName}.md`;
          const sudPath = `${targetDirPath}/${cleanName}.sud.md`;
          const namzuPath = `${targetDirPath}/${cleanName}.namzu.md`;
          const enigmasPath = `${targetDirPath}/${cleanName}.enigmas..md`;

          const mainFile = app.vault.getAbstractFileByPath(mainPath);
          if (mainFile) await app.vault.delete(mainFile);

          const sudFile = app.vault.getAbstractFileByPath(sudPath);
          if (sudFile) await app.vault.delete(sudFile);

          const namzuFile = app.vault.getAbstractFileByPath(namzuPath);
          if (namzuFile) await app.vault.delete(namzuFile);

          const enigmasFile = app.vault.getAbstractFileByPath(enigmasPath);
          if (enigmasFile) await app.vault.delete(enigmasFile);
          
          new Notice(`Category "${cleanName}" deleted.`);

      } catch (e) {
          console.error(e);
          new Notice("Error deleting category.");
      }
  }

  // --- Format Category Logic (Fallback) ---
  async function executeFormatCategory() {
      if (!app) {
          new Notice("Error: App not available.");
          return;
      }
      
      const cleanName = currentCenter.replace(".namzu", "").toUpperCase();
      const permalink = cleanName.toLowerCase();
      if (!cleanName) return;

      // Determine Parent and Directory
      let parentName = "888.namzu"; // Default
      if (centerHistory.length > 0) {
          parentName = centerHistory[centerHistory.length - 1];
      }
      
      // Find directory by looking for parent file or 888.namzu in vault
      // Since we don't have 'file' (current is missing), we scan for anchor.
      let dirPath = "";
      const allFiles = app.vault.getFiles();
      const anchorFile = allFiles.find(f => f.name === `${parentName}.md`) || 
                         allFiles.find(f => f.name === "888.namzu.md");
      
      if (anchorFile) {
          dirPath = anchorFile.parent.path;
      } else {
          new Notice("Error: Could not determine directory. (Anchor 888.namzu not found)");
          return;
      }

      // 1. Repair Main Note ([Category].md)
      const mainFileName = `${cleanName}.md`;
      const mainContent = `---
permalink: "${permalink}"
---

###### NAVIGATE - BACK : [[${parentName.replace('.namzu', '')}]]
-----

>[!example]- [[${cleanName}.namzu]]
>![[${cleanName}.namzu#CATEGORIAE]]

----

>[!example]- [[${cleanName}.sud]]
>![[${cleanName}.sud]]

---
>[!danger]- *[[${cleanName}.enigmas.]]*
-----
`;
      try {
          const mainFile = app.vault.getAbstractFileByPath(`${dirPath}/${mainFileName}`);
          if (!mainFile) {
             await app.vault.create(`${dirPath}/${mainFileName}`, mainContent);
             console.log("Created main note:", mainFileName);
          } else {
             // For main note, we might be careful about ignoring overwrite or suggesting it? 
             // "Format" implies "Fix Structure". Let's overwrite safely or skip?
             // User explicitly wants to fix the templates. Let's overwrite.
             await app.vault.modify(mainFile, mainContent);
             new Notice(`Repaired ${mainFileName}`);
          }
      } catch (e) {
          console.error(e);
      }

      // 2. Repair SUD File ([Category].sud.md)
      const sudFileName = `${cleanName}.sud.md`;
      const sudContent = `---
permalink: "${permalink}.sud"
---

###### NAVIGATE - BACK : [[${cleanName}]]
----
#### SUD
`;
      try {
          const sudFile = app.vault.getAbstractFileByPath(`${dirPath}/${sudFileName}`);
          if (!sudFile) {
             await app.vault.create(`${dirPath}/${sudFileName}`, sudContent);
             console.log("Created SUD file:", sudFileName);
          } else {
             await app.vault.modify(sudFile, sudContent);
             new Notice(`Repaired ${sudFileName}`);
          }
      } catch (e) {
          console.error(e);
      }

      // 3. Repair .namzu File
      const namzuFileName = `${cleanName}.namzu.md`;
      const namzuContent = `---
permalink: "${permalink}.namzu"
---

###### NAVIGATE - BACK : [[${parentName.replace('.namzu', '')}]]
-----
#### CATEGORIAE
`;
      try {
          const namzuFile = app.vault.getAbstractFileByPath(`${dirPath}/${namzuFileName}`);
          if (!namzuFile) {
             await app.vault.create(`${dirPath}/${namzuFileName}`, namzuContent);
             new Notice(`Created ${namzuFileName}`);
          } else {
             await app.vault.modify(namzuFile, namzuContent);
             new Notice(`Repaired ${namzuFileName}`);
          }
      } catch (e) {
          console.error(e);
          new Notice("Error repairing namzu file.");
      }

      // 4. Repair .enigmas File
      const enigmasFileName = `${cleanName}.enigmas..md`;
      const enigmasContent = `---
permalink: "${permalink}.enigmas."
---

###### NAVIGATE - BACK : [[${cleanName}]]
----
>[!info]- [[ENIGMAS]]
----
#### AENIGMAS
`;
      try {
          const enigmasFile = app.vault.getAbstractFileByPath(`${dirPath}/${enigmasFileName}`);
          if (!enigmasFile) {
             await app.vault.create(`${dirPath}/${enigmasFileName}`, enigmasContent);
             new Notice(`Created ${enigmasFileName}`);
          } else {
             await app.vault.modify(enigmasFile, enigmasContent);
             new Notice(`Repaired ${enigmasFileName}`);
          }
      } catch (e) {
          console.error(e);
          new Notice("Error repairing enigmas file.");
      }
  }

  // --- Quick Entry Logic ---

  const entryInputRef = useRef(null);

  useEffect(() => {
      if (isEntryModalOpen && entryInputRef.current) {
          entryInputRef.current.focus();
      }
  }, [isEntryModalOpen]);

  async function executeAddEntry(entryText) {
      if (!app || !entryText.trim()) return;
      
      const cleanName = currentCenter.replace(".namzu", "").toUpperCase();
      if (!cleanName) return;

      // Locate directory
      let dirPath = "";
      if (file) {
          dirPath = file.$path.substring(0, file.$path.lastIndexOf("/"));
      } else {
        // Fallback or error? If we are adding an entry, we should be IN a category context.
        const parentName = centerHistory.length > 0 ? centerHistory[centerHistory.length - 1] : "888.namzu";
        const allFiles = app.vault.getFiles();
        const anchorFile = allFiles.find(f => f.name === `${parentName}.md`);
        if (anchorFile) dirPath = anchorFile.parent.path;
      }

      if (!dirPath) {
          new Notice("Error: Could not locate category directory.");
          return;
      }

      const enigmasPath = `${dirPath}/${cleanName}.enigmas..md`;
      const enigmasFile = app.vault.getAbstractFileByPath(enigmasPath);

      if (!enigmasFile) {
          new Notice(`Error: ${cleanName}.enigmas..md not found. Format category first?`);
          return;
      }

      try {
          const content = await app.vault.read(enigmasFile);
          const header = "#### AENIGMAS";
          
          if (content.includes(header)) {
              // Insert at top of entries (immediately after header)
              const formattedEntry = `\n\n${entryText.trim()}\n\n----\n`;
              // We use replace to insert after the first occurrence of the header
              const newContent = content.replace(header, `${header}${formattedEntry}`);
              
              await app.vault.modify(enigmasFile, newContent);
              new Notice("Entry added successfully!");
              setIsEntryModalOpen(false);
              setNewEntryContent("");
          } else {
              new Notice("Error: '#### AENIGMAS' header not found in file.");
          }
      } catch (e) {
          console.error("Error adding entry:", e);
          new Notice("Error writing entry.");
      }
  }

  // --- Open Note Logic ---
  function handleOpenNote() {
      // ... (existing logic)
      if (!app || !file) {
          new Notice("No file to open.");
          return;
      }
      
      const currentPath = file.$path;
      
      // Priority 1: Main Note (.namzu.md -> .md)
      const mainPath = currentPath.replace(".namzu.md", ".md");
      const mainFile = app.vault.getAbstractFileByPath(mainPath);
      
      if (mainFile) {
          app.workspace.getLeaf(true).openFile(mainFile);
          return;
      }

      // Priority 2: Enigmas (.namzu.md -> .enigmas..md)
      // Note: User uses ..md now
      const enigmasPath = currentPath.replace(".namzu.md", ".enigmas..md");
      const enigmasFile = app.vault.getAbstractFileByPath(enigmasPath);
      
      if (enigmasFile) {
          app.workspace.getLeaf(true).openFile(enigmasFile);
          return;
      }
      
      // Fallback: Open current file
      if (currentObj) {
          new Notice("Opening current file (Main/Enigmas not found).");
          app.workspace.getLeaf(true).openFile(currentObj);
      }
  }

  function handleEditOptionClick(type) {
      setIsEditModalOpen(false);
      
      // Robust search for the target file
      let targetFile = null;
      const targetName = (typeof currentCenter === 'string' ? currentCenter : "").toLowerCase();
      
      // 1. Try to use the current focused file if it matches
      if (file && file.name.toLowerCase().startsWith(targetName)) {
          const parentDir = file.parent ? file.parent.path : "";
          let cleanName = file.name;
          // Strip known extensions to get base
          if (cleanName.endsWith('.namzu.md')) cleanName = cleanName.substring(0, cleanName.length - 9);
          else if (cleanName.endsWith('.enigmas..md')) cleanName = cleanName.substring(0, cleanName.length - 12);
          else if (cleanName.endsWith('.sud.md')) cleanName = cleanName.substring(0, cleanName.length - 7);
          else if (cleanName.endsWith('.md')) cleanName = cleanName.substring(0, cleanName.length - 3);

          // Confirm base matches target (handling prefixes/suffixes issues)
          if (cleanName.toLowerCase() === targetName) {
               let extension = ".md";
               if (type === 'namzu') extension = ".namzu.md";
               else if (type === 'enigmas') extension = ".enigmas..md";
               
               targetFile = app.vault.getAbstractFileByPath(`${parentDir}/${cleanName}${extension}`);
          }
      }

      // 2. Fallback: Scan vault if not found or context mismatch
      if (!targetFile) {
           const files = app.vault.getFiles();
           let searchExt = ".md";
           if (type === 'namzu') searchExt = ".namzu.md";
           else if (type === 'enigmas') searchExt = ".enigmas..md";

           targetFile = files.find(f => f.name.toLowerCase() === `${targetName}${searchExt}`);
      }

      if (targetFile) {
          // Open the file
          const leaf = app.workspace.getLeaf(true);
          leaf.openFile(targetFile);
      } else {
          new Notice(`File for ${currentCenter} (${type}) not found.`);
      }
  }

  // --- Search Logic ---

  const searchInputRef = useRef(null);
  
  // Auto-focus search input
  useEffect(() => {
      if (isSearchModalOpen && searchInputRef.current) {
          searchInputRef.current.focus();
          // Reset
          setSearchQuery("");
          setSearchResults([]);
          // Initial load of all categories? Or wait for input?
          // Let's load all initially for quick browsing
          handleSearch(""); 
      }
  }, [isSearchModalOpen]);

  function handleSearch(query) {
      setSearchQuery(query);
      if (!app) return;
      
      const q = query.trim().toLowerCase();
      
      if (!q) {
          setSearchResults([]);
          return;
      }
      
      const allFiles = app.vault.getFiles();
      const validBases = new Set();
      
      // 1. Build Index of Valid Categories (Sidecar Filtering)
      // A valid category MUST have at least one of these system files:
      // - .namzu.md
      // - .enigmas..md
      // - .sud.md
      for (const f of allFiles) {
          // Skip Resources folder to avoid templates
          if (f.path.includes("_RESOURCES")) continue;

          let base = null;
          const n = f.name;

          if (n.endsWith(".namzu.md")) {
              base = n.substring(0, n.length - 9); 
          } else if (n.endsWith(".enigmas..md")) {
              base = n.substring(0, n.length - 12);
          } else if (n.endsWith(".sud.md")) {
              base = n.substring(0, n.length - 7);
          }

          if (base) {
              validBases.add(base);
          }
      }
      
      // 2. Filter & Sort
      const matches = Array.from(validBases)
          .filter(name => name.toLowerCase().includes(q))
          .sort()
          .slice(0, 50);
          
      setSearchResults(matches);
  }

  function handleSearchResultClick(catName) {
      if (!catName) return;
      // Navigate
      setCenterHistory(prev => [...prev, currentCenter]);
      setCenterFuture([]);
      setCurrentCenter(catName + ".namzu");
      setIsSearchModalOpen(false);
  }

  // --- Focus & Keyboard Shortcuts Logic ---

  
  const handleContainerFocus = () => {
    setIsFocused(true);
  };
  
  const handleContainerBlur = (e) => {
    // Check if focus is moving to an element inside the component
    const newFocusTarget = e?.relatedTarget;
    const focusStayingInside = containerRef.current && 
                               newFocusTarget && 
                               containerRef.current.contains(newFocusTarget);
    
    if (focusStayingInside) return;
    setIsFocused(false);
  };

  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e) => {
      // Escape key closes everything
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsEntryModalOpen(false);
        setIsSearchModalOpen(false);
        setIsLegendModalOpen(false);
        return;
      }

      // Ignore other shortcuts if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isMod = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        case '?':
        case '/':
          if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
             e.preventDefault();
             setIsLegendModalOpen(prev => !prev);
             return; // Stop here
          }
          // If just '/' (no shift), fall through to search logic
          if (e.key === '/') {
              e.preventDefault();
              setIsSearchModalOpen(true);
          }
          break;
        case 'v':
          e.preventDefault();
          handleTiktokFeedClick();
          break;
        case 'e':
          e.preventDefault();
          handleOpenNote();
          break;
        case 'n':
          e.preventDefault();
          if (file) setIsEntryModalOpen(true);
          break;
        case 'a':
          e.preventDefault();
          setIsModalOpen(true);
          break;
        case 'd':
          e.preventDefault();
          setIsDeleteModalOpen(true);
          break;
        case 'h':
          e.preventDefault();
          handleHomeClick();
          break;

        case '[':
          e.preventDefault();
          handleBack();
          break;
        case ']':
          e.preventDefault();
          handleForward();
          break;
        case 'f':
          if (isMod) {
            e.preventDefault();
            setIsSearchModalOpen(true);
          }
          break;
        case 'arrowleft':
          if (isMod || e.altKey) {
            e.preventDefault();
            handleBack();
          }
          break;
        case 'arrowright':
          if (isMod || e.altKey) {
            e.preventDefault();
            handleForward();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, file, currentCenter, centerHistory, centerFuture]);

  // --- Navigation Breadcrumb Sync ---
  const handleBreadcrumbNavigate = (target) => {
    // 1. Try to find the target in history to perform a "smart pop"
    const index = centerHistory.findIndex(h => {
        const hLabel = h.replace(".namzu", "").toLowerCase();
        const tLabel = target.replace(".namzu", "").toLowerCase();
        return hLabel === tLabel;
    });

    if (index !== -1) {
        // We found it in history, truncate history to that point
        const newHistory = centerHistory.slice(0, index);
        setCenterHistory(newHistory);
    } else {
        // Structural jump (not in recent history)
        // If jumping to root, clear history. 
        if (target.toLowerCase().includes("888")) {
            setCenterHistory([]);
        } else {
            // Optional: If we want to treat this as "going back" structurally, 
            // we should ideally find the hierarchy. For now, pushing to history
            // ensures we can at least go "back" to where we were.
            // But if the user clicks a breadcrumb, they usually expect to move UP.
            // So if it's NOT in history, let's just prepend it to a fresh start?
            // Actually, pushing current to history is safer.
            if (target !== currentCenter) {
                setCenterHistory(prev => [...prev, currentCenter]);
            }
        }
    }
    
    setCenterFuture([]); 
    setCurrentCenter(target);
  };

  // --- Control Buttons ---
  const controls = (
    <>
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "50px", zIndex: 10, display: "flex", gap: "6px", flexWrap: "wrap", alignItems: 'center', pointerEvents: 'none' }}>
        {/* Pointer events none on container, auto on buttons to allow clicking through to canvas if needed, though header usually consumes clicks. Actually, let's keep pointer-events auto for the bar but standard z-index. */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
            {/* Navigation Group - Icon Only */}
             <button
              style={{ 
                padding: "6px", 
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={handleHomeClick}
              title="Home"
            >
              <dc.Icon icon="home" style={{ fontSize: "16px" }} />
            </button>

             <button
              style={{ 
                padding: "6px", 
                borderRadius: "50%", 
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                transition: "all 0.2s",
                opacity: centerHistory.length > 0 ? 1 : 0.5,
                pointerEvents: centerHistory.length > 0 ? 'auto' : 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={handleBack}
              disabled={centerHistory.length === 0}
              title="Go Back"
            >
              <dc.Icon icon="arrow-left" style={{ fontSize: "16px" }} />
            </button>

            <button
              style={{ 
                padding: "6px", 
                borderRadius: "50%", 
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                transition: "all 0.2s",
                opacity: centerFuture.length > 0 ? 1 : 0.5,
                pointerEvents: centerFuture.length > 0 ? 'auto' : 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={handleForward}
              disabled={centerFuture.length === 0}
              title="Go Forward"
            >
              <dc.Icon icon="arrow-right" style={{ fontSize: "16px" }} />
            </button>
            <button
              style={{ 
                padding: "6px", 
                borderRadius: "50%",
                width: "32px",
                height: "32px", 
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={() => setIsLegendModalOpen(true)}
              title="Legend / Help"
            >
              <dc.Icon icon="info" style={{ fontSize: "16px" }} />
            </button>
        </div>

        <div style={{ width: "1px", height: "24px", background: "var(--background-modifier-border)", margin: "0 4px", pointerEvents: 'auto' }}></div>

        {/* Primary Actions - Pills */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
            {/* Search Button */}
            <button
              style={{ 
                padding: "6px 12px", 
                borderRadius: "16px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s",
                height: "32px"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={(e) => { e.stopPropagation(); setIsSearchModalOpen(true); }}
              title="Search Categories"
            >
              <dc.Icon icon="search" style={{ fontSize: "14px" }} />
              <span>Search</span>
            </button>

            {showViewButton && (
              <button
                style={{ 
                  padding: "6px 12px", 
                  borderRadius: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                   height: "32px"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                onClick={handleTiktokFeedClick}
              >
                <dc.Icon icon="eye" style={{ fontSize: "14px" }} />
                View
              </button>
            )}

            {/* Add Entry Button */}
            {file && (
                <button
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: "16px", 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--interactive-accent)",
                    border: "1px solid var(--interactive-accent)",
                    color: "var(--text-on-accent)",
                    fontWeight: "600",
                    fontSize: "13px",
                    transition: "all 0.2s",
                     height: "32px"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  onClick={() => setIsEntryModalOpen(true)}
                  title="Add Entry"
                >
                  <dc.Icon icon="file-plus" style={{ fontSize: "14px" }} />
                  <span>Entry</span>
                </button>
            )}

            <div style={{ position: 'relative' }}>
              <button
                style={{ 
                    padding: "6px 12px", 
                    borderRadius: "16px", 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--background-primary)",
                    border: "1px solid var(--background-modifier-border)",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                     height: "32px"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(!isEditModalOpen); }}
                title="Edit Options"
              >
                <dc.Icon icon="edit" style={{ fontSize: "14px" }} />
                <span>Edit</span>
                <dc.Icon icon="chevron-down" style={{ fontSize: "10px", marginLeft: "2px", opacity: 0.7 }} />
              </button>
              
              {isEditModalOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    background: 'var(--background-primary)',
                    border: '1px solid var(--background-modifier-border)',
                    borderRadius: '8px',
                    padding: '4px',
                    zIndex: 1000,
                    minWidth: '200px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    {(() => {
                       // Calculate availability using robust scan
                       let hasMain = false;
                       let hasNamzu = false;
                       let hasEnigmas = false;
                       
                       const targetName = (typeof currentCenter === 'string' ? currentCenter : "").toLowerCase();
    
                       // 1. Try efficient check if file matches context
                       if (file && file.name.toLowerCase().startsWith(targetName)) {
                            const parentDir = file.parent ? file.parent.path : "";
                            let cleanName = file.name;
                            if (cleanName.endsWith('.namzu.md')) cleanName = cleanName.substring(0, cleanName.length - 9);
                            else if (cleanName.endsWith('.enigmas..md')) cleanName = cleanName.substring(0, cleanName.length - 12);
                            else if (cleanName.endsWith('.md')) cleanName = cleanName.substring(0, cleanName.length - 3);
                            
                            // Strict check to ensure we are looking at the right family
                            if (cleanName.toLowerCase() === targetName) {
                                hasMain = !!app.vault.getAbstractFileByPath(`${parentDir}/${cleanName}.md`);
                                hasNamzu = !!app.vault.getAbstractFileByPath(`${parentDir}/${cleanName}.namzu.md`);
                                hasEnigmas = !!app.vault.getAbstractFileByPath(`${parentDir}/${cleanName}.enigmas..md`);
                            }
                       }
    
                       // 2. Global fallback scan
                       let didStep1 = file && file.name.toLowerCase().includes(targetName) && 
                                      ((file.name.toLowerCase() === targetName + ".md") || 
                                       (file.name.toLowerCase() === targetName + ".namzu.md") || 
                                       (file.name.toLowerCase() === targetName + ".enigmas..md"));
    
                       if (!didStep1 && (!hasMain || !hasNamzu || !hasEnigmas)) {
                            const files = app.vault.getFiles();
                            for (const f of files) {
                                const lower = f.name.toLowerCase();
                                if (!hasMain && lower === `${targetName}.md`) hasMain = true;
                                if (!hasNamzu && lower === `${targetName}.namzu.md`) hasNamzu = true;
                                if (!hasEnigmas && lower === `${targetName}.enigmas..md`) hasEnigmas = true;
                                if (hasMain && hasNamzu && hasEnigmas) break;
                            }
                       }

                       return (
                         <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(hasMain) handleEditOptionClick('main'); }}
                                style={{ 
                                    textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', 
                                    color: hasMain ? 'var(--text-normal)' : 'var(--text-muted)', 
                                    cursor: hasMain ? 'pointer' : 'default', 
                                    borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: hasMain ? 1 : 0.5,
                                    fontSize: '13px'
                                }}
                                onMouseEnter={(e) => hasMain && (e.target.style.background = 'var(--background-modifier-hover)')}
                                onMouseLeave={(e) => hasMain && (e.target.style.background = 'transparent')}
                            >
                                <dc.Icon icon="file" style={{ fontSize: "14px", opacity: 0.7 }} /> 
                                <span>Main Note</span>
                                {!hasMain && <span style={{fontSize: '10px', opacity: 0.5, marginLeft: 'auto'}}>Missing</span>}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(hasNamzu) handleEditOptionClick('namzu'); }}
                                style={{ 
                                    textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', 
                                    color: hasNamzu ? 'var(--text-normal)' : 'var(--text-muted)', 
                                    cursor: hasNamzu ? 'pointer' : 'default', 
                                    borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: hasNamzu ? 1 : 0.5,
                                    fontSize: '13px'
                                }}
                                onMouseEnter={(e) => hasNamzu && (e.target.style.background = 'var(--background-modifier-hover)')}
                                onMouseLeave={(e) => hasNamzu && (e.target.style.background = 'transparent')}
                            >
                                 <dc.Icon icon="code" style={{ fontSize: "14px", opacity: 0.7 }} /> 
                                 <span>Namzu</span>
                                 {!hasNamzu && <span style={{fontSize: '10px', opacity: 0.5, marginLeft: 'auto'}}>Missing</span>}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(hasEnigmas) handleEditOptionClick('enigmas'); }}
                                style={{ 
                                    textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', 
                                    color: hasEnigmas ? 'var(--text-normal)' : 'var(--text-muted)', 
                                    cursor: hasEnigmas ? 'pointer' : 'default', 
                                    borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: hasEnigmas ? 1 : 0.5,
                                    fontSize: '13px'
                                }}
                                onMouseEnter={(e) => hasEnigmas && (e.target.style.background = 'var(--background-modifier-hover)')}
                                onMouseLeave={(e) => hasEnigmas && (e.target.style.background = 'transparent')}
                            >
                                 <dc.Icon icon="database" style={{ fontSize: "14px", opacity: 0.7 }} /> 
                                 <span>Enigmas</span>
                                 {!hasEnigmas && <span style={{fontSize: '10px', opacity: 0.5, marginLeft: 'auto'}}>Missing</span>}
                            </button>
                         </>
                       );
                    })()}
                </div>
              )}
            </div>

            <button
              style={{ 
                padding: "6px 12px", 
                borderRadius: "16px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s",
                 height: "32px"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--interactive-accent)"; e.currentTarget.style.color = "var(--text-normal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onClick={() => setIsModalOpen(true)}
            >
              <dc.Icon icon="plus" style={{ fontSize: "14px" }} />
              <span>Add</span>
            </button>

            <button
              style={{ 
                padding: "6px", 
                borderRadius: "50%",
                width: "32px",
                height: "32px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--background-primary)",
                border: "1px solid var(--background-modifier-border)",
                color: "var(--text-error, #f87171)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f87171"; e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--background-modifier-border)"; e.currentTarget.style.background = "var(--background-primary)"; }}
              onClick={() => setIsDeleteModalOpen(true)}
              title="Delete"
            >
              <dc.Icon icon="trash" style={{ fontSize: "14px" }} />
            </button>
            
            {/* Format Button */}
            {!file && (
                <button
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: "16px", 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--interactive-accent)",
                    border: "1px solid var(--interactive-accent)",
                    color: "var(--text-on-accent)",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                     height: "32px"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onClick={executeFormatCategory}
                >
                  <dc.Icon icon="file-text" style={{ fontSize: "14px" }} />
                  <span>Format</span>
                </button>
            )}
        </div>
      </div>
      
      {/* Semantic Breadcrumbing (Recursive Frontmatter) */}
      <div style={{
          position: "absolute",
          top: "55px",
          left: "10px",
          right: "10px",
          zIndex: 9,
          display: "flex",
          gap: "6px",
          alignItems: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          background: "rgba(var(--background-primary-rgb), 0.7)",
          padding: "4px 8px",
          borderRadius: "12px",
          backdropFilter: "blur(4px)",
          flexWrap: "wrap",
          maxWidth: "100%"
      }}>
           <span 
                style={{ cursor: "pointer", opacity: 0.7 }} 
                onClick={() => handleBreadcrumbNavigate("888")}
                title="Go to 888"
           >
                <dc.Icon icon="home" style={{ fontSize: "12px" }} />
           </span>
           <span style={{ opacity: 0.3 }}>/</span>

           {file && (
               <RecursiveBreadcrumb 
                    path={file.$path} 
                    currentCenter={currentCenter}
                    setCurrentCenter={setCurrentCenter}
                    setCenterFuture={setCenterFuture}
                    onNavigate={handleBreadcrumbNavigate}
                    isRoot={true} 
               />
           )}
      </div>

      {showFullTabToggle && (
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
          <button
            style={{ 
              padding: "8px", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setIsFullTab(!isFullTab)}
            title={isFullTab ? "Exit full-tab mode" : "Enter full-tab mode"}
          >
            <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
          </button>
        </div>
      )}
      

      {/* Add Modal Overlay */}
      {isModalOpen && (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--background-primary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                minWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <h3 style={{ margin: 0 }}>Add New Category</h3>
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Category Name (e.g. MIND)" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            executeAddCategory(newCategoryName);
                            setNewCategoryName("");
                            setIsModalOpen(false);
                        }
                    }}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--background-modifier-border)'
                    }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button 
                        onClick={() => {
                            executeAddCategory(newCategoryName);
                            setNewCategoryName("");
                            setIsModalOpen(false);
                        }}
                        style={{ background: 'var(--interactive-accent)', color: 'white' }}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Modal Overlay */}
      {isDeleteModalOpen && (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--background-primary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                minWidth: '300px',
                maxWidth: '400px',
                maxHeight: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Unlink Category</h3>
                    <button onClick={() => setIsDeleteModalOpen(false)} style={{ border: 'none', background: 'transparent' }}>
                        <dc.Icon icon="x" />
                    </button>
                </div>
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ring2Unique.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>No categories found.</p>
                    ) : (
                        ring2Unique.map(cat => (
                            <div key={cat} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px',
                                border: '1px solid var(--background-modifier-border)',
                                borderRadius: '4px'
                            }}>
                                <span>{cat}</span>
                                <button 
                                    onClick={() => handleRecursiveDelete(cat)}
                                    style={{ 
                                        padding: '4px 8px', 
                                        fontSize: '12px',
                                        background: 'var(--text-error)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Unlink
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* Quick Entry Modal Overlay */}
      {isEntryModalOpen && (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--background-primary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                minWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <h3 style={{ margin: 0 }}>Add New Entry</h3>
                <textarea 
                    ref={entryInputRef}
                    placeholder="Enter text or URL..." 
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    onKeyDown={(e) => {
                        // Allow Shift+Enter for new line, plain Enter to submit?
                        // Or maybe just Ctrl+Enter to submit, plain Enter for newline.
                        if (e.key === 'Enter' && e.ctrlKey) {
                             executeAddEntry(newEntryContent);
                        }
                    }}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--background-modifier-border)',
                        minHeight: '100px',
                        resize: 'vertical'
                    }}
                />
                <div style={{ fontSize: '10px', opacity: 0.7 }}>
                   Tip: Press Ctrl+Enter to submit quickly.
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setIsEntryModalOpen(false)}>Cancel</button>
                    <button 
                        onClick={() => executeAddEntry(newEntryContent)}
                        style={{ background: 'var(--interactive-accent)', color: 'white' }}
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
      )}
      
       {/* Search Modal Overlay */}
      {isSearchModalOpen && (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--background-primary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                minWidth: '400px',
                maxHeight: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Search Categories</h3>
                    <button onClick={() => setIsSearchModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <dc.Icon icon="x" />
                    </button>
                </div>
                
                <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Type to search..." 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        padding: '10px',
                        fontSize: '16px',
                        borderRadius: '4px',
                        border: '1px solid var(--background-modifier-border)',
                        width: '100%'
                    }}
                />
                
                <div style={{ 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    maxHeight: '300px'
                }}>
                    {searchResults.length === 0 ? (
                        <p style={{ opacity: 0.7, fontStyle: 'italic', textAlign: 'center' }}>No matches found.</p>
                    ) : (
                        searchResults.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleSearchResultClick(cat)}
                                style={{
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: 'var(--background-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-modifier-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--background-secondary)'}
                            >
                                <dc.Icon icon="hash" style={{ fontSize: '12px', opacity: 0.5 }} />
                                {cat}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Legend Modal Overlay */}
      {isLegendModalOpen && (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--background-primary)',
                padding: '30px',
                borderRadius: '12px',
                border: '1px solid var(--background-modifier-border)',
                minWidth: '500px',
                maxWidth: '600px',
                maxHeight: '90%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-accent)' }}>Explorer Legend</h2>
                    <button onClick={() => setIsLegendModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <dc.Icon icon="x" style={{ fontSize: '20px' }} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                    <section>
                        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '5px' }}>Keyboard Shortcuts</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px' }}>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>v</code> <span>View (Tiktok Feed)</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>e</code> <span>Edit (Open Note)</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>n</code> <span>New Entry (Quick Add)</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>a</code> <span>Add Category</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>d</code> <span>Delete / Unlink</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>h</code> <span>Home</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>/</code> <span>Search Categories</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>[ / ]</code> <span>Navigate Back / Forward</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>?</code> <span>Toggle Legend</span>
                            <code style={{ background: 'var(--background-secondary)', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>Esc</code> <span>Close all Modals</span>
                        </div>
                    </section>

                    <section>
                        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '5px' }}>Features</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', display: 'grid', gap: '8px' }}>
                            <li><strong>Recursive Deletion:</strong> Deleting a category can optionally remove all its children automatically.</li>
                            <li><strong>Quick Entry:</strong> The orange button lets you add text/URLs directly to the top of the <code>.enigmas</code> file.</li>
                            <li><strong>Smart Edit:</strong> Automatically chooses between the main note or enigmas based on availability.</li>
                            <li><strong>Graph State:</strong> Remembers your navigation history even if you switch tabs.</li>
                        </ul>
                    </section>

                    <section style={{ padding: '10px', background: 'var(--background-secondary)', borderRadius: '6px', fontSize: '12px', opacity: 0.8 }}>
                        <strong>Tip:</strong> Click anywhere inside the component to focus it and activate keyboard shortcuts.
                    </section>
                </div>

                <button 
                  onClick={() => setIsLegendModalOpen(false)}
                  style={{ 
                    padding: '10px', 
                    background: 'var(--interactive-accent)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                    Got it!
                </button>
            </div>
        </div>
      )}
    </>
  );

  // If no file is found, render the radial view with an empty second ring.
  // This displays only the center node with its spinning header.
  if (!file) {
    return (
      <div 
        ref={containerRef} 
        tabIndex={0}
        onFocus={handleContainerFocus}
        onBlur={handleContainerBlur}
        style={{ 
            position: isFullTab ? "fixed" : "relative", 
            top: isFullTab ? 0 : undefined,
            left: isFullTab ? 0 : undefined,
            width: "100%", 
            height: isFullTab ? "100%" : "600px", 
            zIndex: isFullTab ? 5 : "auto",
            backgroundColor: isFullTab ? "var(--background-primary)" : "transparent",
            outline: "none" 
        }}
      >
        {controls}
        <ResponsiveRadialHeaderView
          centerLabel={currentCenter}
          secondRingData={[]}  // No ring2 or ring3 nodes.
          placeholderMarkdown="![[beto.group.svg]]"
          backgroundColor="#000"
          onCenterClick={handleCenterClick}
          onMiddleClick={handleMiddleClick}
        />
      </div>
    );
  }

  // --- Helper functions to extract headers ---
  function extractHeaders(fileItem) {
    if (!fileItem) return [];
    let headers = [];
    if (fileItem.$sections && fileItem.$sections.length > 0) {
      fileItem.$sections.forEach((section) => {
        if (section.$title) {
          headers.push({ title: section.$title, level: section.$level || 1 });
        }
      });
    }
    return headers;
  }
  function extractHeadersFromRaw(fileItem) {
    if (!fileItem) return [];
    const raw = fileItem.content || fileItem.$content || "";
    const regex = /^#{6}\s*(.*)$/gm;
    const headers = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      headers.push({ title: match[0].trim(), level: 6 });
    }
    return headers;
  }
  function getDesiredHeaders(fileItem, ignoreFirst = true) {
    let all = extractHeaders(fileItem);
    if (!all.length) {
      all = extractHeadersFromRaw(fileItem);
    }
    let filtered = all.filter((h) => h.level === 6);
    if (ignoreFirst && filtered.length > 1) {
      filtered = filtered.slice(1);
    }
    // Filter out "NAVIGATE - BACK" headers
    filtered = filtered.filter((h) => {
      const title = h.title.toLowerCase();
      return !title.includes("navigate") && !title.includes("back");
    });
    
    // Debug Log: Show what headers were found
    // console.log(`[ContentExplorer888] Parse headers for ${fileItem.name || "unknown"}: Found ${all.length}, Level 6: ${filtered.length}`);
    if (filtered.length === 0) {
       console.warn(`[ContentExplorer888] WARNING: No level 6 headers (######) found in ${fileItem ? (fileItem.name || fileItem.$path) : "unknown file"}`);
    }

    // Return scrubbed and uppercased headers
    return filtered.map((h) => parseHeaderName(h.title).trim().toUpperCase());
  }
  function getFileByName(namzuName) {
    if (!namzuName) return null;
    const target = namzuName.endsWith(".namzu") ? namzuName : `${namzuName}.namzu`;
    const pathSuffix = `${target}.md`;
    
    // Log query for debugging
    // Use 'contains' to be more robust against path variations, filter in JS
    const query = `@page and contains($path, "${pathSuffix}")`;
    const results = dc.useQuery(query);
    
    if (results && results.length > 0) {
        // console.log(`[ContentExplorer888] Query: ${query} => Found ${results.length} matches.`);

        // Heuristic: Prefer files NOT in "_resources" or "example" folders
        const preferred = results.filter(f => {
            const path = f.$path.toLowerCase();
            return !path.includes("/_resources/") && !path.includes("/example/");
        });

        // Debugging: Log all candidates
        // results.forEach(r => console.log(`   - Candidate: ${r.$path}`));
        
        let chosen = null;
        let reason = "";

        if (preferred.length > 0) {
            chosen = preferred[0];
            reason = "Preferred (Non-Resource)";
        } else {
            chosen = results[0];
            reason = "Fallback (First Match)";
        }

        // console.log(`[ContentExplorer888] Selected: ${chosen.name} (${reason}) -> ${chosen.$path}`);
        return chosen;
    } else {
        // console.warn(`[ContentExplorer888] File NOT FOUND: ${pathSuffix} (Query: ${query})`);
        return null;
    }
  }

  // --- Build ring2 data from file ---


  // Build ring2 data (empty array if no headers found)
  let secondRingData = [];
  if (ring2Unique.length > 0) {
    ring2Unique.forEach((heading) => {
      const subFile = getFileByName(heading);
      let children = [];
      if (subFile) {
        children = getDesiredHeaders(subFile, true);
        // Remove node capping as per user request
        // if (children.length > 15) { ... }
      }
      secondRingData.push({ heading, children });
    });
  }

  // Always render the radial view, even with no ring2 data
  // This allows clicking the center node to navigate back
  return (
    <div 
      ref={containerRef} 
      tabIndex={0}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      style={{ 
          position: isFullTab ? "fixed" : "relative", 
          top: isFullTab ? 0 : undefined,
          left: isFullTab ? 0 : undefined,
          width: "100%", 
          height: isFullTab ? "100%" : "600px", 
          zIndex: isFullTab ? 5 : "auto",
          backgroundColor: isFullTab ? "var(--background-primary)" : "transparent",
          outline: "none" 
      }}
    >
      {controls}
      <ResponsiveRadialHeaderView
        centerLabel={currentCenter}
        secondRingData={secondRingData}
        placeholderMarkdown="![[beto.group.svg]]"
        backgroundColor="#000"
        onCenterClick={handleCenterClick}
        onMiddleClick={handleMiddleClick}
      />
    </div>
  );
}



// ---------------------------------------------------------------------
// 7) Final Usage + Export in ViewBounty
// ---------------------------------------------------------------------
function ExampleUsage({ onFileSelect, showViewButton, spawnType, app }) {
  return <AutoRadialNamzuView centerLabel={centerHeader} onFileSelect={onFileSelect} showViewButton={showViewButton} spawnType={spawnType} app={app} />;
}

function ViewBounty({ app, onFileSelect, showViewButton = true, spawnType = "fullTab", folderPath, dc }) {
  return <ExampleUsage onFileSelect={onFileSelect} showViewButton={showViewButton} spawnType={spawnType} app={app} />;
}

return { ViewBounty };
