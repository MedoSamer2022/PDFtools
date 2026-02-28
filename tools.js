// tools.js
import { elements } from './state.js';

export function disableDrawingMode() {
    elements.fabricCanvas.isDrawingMode = false;
    document.getElementById('toggle-draw').style.backgroundColor = '#ecf0f1';
    document.getElementById('toggle-draw').style.color = '#2c3e50';
    document.getElementById('whiteout-mode').style.backgroundColor = '#ecf0f1';
    document.getElementById('whiteout-mode').style.color = '#2c3e50';
}

export function enableCursorMode() {
    disableDrawingMode();
}

export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 50, top: 50, fontFamily: 'Segoe UI', fill: '#000000', fontSize: 24, transparentCorners: false, cornerColor: 'blue'
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
                left: 100,
                top: 100,
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
    btnEvent.target.style.backgroundColor = '#e74c3c';
    btnEvent.target.style.color = 'white';
}

export function enableWhiteoutMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "#ffffff"; 
    elements.fabricCanvas.freeDrawingBrush.width = 20; 
    btnEvent.target.style.backgroundColor = '#f1c40f';
    btnEvent.target.style.color = 'black';
}

export function deleteSelected() {
    const activeObjects = elements.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        elements.fabricCanvas.discardActiveObject();
        activeObjects.forEach(object => elements.fabricCanvas.remove(object));
    }
}

// tools.js (أضف هذه الدالة)
export async function performOCR() {
    disableDrawingMode();
    const pdfCanvas = document.getElementById('pdf-canvas');
    
    // إظهار حالة التحميل للمستخدم
    const ocrBtn = document.getElementById('ocr-btn');
    const originalText = ocrBtn.innerText;
    ocrBtn.innerText = "⏳ جاري التعرف...";
    ocrBtn.disabled = true;

    try {
        const worker = await Tesseract.createWorker('ara+eng');
        const { data } = await worker.recognize(pdfCanvas);

        data.lines.forEach(line => {
            if (line.text.trim().length === 0) return;

            const rect = new fabric.Rect({
                left: line.bbox.x0,
                top: line.bbox.y0,
                width: line.bbox.x1 - line.bbox.x0,
                height: line.bbox.y1 - line.bbox.y0,
                fill: 'white',
                selectable: false
            });
            elements.fabricCanvas.add(rect);

            const text = new fabric.IText(line.text.trim(), {
                left: line.bbox.x0,
                top: line.bbox.y0,
                fontFamily: 'Segoe UI',
                fill: '#000000',
                fontSize: (line.bbox.y1 - line.bbox.y0) * 0.8,
                transparentCorners: false,
                cornerColor: 'blue',
                direction: 'rtl'
            });
            elements.fabricCanvas.add(text);
        });

        await worker.terminate();
    } catch (error) {
        console.error(error);
    } finally {
        ocrBtn.innerText = originalText;
        ocrBtn.disabled = false;
        elements.fabricCanvas.renderAll();
    }
}
