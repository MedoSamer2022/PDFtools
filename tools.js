// tools.js

export async function performOCR() {
    disableDrawingMode();
    if (!elements.pdfCanvas) return;

    const ocrBtn = document.getElementById('ocr-btn');
    const progressContainer = document.getElementById('ocr-progress-container');
    const progressBar = document.getElementById('ocr-progress-bar');
    const statusText = document.getElementById('ocr-status-text');

    if (!ocrBtn || !progressContainer) return;
    
    // Show UI
    ocrBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';

    try {
        const scale = 2; 
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = elements.pdfCanvas.width * scale;
        tempCanvas.height = elements.pdfCanvas.height * scale;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.scale(scale, scale);
        tCtx.drawImage(elements.pdfCanvas, 0, 0);

        // Pre-process for better accuracy
        const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = avg < 160 ? 0 : 255; 
            data[i] = data[i + 1] = data[i + 2] = threshold;
        }
        tCtx.putImageData(imageData, 0, 0);

        // Create worker with Progress Logger
        const worker = await Tesseract.createWorker('eng+ara', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    progressBar.style.width = `${progress}%`;
                    statusText.innerText = `Recognizing Text: ${progress}%`;
                } else {
                    statusText.innerText = m.status;
                }
            }
        });

        await worker.setParameters({
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1'
        });

        const { data: resultData } = await worker.recognize(tempCanvas);

        resultData.words.forEach(word => {
            if (word.text.trim().length === 0 || word.confidence < 60) return;

            const x0 = word.bbox.x0 / scale;
            const y0 = word.bbox.y0 / scale;
            const x1 = word.bbox.x1 / scale;
            const y1 = word.bbox.y1 / scale;
            const height = y1 - y0;

            // Hide old text with white box
            const rect = new fabric.Rect({
                left: x0,
                top: y0 - (height * 0.1),
                width: x1 - x0,
                height: height * 1.2,
                fill: 'white',
                selectable: false
            });
            elements.fabricCanvas.add(rect);

            // Add editable text
            const text = new fabric.IText(word.text, {
                left: x0,
                top: y0,
                fontFamily: 'Arial',
                fill: '#000000',
                fontSize: height * 0.8,
                fontWeight: word.is_bold ? 'bold' : 'normal',
                fontStyle: word.is_italic ? 'italic' : 'normal',
                transparentCorners: false,
                cornerColor: '#3498db'
            });
            elements.fabricCanvas.add(text);
        });

        await worker.terminate();
    } catch (error) {
        console.error("OCR Error:", error);
        alert("OCR failed to process this page.");
    } finally {
        // Hide UI
        ocrBtn.disabled = false;
        progressContainer.style.display = 'none';
        elements.fabricCanvas.renderAll();
    }
}
