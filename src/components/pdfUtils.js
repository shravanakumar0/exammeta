import * as pdfjsLib from "pdfjs-dist";

// Worker Setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (url) => {
  try {
    let fileId = null;
    const driveMatch = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    if (driveMatch) fileId = driveMatch[1];
    const sourceUrl = fileId
      ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
      : url;
    const fetchUrls = [
      sourceUrl,
      url,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(sourceUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(sourceUrl)}`,
    ].filter((candidate, index, all) => all.indexOf(candidate) === index);

    let arrayBuffer = null;
    for (const fetchUrl of fetchUrls) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(fetchUrl, { signal: controller.signal });
        if (response.ok) {
          const candidate = await response.arrayBuffer();
          const header = new TextDecoder().decode(candidate.slice(0, 1024));
          if (header.includes("%PDF-")) {
            arrayBuffer = candidate;
            break;
          }
        }
      } catch {
        // Continue to the next permitted public-fetch route.
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!arrayBuffer) throw new Error("Could not retrieve a readable PDF from this public resource. The host may block access or require sign-in.");

    // 4. Parse PDF Data
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return { success: true, text: fullText };

  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    return { success: false, error: error.message };
  }
};

export const extractTextFromLocalFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      fullText += text.items.map((item) => item.str).join(" ") + "\n";
    }
    return { success: true, text: fullText };
  } catch (error) {
    return { success: false, error: "Local file read error" };
  }
};
