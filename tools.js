// tools.js

export async function performOCR() {
    disableDrawingMode();
    if (!elements.pdfCanvas) return;

    const progressCont = document.getElementById('ocr-progress-container');
    const bar = document.getElementById('ocr-progress-bar');
    const statusText = document.getElementById('ocr-status-text');
    
    progressCont.style.display = 'block';
    statusText.innerText = "Preparing Image...";

    try {
        // 1. Setup High-Res Processing Canvas
        const scale = 2.5; // Upscale for better small-text detection
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = elements.pdfCanvas.width * scale;
        tempCanvas.height = elements.pdfCanvas.height * scale;
        const tCtx = tempCanvas.getContext('2d');
        
        tCtx.scale(scale, scale);
        tCtx.drawImage(elements.pdfCanvas, 0, 0);

        // 2. Image Enhancement (Binarization)
        // This converts the image to pure Black & White to remove "noise" from scans
        const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const grayscale = pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11;
            const threshold = grayscale < 150 ? 0 : 255; // Thresholding logic
            pixels[i] = pixels[i + 1] = pixels[i + 2] = threshold;
        }
        tCtx.putImageData(imageData, 0, 0);

        // 3. Initialize Worker with Arabic + English
        const worker = await Tesseract.createWorker('eng+ara', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const p = Math.round(m.progress * 100);
                    bar.style.width = `${p}%`;
                    statusText.innerText = `Analyzing Layout: ${p}%`;
                }
            }
        });

        // Set parameters for "Auto Layout" detection
        await worker.setParameters({
            tessedit_pageseg_mode: '3', // Fully automatic page segmentation
            preserve_interword_spaces: '1'
        });

        const { data } = await worker.recognize(tempCanvas);

        // 4. Smart Object Placement
        // We group by 'lines' to maintain paragraph structure but allow 'word' editing
        data.lines.forEach(line => {
            if (line.confidence < 50) return;

            const x = line.bbox.x0 / scale;
            const y = line.bbox.y0 / scale;
            const w = (line.bbox.x1 - line.bbox.x0) / scale;
            const h = (line.bbox.y1 - line.bbox.y0) / scale;

            // Mask the original area
            const mask = new fabric.Rect({
                left: x,
                top: y,
                width: w,
                height: h,
                fill: 'white',
                selectable: false
            });
            elements.fabricCanvas.add(mask);

            // Add the IText (Editable)
            const text = new fabric.IText(line.text.trim(), {
                left: x,
                top: y,
                fontSize: h * 0.9,
                fontFamily: 'Arial',
                fill: '#000000',
                transparentCorners: false,
                cornerColor: '#3498db'
            });
            elements.fabricCanvas.add(text);
        });

        await worker.terminate();
    } catch (e) {
        console.error("OCR Error:", e);
        alert("OCR failed to process image content.");
    } finally {
        progressCont.style.display = 'none';
        elements.fabricCanvas.renderAll();
    }
}
