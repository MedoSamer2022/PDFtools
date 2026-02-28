// tools.js

export async function performOCR() {
    disableDrawingMode();
    if (!elements.pdfCanvas) return;

    const progressCont = document.getElementById('ocr-progress-container');
    const bar = document.getElementById('ocr-progress-bar');
    const statusText = document.getElementById('ocr-status-text');
    
    progressCont.style.display = 'block';
    statusText.innerText = "Enhancing Image Quality...";

    try {
        // 1. Create a High-Resolution "Ghost" Canvas
        // Upscaling by 3x helps the AI see small or blurry text much better
        const scale = 3; 
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = elements.pdfCanvas.width * scale;
        tempCanvas.height = elements.pdfCanvas.height * scale;
        const tCtx = tempCanvas.getContext('2d');
        
        tCtx.scale(scale, scale);
        tCtx.drawImage(elements.pdfCanvas, 0, 0);

        // 2. Image Pre-Processing (Binarization)
        // This removes shadows and makes the text pure black on pure white
        const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            // Calculate brightness (Luminance)
            const brightness = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
            // Threshold: If it's dark, make it black (0). If it's light, make it white (255).
            const thresholdValue = brightness < 150 ? 0 : 255; 
            pixels[i] = pixels[i + 1] = pixels[i + 2] = thresholdValue;
        }
        tCtx.putImageData(imageData, 0, 0);

        // 3. Initialize Worker with Arabic + English
        const worker = await Tesseract.createWorker('eng+ara', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const p = Math.round(m.progress * 100);
                    bar.style.width = `${p}%`;
                    statusText.innerText = `Recognizing Text: ${p}%`;
                }
            }
        });

        // 4. Set Advanced Parameters
        await worker.setParameters({
            tessedit_pageseg_mode: '3', // Auto layout detection (finds columns/tables)
            preserve_interword_spaces: '1',
            tessjs_create_hocr: '1'
        });

        const { data } = await worker.recognize(tempCanvas);

        // 5. Adobe-Style Reconstruction
        data.words.forEach(word => {
            // Only add text if the AI is reasonably sure (Confidence > 50)
            if (word.confidence < 50 || word.text.trim().length === 0) return;

            const x = word.bbox.x0 / scale;
            const y = word.bbox.y0 / scale;
            const w = (word.bbox.x1 - word.bbox.x0) / scale;
            const h = (word.bbox.y1 - word.bbox.y0) / scale;

            // Whiteout original area
            elements.fabricCanvas.add(new fabric.Rect({
                left: x, top: y, width: w, height: h,
                fill: 'white', selectable: false
            }));

            // Add Editable Text
            const text = new fabric.IText(word.text, {
                left: x,
                top: y,
                fontSize: h * 0.85,
                fontFamily: 'Arial',
                fill: '#000000',
                transparentCorners: false,
                cornerColor: '#3498db'
            });
            elements.fabricCanvas.add(text);
        });

        await worker.terminate();
    } catch (e) {
        console.error("OCR Failed:", e);
    } finally {
        progressCont.style.display = 'none';
        elements.fabricCanvas.renderAll();
    }
}
