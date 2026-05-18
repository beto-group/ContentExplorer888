const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const base = folderPath + "/src";


const { getIframesGuidelines } = await dc.require(`${base}/utils/IframesGuidelines.js`);

/** Utility Functions **/

// Transforms URLs (for example, converts YouTube URLs to embed links)
function transformUrl(url) {
  if (!url) return "";
  const lower = url.toLowerCase();
  try {
    if (lower.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    } else if (lower.includes("youtu.be/")) {
      const parts = url.split("/");
      const videoId = parts[parts.length - 1];
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    }
  } catch (e) {
    console.error("URL transformation error:", e);
  }
  return url;
}

// Returns guidelines based on the entered URL.
function getGuidelinesForUrl(url, getIframesGuidelines) {
  const guidelines = getIframesGuidelines();
  const lowerUrl = url.toLowerCase();
  let key = "WEBSITES"; // default guideline

  if (lowerUrl.includes("facebook.com/reel") || lowerUrl.includes("facebook.com/plugins/vid")) {
    key = "FACEBOOK.reel";
  } else if (lowerUrl.includes("facebook.com/watch?v=")) {
    key = "FACEBOOK.video";
  } else if (lowerUrl.includes("facebook.com")) {
    key = "FACEBOOK";
  } else if (lowerUrl.includes("warpcast")) {
    key = "WARPCAST";
  } else if (lowerUrl.includes("snapchat.com")) {
    key = "SNAPCHAT";
  } else if (
    (lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) ||
    (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))
  ) {
    key = "YOUTUBE.shorts";
  } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    key = "YOUTUBE";
  } else if (lowerUrl.includes("tiktok.com/embed")) {
    key = "TIKTOK.embed";
  } else if (lowerUrl.includes("tiktok.com")) {
    key = "TIKTOK";
  } else if (lowerUrl.includes("reddit.com")) {
    key = "REDDIT";
  } else if (lowerUrl.includes("linkedin.com")) {
    key = "LINKEDIN";
  } else if (lowerUrl.includes("instagram.com/reel") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.embed";
  } else if (lowerUrl.includes("instagram.com/p") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.p.embed";
  } else if (lowerUrl.includes("instagram.com/p")) {
    key = "INSTAGRAM.p";
  } else if (lowerUrl.includes("instagram.com")) {
    key = "INSTAGRAM";
  } else if (lowerUrl.includes("platform.twitter.com/embed") || lowerUrl.includes("platform.x.com/embed")) {
    key = "X.platform.embed";
  } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    key = "X";
  }
  return guidelines[key];
}

/** Custom Hooks **/

// Sets up a ResizeObserver on the container and calls the updateDimensions callback
function useResizeObserver(containerRef, isContainerManualRef, updateDimensions) {
  const { useEffect, useRef } = dc;
  const observerRef = useRef(null);

  useEffect(() => {
    if (
      !isContainerManualRef.current &&
      containerRef.current &&
      typeof ResizeObserver !== "undefined"
    ) {
      //console.log("Attaching ResizeObserver. isContainerManual:",isContainerManualRef.current);
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          console.log(
            "ResizeObserver: new container width =",
            newWidth,
            "(isContainerManualRef.current:",
            isContainerManualRef.current,
            ")"
          );
          if (!isContainerManualRef.current) {
            updateDimensions(newWidth);
          } else {
            //console.log("Skipped ResizeObserver update because container is manual.");
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        //console.log("Disconnecting ResizeObserver.");
        observer.disconnect();
        observerRef.current = null;
      };
    } else {
      //console.log( "ResizeObserver not attached. isContainerManual:", isContainerManualRef.current );
    }
  }, [isContainerManualRef.current, containerRef.current]);

  return observerRef;
}

// Fallback window resize listener when ResizeObserver is not available.
function useWindowResize(isContainerManual, updateDimensions) {
  const { useEffect } = dc;
  useEffect(() => {
    if (!isContainerManual) {
      //console.log("Attaching window resize listener. isContainerManual:", isContainerManual);
      const handleResize = () => {
        const newWidth = window.innerWidth;
        //console.log("Window resize: new width =", newWidth, "(isContainerManual:", isContainerManual, ")");
        updateDimensions(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        //console.log("Removing window resize listener.");
        window.removeEventListener("resize", handleResize);
      };
    } else {
      //console.log("Window resize listener not attached. isContainerManual:", isContainerManual);
    }
  }, [isContainerManual]);
}

/** Sub‑Components **/

// Component for toggling iFrame interaction (moved to header, URL input removed)
function IframeControls({ disableIframeInteraction, toggleIframeInteraction }) {
  return (
    <div style={{ padding: "10px" }}>
      <button onClick={toggleIframeInteraction}>
        {disableIframeInteraction ? "ENABLE" : "DISABLE"}
      </button>
    </div>
  );
}

// Component for rendering the container, inner content, and the iFrame.
function IframeContainer({
  width,
  height,
  iframeSrc,
  iframeWidth,
  iframeHeight,
  iframeScale,
  iframeLeft,
  iframeTop,
  disableIframeInteraction,
  iframeWrapperRef
}) {
  return (
    <div
      style={{
        position: "relative",
        width: width + "px",
        height: height + "px",
        border: "1px solid #ccc",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "0 auto"
      }}
    >
      <p>HELLO WORLD</p>
      <div
        ref={iframeWrapperRef}
        style={{
          position: "absolute",
          left: iframeLeft + "px",
          top: iframeTop + "px",
          width: iframeWidth + "px",
          height: iframeHeight + "px",
          overflow: "hidden",
          pointerEvents: disableIframeInteraction ? "none" : "auto"
        }}
      >
        {transformUrl(iframeSrc) ? (
          <iframe
            src={transformUrl(iframeSrc)}
            title="Controlled iFrame"
            width={iframeWidth}
            height={iframeHeight}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              border: "1px solid #ccc",
              transform: `scale(${iframeScale})`,
              transformOrigin: "top left"
            }}
          ></iframe>
        ) : null}
      </div>
    </div>
  );
}

return { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeControls, IframeContainer };
