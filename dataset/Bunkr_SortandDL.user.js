// ==UserScript==
// @name         Bunkr Auto-Sort & Download
// @namespace    https://github.com/4ndr0666/4ndr0666_userscripts
// @version      1.0
// @description  Automatically sorts Bunkr items by size (largest first) and adds download buttons below each thumbnail.
// @author       4ndr0666
// @match        https://bunkr.is/a/*
// @match        https://bunkr.ru/a/*
// @match        https://bunkrr.ru/a/*
// @match        https://bunkr.su/a/*
// @match        https://bunkr.la/a/*
// @match        https://bunkrr.su/a/*
// @match        https://bunkr.sk/a/*
// @match        https://bunkr.si/a/*
// @match        https://bunkr.ws/a/*
// @match        https://bunkr.se/a/*
// @match        https://bunkr.fi/a/*
// @match        https://bunkr.ci/a/*
// @match        https://bunkr.cr/a/*
// @match        https://bunkr.ax/a/*
// @match        https://bunkr.ac/a/*
// @match        https://bunkr.site/a/*
// @match        https://bunkr.black/a/*
// @match        https://bunkr.red/a/*
// @match        https://bunkr.ps/a/*
// @match        https://bunkr.pk/a/*
// @match        https://bunkr.ph/a/*
// @icon         https://dash.bunkr.pk/assets/img/icon.svg
// @license      MIT
// ==/UserScript==

(async () => {
  "use strict";

  /*************************************************************
   * ADDED CODE START: "Sort items largest to smallest"
   *************************************************************/
  /**
   * Minimal function to parse a size string (e.g. "39 MB", "1.4 GiB", "350 KiB")
   * and return a rough numeric value in MB. If no size text is found, returns 0.
   */
  function parseSize(sizeText) {
    if (!sizeText) return 0;
    const txt = sizeText.toLowerCase();
    const num = parseFloat(txt) || 0;
    if (txt.includes("g")) {
      // e.g., "GiB" or "GB" => multiply by 1024
      return num * 1024;
    } else if (txt.includes("k")) {
      // e.g., "KiB" or "KB" => divide by 1024
      return num / 1024;
    } else {
      // e.g., "MiB" or "MB" or fallback => treat as MB
      return num;
    }
  }

  /**
   * Reorders the items in .grid-images from largest to smallest,
   * based on any <p class="file-size"> text inside each item (if present).
   */
  (function sortBySize() {
    const container = document.querySelector(".grid-images");
    if (!container) return;

    // Convert NodeList to array
    const items = Array.from(container.querySelectorAll(":scope > *"));
    if (items.length === 0) return;

    // Build array of { node, sizeVal }
    const mapped = items.map((node) => {
      const sizeElem = node.querySelector("p.file-size");
      const sizeVal = sizeElem ? parseSize(sizeElem.textContent.trim()) : 0;
      return { node, sizeVal };
    });

    // Sort descending
    mapped.sort((a, b) => b.sizeVal - a.sizeVal);

    // Remove them from DOM
    mapped.forEach(obj => {
      if (obj.node.parentNode) {
        obj.node.parentNode.removeChild(obj.node);
      }
    });

    // Re-append in sorted order
    mapped.forEach(obj => {
      container.appendChild(obj.node);
    });
  })();
  /*************************************************************
   * ADDED CODE END
   *************************************************************/

  // ───────────────────────────────────────────────────────────
  // BELOW IS THE ORIGINAL, UNCHANGED CODE
  // ───────────────────────────────────────────────────────────
  const mediaLinks = Array.from(
    document.querySelectorAll(".grid-images_box-link")
  );

  const links = mediaLinks.map((mediaLink) => {
    const relativeLink = mediaLink.getAttribute("href");
    return window.location.origin + relativeLink;
  });

  const ddlLinks = await Promise.all(
    links.map(async (link) => {
      const response = await fetch(link);
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const ddlLink = doc.querySelector("a[href$='.mp4']").getAttribute("href");
      return ddlLink;
    })
  );

  const grid = document.querySelector(".grid-images");
  const medias = document.querySelectorAll(".grid-images > *");

  medias.forEach((media, i) => {
    const newBox = document.createElement("div");
    newBox.style.display = "flex";
    newBox.style.flexDirection = "column";

    const dlBox = document.createElement("button");
    dlBox.textContent = "Download";
    dlBox.style.border = "solid #ffd369 2px";
    dlBox.style.borderRadius = "0px 0px 20px 20px";

    dlBox.addEventListener("click", (e) => {
      e.stopPropagation();

      window.open(ddlLinks[i]);
    });

    media.style.borderBottom = "none";
    media.style.borderBottomLeftRadius = "0px";
    media.style.borderBottomRightRadius = "0px";
    newBox.appendChild(media);
    newBox.appendChild(dlBox);
    grid.appendChild(newBox);
  });
})();
