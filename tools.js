// tools.js
import { elements } from './state.js';

export function disableDrawingMode() {
    if (!elements.fabricCanvas) return;
    elements.fabricCanvas.isDrawingMode = false;
    
    // Hide toolbars
    document.getElementById('text-toolbar').style.display = 'none';
    document.getElementById('brush-toolbar').style.display = 'none';

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

// --- Text Tools ---
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

export function syncTextToolbar() {
    const obj = elements.fabricCanvas.getActiveObject();
    const toolbar = document.getElementById('text-toolbar');
    if (obj && obj.type === 'i-text') {
        toolbar.style.display = 'flex';
        document.getElementById('font-family').value = obj.fontFamily;
        document.getElementById('font-size').value = obj.fontSize;
        document.getElementById('font-color').value = obj.fill;
    } else {
        toolbar.style.display = 'none';
    }
}

export function updateTextProperty(prop, val) {
    const obj = elements.fabricCanvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        if (prop === 'fontWeight') obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        else if (prop === 'fontStyle') obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        else obj.set(prop, prop === 'fontSize' ? parseInt(val) : val);
        elements.fabricCanvas.renderAll();
    }
}

// --- Brush Tools (Draw, Highlight, Erase, Redact) ---
export function showBrushToolbar(type) {
    const toolbar = document.getElementById('brush-toolbar');
    const colorPicker = document.getElementById('brush-color');
    const sizeInput = document.getElementById('brush-size');
    
    toolbar.style.display = 'flex';
    
    // Set defaults based on tool type
    if (type === 'highlight') {
        colorPicker.value = '#ffff00';
        sizeInput.value = 20;
    } else if (type === 'draw') {
        colorPicker.value = '#ff0000';
        sizeInput.value = 3;
    } else if (type === 'erase') {
        colorPicker.value = '#ffffff';
        sizeInput.value = 30;
    } else if (type === 'redact') {
        colorPicker.value = '#000000';
        sizeInput.value = 25;
    }
    updateBrush();
}

export function updateBrush() {
    const color = document.getElementById('brush-color').value;
    const size = parseInt(document.getElementById('brush-size').value);
    
    // If it's a highlighter, add transparency
    const isHighlight = document.getElementById('highlight-mode').style.backgroundColor !== 'rgb(236, 240, 241)';
    
    elements.fabricCanvas.freeDrawingBrush.color = isHighlight ? hexToRgba(color, 0.4) : color;
    elements.fabricCanvas.freeDrawingBrush.width = size;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function enableDrawMode(e) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    e.target.style.backgroundColor = '#e74c3c';
    e.target.style.color = 'white';
    showBrushToolbar('draw');
}

export function enableHighlightMode(e) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    e.target.style.backgroundColor = '#f1c40f';
    showBrushToolbar('highlight');
}

export function enableWhiteoutMode(e) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    e.target.style.backgroundColor = '#bdc3c7';
    showBrushToolbar('erase');
}

export function enableRedactionMode(e) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    e.target.style.backgroundColor = '#2c3e50';
    e.target.style.color = 'white';
    showBrushToolbar('redact');
}

// --- Shapes & OCR ---
export function addRectangle() {
    disableDrawingMode();
    const rect = new fabric.Rect({ left: 100, top: 100, fill: 'transparent', stroke: 'red', strokeWidth: 2, width: 100, height: 60 });
    elements.fabricCanvas.add(rect);
}

export function addCircle() {
    disableDrawingMode();
    const circle = new fabric.Circle({ left: 100, top: 100, fill: 'transparent', stroke: 'blue', strokeWidth: 2, radius: 40 });
    elements.fabricCanvas.add(circle);
}

export function deleteSelected() {
    const active = elements.fabricCanvas.getActiveObjects();
    if (active.length) {
        elements.fabricCanvas.discardActiveObject();
        active.forEach(obj => elements.fabricCanvas.remove(obj));
    }
}

export async function performOCR() {
    disableDrawingMode();
    const ocrBtn = document.getElementById('ocr-btn');
    const originalText = ocrBtn.innerText;
    ocrBtn.innerText = "⏳ Processing...";
    ocrBtn.disabled = true;

    try {
        const worker = await Tesseract.createWorker('eng+ara');
        const { data } = await worker.recognize(elements.pdfCanvas);
        data.words.forEach(word => {
            if (word.confidence < 60) return;
            const rect = new fabric.Rect({ left: word.bbox.x0, top: word.bbox.y0, width: word.bbox.x1 - word.bbox.x0, height: word.bbox.y1 - word.bbox.y0, fill: 'white', selectable: false });
            elements.fabricCanvas.add(rect);
            const text = new fabric.IText(word.text, { left: word.bbox.x0, top: word.bbox.y0, fontSize: (word.bbox.y1 - word.bbox.y0) * 0.9, fontFamily: 'Arial' });
            elements.fabricCanvas.add(text);
        });
        await worker.terminate();
    } catch (e) { console.error(e); }
    finally { ocrBtn.innerText = originalText; ocrBtn.disabled = false; elements.fabricCanvas.renderAll(); }
}

// --- SignaturePad ---
let sigPad, sigCtx, isDrawingSig = false;
export function initSignaturePad() {
    sigPad = document.getElementById('signature-pad');
    sigCtx = sigPad.getContext('2d');
    sigCtx.lineWidth = 2; sigCtx.lineCap = 'round';
    sigPad.onmousedown = (e) => { isDrawingSig = true; sigCtx.beginPath(); sigCtx.moveTo(e.offsetX, e.offsetY); };
    sigPad.onmousemove = (e) => { if (isDrawingSig) { sigCtx.lineTo(e.offsetX, e.offsetY); sigCtx.stroke(); } };
    sigPad.onmouseup = () => isDrawingSig = false;
}

export function openSignatureModal() {
    document.getElementById('signature-modal').style.display = 'flex';
    if (!sigPad) initSignaturePad();
    clearSignature();
}

export function closeSignatureModal() { document.getElementById('signature-modal').style.display = 'none'; }
export function clearSignature() { sigCtx.clearRect(0, 0, sigPad.width, sigPad.height); }
export function saveSignature() {
    fabric.Image.fromURL(sigPad.toDataURL(), (img) => {
        img.set({ left: 100, top: 100 });
        img.scaleToWidth(150);
        elements.fabricCanvas.add(img);
        closeSignatureModal();
    });
}
