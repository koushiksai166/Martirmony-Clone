import { useEffect } from "react";

/**
 * Applies screenshot deterrence on protected content:
 * - CSS user-select: none + print media block
 * - Visibility change detection (tab switch during potential screenshot)
 * - Logs deterrence events (can be extended to call an API)
 */
function useScreenshotDeterrent(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    // Inject print-block style
    const style = document.createElement("style");
    style.id = "screenshot-deterrent";
    style.textContent = `
      @media print { body { display: none !important; } }
      .protected-content { user-select: none; -webkit-user-select: none; }
    `;
    document.head.appendChild(style);

    // Detect visibility change (common during screenshot tools on mobile)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Could call an API here to log the event
        console.warn("[Safety] Screen may have been captured");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Disable right-click context menu on protected images
    const handleContextMenu = (e) => {
      if (e.target.closest(".protected-content")) e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.getElementById("screenshot-deterrent")?.remove();
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled]);
}

export default useScreenshotDeterrent;
