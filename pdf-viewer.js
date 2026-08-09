let pdfjsReady = null;
function ensurePdfJs(){
  if (pdfjsReady) return pdfjsReady;
  pdfjsReady = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error("Could not load PDF viewer (no internet?)"));
    document.head.appendChild(s);
  });
  return pdfjsReady;
}

function base64ToUint8(base64){
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function renderPdfIntoContainer(container, base64Data, onProgress){
  const pdfjsLib = await ensurePdfJs();
  container.innerHTML = "";
  const data = base64ToUint8(base64Data);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const dpr = window.devicePixelRatio || 1;
  for (let n = 1; n <= pdf.numPages; n++){
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: (container.clientWidth * 0.94) / page.getViewport({scale:1}).width });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport }).promise;
    if (onProgress) onProgress(n, pdf.numPages);
  }
}
