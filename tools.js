// tools.js
import { elements } from './state.js';

export function disableDrawingMode() {
    if (!elements.fabricCanvas) return;
    elements.fabricCanvas.isDrawingMode = false;
    const toggleDraw = document.getElementById('toggle-draw');
    const whiteoutMode = document.getElementById('whiteout-mode');
    if (toggleDraw) {
        toggleDraw.style.backgroundColor = '#ecf0f1';
        toggleDraw.style.color = '#2c3e50';
    }
    if (whiteoutMode) {
        whiteoutMode.style.backgroundColor = '#ecf0f1';
        whiteoutMode.style.color = '#2c3e50';
    }
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
        fontFamily: 'Segoe UI', 
        fill: '#000000', 
        fontSize: 24, 
        transparentCorners: false, 
        cornerColor: 'blue'
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
                cornerColor: 'blue',
                transparentCorners: false
            });
            img.scaleToWidth(200);
            elements.fabricCanvas.add(img);
            elements.fabricCanvas.setActiveObject(img);
        });
    };
    reader.readAsDataURL(file);
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
        btnEvent.target.style.backgroundColor = '#f1c40f';
        btnEvent.target.style.color = 'black';
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
    ocrBtn.innerText = "⏳ Processing (High Quality)...";
    ocrBtn.disabled = true;

    try {
        const scale = 2.5; 
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = elements.pdfCanvas.width * scale;
        tempCanvas.height = elements.pdfCanvas.height * scale;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.scale(scale, scale);
        tCtx.drawImage(elements.pdfCanvas, 0, 0);

        const worker = await Tesseract.createWorker('eng+ara');
        await worker.setParameters({
            tessedit_pageseg_mode: '3',
        });

        const { data } = await worker.recognize(tempCanvas);

        data.lines.forEach(line => {
            if (line.text.trim().length === 0 || line.confidence < 50) return;

            const x0 = line.bbox.x0 / scale;
            const y0 = line.bbox.y0 / scale;
            const x1 = line.bbox.x1 / scale;
            const y1 = line.bbox.y1 / scale;
            const width = x1 - x0;
            const height = y1 - y0;

            const rect = new fabric.Rect({
                left: x0,
                top: y0,
                width: width,
                height: height,
                fill: 'white',
                selectable: false
            });
            elements.fabricCanvas.add(rect);

            const text = new fabric.IText(line.text.trim(), {
                left: x0,
                top: y0,
                fontFamily: 'Segoe UI',
                fill: '#000000',
                fontSize: Math.max(10, height * 0.8),
                transparentCorners: false,
                cornerColor: 'blue'
            });
            elements.fabricCanvas.add(text);
        });

        await worker.terminate();
    } catch (error) {
        console.error("OCR Error:", error);
    } finally {
        ocrBtn.innerText = originalText;
        ocrBtn.disabled = false;
        elements.fabricCanvas.renderAll();
    }
}

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
    sigPad.addEventListener('mouseout', () => { isDrawingSig = false; });
}

export function openSignatureModal() {
    disableDrawingMode();
    const modal = document.getElementById('signature-modal');
    if (modal) modal.style.display = 'flex';
    if (!sigPad) initSignaturePad();
    clearSignature();
}

export function closeSignatureModal() {
    const modal = document.getElementById('signature-modal');
    if (modal) modal.style.display = 'none';
}

export function clearSignature() {
    if (sigCtx && sigPad) {
        sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
    }
}

export function saveSignature() {
    if (!sigPad) return;
    const dataURL = sigPad.toDataURL('image/png');
    fabric.Image.fromURL(dataURL, function(img) {
        img.set({
            left: 100,
            top: 100,
            cornerColor: 'blue',
            transparentCorners: false
        });
        elements.fabricCanvas.add(img);
        elements.fabricCanvas.setActiveObject(img);
        closeSignatureModal();
    });
}
