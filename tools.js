// tools.js
import { elements } from './state.js'; // ONLY ONE IMPORT AT THE TOP

/**
 * 🔒 Utility: Disable drawing modes and hide toolbars
 */
export function disableDrawingMode() {
    if (!elements.fabricCanvas) return;
    elements.fabricCanvas.isDrawingMode = false;
    
    const textToolbar = document.getElementById('text-toolbar');
    const brushToolbar = document.getElementById('brush-toolbar');
    if (textToolbar) textToolbar.style.display = 'none';
    if (brushToolbar) brushToolbar.style.display = 'none';
}

/**
 * 👆 Tool: Select Mode
 */
export function enableCursorMode() {
    disableDrawingMode();
}

/**
 * 📝 Tool: Add Editable Text
 */
export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 100, top: 100, fontSize: 24, fontFamily: 'Arial',
        fill: '#000000', cornerColor: '#3498db', transparentCorners: false
    });
    elements.fabricCanvas.add(text).setActiveObject(text);
}

/**
 * 🎨 UI: Sync Text Toolbar with selected object
 */
export function syncTextToolbar() {
    const obj = elements.fabricCanvas.getActiveObject();
    const tb = document.getElementById('text-toolbar');
    if (obj && obj.type === 'i-text') {
        if (tb) tb.style.display = 'flex';
        document.getElementById('font-family').value = obj.fontFamily || 'Arial';
        document.getElementById('font-size').value = obj.fontSize || 24;
        document.getElementById('font-color').value = obj.fill || '#000000';
    } else if (tb) {
        tb.style.display = 'none';
    }
}

/**
 * 🛠️ Action: Update Text Properties
 */
export function updateTextProperty(prop, val) {
    const obj = elements.fabricCanvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        if (prop === 'fontWeight') {
            obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        } else if (prop === 'fontStyle') {
            obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        } else {
            obj.set(prop, prop === 'fontSize' ? parseInt(val) : val);
        }
        elements.fabricCanvas.renderAll();
    }
}

/**
 * 🖌️ Brush Logic: Update Color/Size
 */
export function updateBrush() {
    const color = document.getElementById('brush-color').value;
    const size = parseInt(document.getElementById('brush-size').value);
    elements.fabricCanvas.freeDrawingBrush.color = color;
    elements.fabricCanvas.freeDrawingBrush.width = size;
}

/**
 * 🖍️ Tool: Drawing Modes
 */
export function enableDrawMode() {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    document.getElementById('brush-toolbar').style.display = 'flex';
    updateBrush();
}

export function enableHighlightMode() {
    enableDrawMode();
    elements.fabricCanvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
    updateBrush();
}

export function enableWhiteoutMode() {
    enableDrawMode();
    elements.fabricCanvas.freeDrawingBrush.color = '#ffffff';
    elements.fabricCanvas.freeDrawingBrush.width = 30;
}

export function enableRedactionMode() {
    enableDrawMode();
    elements.fabricCanvas.freeDrawingBrush.color = '#000000';
}

/**
 * 🟦 Tool: Shapes
 */
export function addRectangle() {
    disableDrawingMode();
    elements.fabricCanvas.add(new fabric.Rect({
        left: 150, top: 150, width: 100, height: 60,
        fill: 'transparent', stroke: 'red', strokeWidth: 2
    }));
}

export function addCircle() {
    disableDrawingMode();
    elements.fabricCanvas.add(new fabric.Circle({
        left: 150, top: 150, radius: 40,
        fill: 'transparent', stroke: 'blue', strokeWidth: 2
    }));
}

/**
 * 🗑️ Action: Delete Selection
 */
export function deleteSelected() {
    elements.fabricCanvas.getActiveObjects().forEach(o => elements.fabricCanvas.remove(o));
    elements.fabricCanvas.discardActiveObject();
}

/**
 * 🔍 Tool: Advanced OCR with Progress
 */
export async function performOCR() {
    disableDrawingMode();
    const progressCont = document.getElementById('ocr-progress-container');
    const bar = document.getElementById('ocr-progress-bar');
    const status = document.getElementById('ocr-status-text');
    if (!progressCont || !elements.pdfCanvas) return;

    progressCont.style.display = 'block';

    try {
        const worker = await Tesseract.createWorker('eng+ara', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const p = Math.round(m.progress * 100);
                    bar.style.width = `${p}%`;
                    status.innerText = `Recognizing: ${p}%`;
                }
            }
        });

        const { data } = await worker.recognize(elements.pdfCanvas);
        data.words.forEach(w => {
            if (w.confidence < 60) return;
            elements.fabricCanvas.add(new fabric.Rect({
                left: w.bbox.x0, top: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0,
                fill: 'white', selectable: false
            }));
            elements.fabricCanvas.add(new fabric.IText(w.text, {
                left: w.bbox.x0, top: w.bbox.y0, fontSize: (w.bbox.y1 - w.bbox.y0) * 0.8, fontFamily: 'Arial'
            }));
        });
        await worker.terminate();
    } catch (e) { console.error(e); }
    finally {
        progressCont.style.display = 'none';
        elements.fabricCanvas.renderAll();
    }
}

/**
 * ✍️ Tool: Signature Pad Logic
 */
let sigPad, sigCtx, isDrawingSig = false;

export function initSignaturePad() {
    sigPad = document.getElementById('signature-pad');
    if (!sigPad) return;
    sigCtx = sigPad.getContext('2d');
    sigCtx.lineWidth = 2; sigCtx.lineCap = 'round'; sigCtx.strokeStyle = '#000';
    
    sigPad.onmousedown = (e) => { isDrawingSig = true; sigCtx.beginPath(); sigCtx.moveTo(e.offsetX, e.offsetY); };
    sigPad.onmousemove = (e) => { if (isDrawingSig) { sigCtx.lineTo(e.offsetX, e.offsetY); sigCtx.stroke(); } };
    sigPad.onmouseup = () => isDrawingSig = false;
}

export function openSignatureModal() {
    document.getElementById('signature-modal').style.display = 'flex';
    if (!sigPad) initSignaturePad();
    clearSignature(); 
}

export function closeSignatureModal() {
    const modal = document.getElementById('signature-modal');
    if (modal) modal.style.display = 'none';
}

export function clearSignature() {
    if (sigCtx) sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
}

export function saveSignature() {
    if (!sigPad) return;
    fabric.Image.fromURL(sigPad.toDataURL(), (img) => {
        img.set({ left: 100, top: 100 }).scaleToWidth(150);
        elements.fabricCanvas.add(img);
        closeSignatureModal();
    });
}
