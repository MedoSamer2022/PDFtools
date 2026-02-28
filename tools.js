// tools.js
import { elements } from './state.js';

export function disableDrawingMode() {
    if (!elements.fabricCanvas) return;
    elements.fabricCanvas.isDrawingMode = false;
    
    // Reset all tool button styles
    const buttons = ['toggle-draw', 'whiteout-mode', 'highlight-mode', 'redact-mode'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.backgroundColor = '#ecf0f1';
            btn.style.color = '#2c3e50';
        }
    });
}

export function enableCursorMode() {
    disableDrawingMode();
    elements.fabricCanvas.discardActiveObject();
    elements.fabricCanvas.renderAll();
}

export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 50, 
        top: 50, 
        fontFamily: 'Arial', 
        fill: '#000000', 
        fontSize: 24, 
        transparentCorners: false, 
        cornerColor: '#3498db'
    });
    elements.fabricCanvas.add(text);
    elements.fabricCanvas.setActiveObject(text);
}

export function addImage(file) {
    disableDrawingMode();
    const reader = new FileReader();
    reader.onload = function(f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function(img) {
            img.set({
                left: 50,
                top: 50,
                cornerColor: '#3498db',
                transparentCorners: false
            });
            img.scaleToWidth(200);
            elements.fabricCanvas.add(img);
            elements.fabricCanvas.setActiveObject(img);
        });
    };
    reader.readAsDataURL(file);
}

export function addRectangle() {
    disableDrawingMode();
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: '#e74c3c',
        strokeWidth: 3,
        width: 100,
        height: 100,
        transparentCorners: false,
        cornerColor: '#3498db'
    });
    elements.fabricCanvas.add(rect);
    elements.fabricCanvas.setActiveObject(rect);
}

export function addCircle() {
    disableDrawingMode();
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: '#3498db',
        strokeWidth: 3,
        transparentCorners: false,
        cornerColor: '#3498db'
    });
    elements.fabricCanvas.add(circle);
    elements.fabricCanvas.setActiveObject(circle);
}

export function enableDrawMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "red";
    elements.fabricCanvas.freeDrawingBrush.width = 3;
    if (btnEvent && btnEvent.target) {
        btnEvent.target.style.backgroundColor = '#e74c3c';
        btnEvent.target.style.color = 'white';
    }
}

export function enableWhiteoutMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "#ffffff"; 
    elements.fabricCanvas.freeDrawingBrush.width = 25; 
    if (btnEvent && btnEvent.target) {
        btnEvent.target.style.backgroundColor = '#bdc3c7';
        btnEvent.target.style.color = 'black';
    }
}

export function enableHighlightMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "rgba(255, 235, 59, 0.4)"; // Yellow with opacity
    elements.fabricCanvas.freeDrawingBrush.width = 20; 
    if (btnEvent && btnEvent.target) {
        btnEvent.target.style.backgroundColor = '#f1c40f';
        btnEvent.target.style.color = 'black';
    }
}

export function enableRedactionMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "#000000"; // Solid Black
    elements.fabricCanvas.freeDrawingBrush.width = 25; 
    if (btnEvent && btnEvent.target) {
        btnEvent.target.style.backgroundColor = '#2c3e50';
        btnEvent.target.style.color = 'white';
    }
}

export function deleteSelected() {
    const activeObjects = elements.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        elements.fabricCanvas.discardActiveObject();
        activeObjects.forEach(object => elements.fabricCanvas.remove(object));
    }
}

export async function performOCR() {
    disableDrawingMode();
    if (!elements.pdfCanvas) return;

    const ocrBtn = document.getElementById('ocr-btn');
    if (!ocrBtn) return;
    
    const originalText = ocrBtn.innerText;
    ocrBtn.innerText = "⏳ Running Advanced OCR...";
    ocrBtn.disabled = true;

    try {
        // Image Pre-processing for better OCR accuracy
        const scale = 2; // Upscale image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = elements.pdfCanvas.width * scale;
        tempCanvas.height = elements.pdfCanvas.height * scale;
        const tCtx = tempCanvas.getContext('2d');
        
        tCtx.scale(scale, scale);
        tCtx.drawImage(elements.pdfCanvas, 0, 0);

        // Binarization (High Contrast Grayscale)
        const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = avg < 160 ? 0 : 255; // Force black or white
            data[i] = data[i + 1] = data[i + 2] = threshold;
        }
        tCtx.putImageData(imageData, 0, 0);

        const worker = await Tesseract.createWorker('eng+ara');
        await worker.setParameters({
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1'
        });

        // Use the pre-processed canvas
        const { data: resultData } = await worker.recognize(tempCanvas);

        // Read WORD by WORD instead of lines for high precision
        resultData.words.forEach(word => {
            if (word.text.trim().length === 0 || word.confidence < 60) return;

            const x0 = word.bbox.x0 / scale;
            const y0 = word.bbox.y0 / scale;
            const x1 = word.bbox.x1 / scale;
            const y1 = word.bbox.y1 / scale;
            const width = x1 - x0;
            const height = y1 - y0;

            // Add White Box to hide original text perfectly
            const rect = new fabric.Rect({
                left: x0,
                top: y0 - (height * 0.1),
                width: width,
                height: height * 1.2,
                fill: 'white',
                selectable: false
            });
            elements.fabricCanvas.add(rect);

            // Overlay editable text
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
        alert("OCR Failed. Please check console.");
    } finally {
        ocrBtn.innerText = originalText;
        ocrBtn.disabled = false;
        elements.fabricCanvas.renderAll();
    }
}

// Signature Logic
let sigPad, sigCtx, isDrawingSig = false;

export function initSignaturePad() {
    sigPad = document.getElementById('signature-pad');
    if (!sigPad) return;
    sigCtx = sigPad.getContext('2d');
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.strokeStyle = '#000000';

    sigPad.addEventListener('mousedown', (e) => {
        isDrawingSig = true;
        sigCtx.beginPath();
        sigCtx.moveTo(e.offsetX, e.getY ? e.getY() : e.offsetY);
    });

    sigPad.addEventListener('mousemove', (e) => {
        if (!isDrawingSig) return;
        sigCtx.lineTo(e.offsetX, e.getY ? e.getY() : e.offsetY);
        sigCtx.stroke();
    });

    sigPad.addEventListener('mouseup', () => { isDrawingSig = false; });
    sigPad.addEventListener('mouseout', () => {
