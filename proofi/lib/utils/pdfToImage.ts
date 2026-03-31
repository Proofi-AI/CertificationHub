/**
 * Renders page 1 of a PDF file to a JPEG using PDF.js.
 * Runs entirely in the browser — no server required.
 * Scale 2× gives a sharp render suitable for both thumbnails and lightbox.
 */
export async function pdfToJpeg(file: File): Promise<File> {
  const pdfjsLib = await import("pdfjs-dist");

  // Webpack resolves this URL pattern and emits the worker as a separate chunk
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);

  // 2× scale → sharp image even on retina displays
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas export failed")); return; }
        resolve(
          new File(
            [blob],
            file.name.replace(/\.pdf$/i, ".jpg"),
            { type: "image/jpeg" }
          )
        );
      },
      "image/jpeg",
      0.92
    );
  });
}
