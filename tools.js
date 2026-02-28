// tools.js
import { elements } from './state.js';

/**
 * 🔒 Utility: Disable all drawing/brush modes
 */
export function disableDrawingMode() {
    if (!elements.fabricCanvas) return;
    elements.fabricCanvas.isDrawingMode = false;
    
    // Hide specialized toolbars
    const textToolbar = document.getElementById('text-toolbar');
    const brushToolbar = document.getElementById('brush-toolbar');
    if (textToolbar) textToolbar.style.display = 'none';
    if (brushToolbar) brushToolbar.style.display = 'none';
}

/**
 * 👆 Tool: Pointer/Select Mode
 */
export function enableCursorMode() {
    disableDrawingMode();
    elements.fabricCanvas.discardActiveObject();
    elements.fabricCanvas.renderAll();
}

/**
 * 📝 Tool: Add Editable Text
 */
export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fill: '#000000',
        fontSize: 24,
        cornerColor: '#3498db',
        transparentCorners: false
    });
    elements.fabricCanvas.add(text);
    elements.fabricCanvas.setActiveObject(text);
}

/**
 * 🎨 UI: Sync Text Toolbar with selected object
 */
export function syncTextToolbar() {
    const obj = elements.fabricCanvas.getActiveObject();
    const tb = document.getElementById('text-toolbar');
    if (obj && obj.type === 'i-text') {
        tb.style.display = 'flex';
        document.getElementById('font-family').value = obj.fontFamily || 'Arial';
        document.getElementById('font-size').value = obj.fontSize || 24;
        document.getElementById('font-color').value = obj.fill || '#000000';
    } else if (tb) {
        tb.style.display = 'none';
    }
}

/**
 * 🛠️ Action: Update Text Properties (Bold, Color, etc.)
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
    
    // Check if we are in highlight mode (requires transparency)
    const isHighlight = document.getElementById('highlight-mode')?.style.backgroundColor !== '';
    
    if (isHighlight && !color.includes('rgba')) {
        // Convert Hex to RGBA for transparency
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        elements.fabricCanvas.freeDrawingBrush.color = `rgba(${r}, ${g}, ${b}, 0.4)`;
    } else {
        elements.fabricCanvas.freeDrawingBrush.color = color;
    }
    elements.fabricCanvas.freeDrawingBrush.width = size;
}

/**
 * 🖍️ Tools: Drawing & Marking
 */
export function enableDrawMode() {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    document.getElementById('brush-toolbar').style.display = 'flex';
    updateBrush();
}

export function enableHighlightMode() {
    enableDrawMode();
    // Default highlight color (Yellow Transparent)
    document.getElementById('brush-color').value = '#ffff00';
    updateBrush();
}

export function enableWhiteoutMode() {
    enableDrawMode();
    document.getElementById('brush-color').value = '#ffffff';
    document.getElementById('brush-size').value = 30;
    updateBrush();
}

export function enableRedactionMode() {
    enableDrawMode();
    document.getElementById('brush-color').value = '#000000';
    updateBrush();
}

/**
 * 🟦 Tools: Shapes (The fix for your error)
 */
export function addRectangle() {
    disableDrawingMode();
    const rect = new fabric.Rect({
        left: 150, top: 150, width: 100, height: 60,
        fill: 'transparent', stroke: 'red', strokeWidth: 2,
        cornerColor: '#3498db', transparentCorners: false
    });
    elements.fabricCanvas.add(rect);
}

export function addCircle() {
    disableDrawingMode();
    const circle = new fabric.Circle({
        left: 150, top: 150, radius: 40,
        fill: 'transparent', stroke: 'blue', strokeWidth: 2,
        cornerColor: '#3498db', transparentCorners: false
    });
    elements.fabricCanvas.add(circle);
}

/**
 * 🗑️ Action: Delete Selection
 */
export function deleteSelected() {
    const activeObjects = elements.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        elements.fabricCanvas.discardActiveObject();
        activeObjects.forEach(obj => elements.fabricCanvas.remove(obj));
    }
}

/**
 * 🔍 Tool: Advanced OCR with Progress Bar
 */
export async function performOCR() {
    disableDrawingMode();
    const progressCont = document.getElementById('ocr-progress-container');
    const bar = document.getElementById('ocr-progress-bar');
    const statusText = document.getElementById('ocr-status-text');

    if (!progressCont || !elements.pdfCanvas) return;
    
    progressCont.style.display = 'block';

    try {
        const worker = await Tesseract.createWorker('eng+ara', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const p = Math.round(m.progress * 100);
                    bar.style.width = `${p}%`;
                    statusText.innerText = `Recognizing: ${p}%`;
                } else {
                    statusText.innerText = m.status;
                }
            }
        });

        const { data } = await worker.recognize(elements.pdfCanvas);

        data.words.forEach(w => {
            if (w.confidence < 60) return;
            // Whiteout original text
            elements.fabricCanvas.add(new fabric.Rect({
                left: w.bbox.x0, top: w.bbox.y0,
                width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0,
                fill: 'white', selectable: false
            }));
            // Add editable layer
            elements.fabricCanvas.add(new fabric.IText(w.text, {
                left: w.bbox.x0, top: w.bbox.y0,
                fontSize: (w.bbox.y1 - w.bbox.y0) * 0.8,
                fontFamily: 'Arial'
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
 * ✍️ Tool: Signature Logic
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

export function closeSignatureModal() { document.getElementById('signature-modal').style.display = 'none'; }
export function clearSignature() { if (sigCtx) sigCtx.clearRect(0, 0, sigPad.width, sigPad.height); }

export function saveSignature() {
    if (!sigPad) return;
    fabric.Image.fromURL(sigPad.toDataURL(), (img) => {
        img.set({ left: 100, top: 100 }).scaleToWidth(150);
        elements.fabricCanvas.add(img);
        closeSignatureModal();
    });
}
