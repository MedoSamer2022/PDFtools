import { elements } from './state.js';

export function disableDrawingMode() {
    elements.fabricCanvas.isDrawingMode = false;
    document.getElementById('text-toolbar').style.display = 'none';
    document.getElementById('brush-toolbar').style.display = 'none';
}

export function enableCursorMode() { disableDrawingMode(); }

export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Type here', { left: 100, top: 100, fontSize: 24, fontFamily: 'Arial' });
    elements.fabricCanvas.add(text).setActiveObject(text);
}

export function syncTextToolbar() {
    const obj = elements.fabricCanvas.getActiveObject();
    const tb = document.getElementById('text-toolbar');
    if (obj && obj.type === 'i-text') {
        tb.style.display = 'flex';
        document.getElementById('font-family').value = obj.fontFamily;
        document.getElementById('font-size').value = obj.fontSize;
        document.getElementById('font-color').value = obj.fill;
    } else { tb.style.display = 'none'; }
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

export function updateBrush() {
    const color = document.getElementById('brush-color').value;
    const size = parseInt(document.getElementById('brush-size').value);
    elements.fabricCanvas.freeDrawingBrush.color = color;
    elements.fabricCanvas.freeDrawingBrush.width = size;
}

export function enableDrawMode() { disableDrawingMode(); elements.fabricCanvas.isDrawingMode = true; document.getElementById('brush-toolbar').style.display = 'flex'; updateBrush(); }

export function enableHighlightMode() {
    enableDrawMode();
    const color = document.getElementById('brush-color').value;
    elements.fabricCanvas.freeDrawingBrush.color = color.startsWith('rgba') ? color : 'rgba(255, 255, 0, 0.4)';
}

export function enableWhiteoutMode() { enableDrawMode(); elements.fabricCanvas.freeDrawingBrush.color = '#ffffff'; elements.fabricCanvas.freeDrawingBrush.width = 30; }
export function enableRedactionMode() { enableDrawMode(); elements.fabricCanvas.freeDrawingBrush.color = '#000000'; }

export function addRectangle() { elements.fabricCanvas.add(new fabric.Rect({ left: 100, top: 100, width: 100, height: 60, fill: 'transparent', stroke: 'red', strokeWidth: 2 })); }
export function addCircle() { elements.fabricCanvas.add(new fabric.Circle({ left: 100, top: 100, radius: 40, fill: 'transparent', stroke: 'blue', strokeWidth: 2 })); }
export function deleteSelected() { elements.fabricCanvas.getActiveObjects().forEach(o => elements.fabricCanvas.remove(o)); elements.fabricCanvas.discardActiveObject(); }

export async function performOCR() {
    const progressCont = document.getElementById('ocr-progress-container');
    const bar = document.getElementById('ocr-progress-bar');
    const status = document.getElementById('ocr-status-text');
    progressCont.style.display = 'block';

    const worker = await Tesseract.createWorker('eng+ara', 1, {
        logger: m => {
            if (m.status === 'recognizing text') {
                const p = Math.round(m.progress * 100);
                bar.style.width = `${p}%`;
                status.innerText = `Recognizing: ${p}%`;
            } else { status.innerText = m.status; }
        }
    });

    const { data } = await worker.recognize(elements.pdfCanvas);
    data.words.forEach(w => {
        if (w.confidence < 60) return;
        elements.fabricCanvas.add(new fabric.Rect({ left: w.bbox.x0, top: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0, fill: 'white', selectable: false }));
        elements.fabricCanvas.add(new fabric.IText(w.text, { left: w.bbox.x0, top: w.bbox.y0, fontSize: (w.bbox.y1 - w.bbox.y0) * 0.8, fontFamily: 'Arial' }));
    });
    await worker.terminate();
    progressCont.style.display = 'none';
}

let sigPad, sigCtx, isDrawingSig = false;
export function initSignaturePad() {
    sigPad = document.getElementById('signature-pad'); sigCtx = sigPad.getContext('2d');
    sigCtx.lineWidth = 2; sigCtx.lineCap = 'round';
    sigPad.onmousedown = (e) => { isDrawingSig = true; sigCtx.beginPath(); sigCtx.moveTo(e.offsetX, e.offsetY); };
    sigPad.onmousemove = (e) => { if (isDrawingSig) { sigCtx.lineTo(e.offsetX, e.offsetY); sigCtx.stroke(); } };
    sigPad.onmouseup = () => isDrawingSig = false;
}
export function openSignatureModal() { document.getElementById('signature-modal').style.display = 'flex'; if (!sigPad) initSignaturePad(); clearSignature(); }
export function closeSignatureModal() { document.getElementById('signature-modal').style.display = 'none'; }
export function clearSignature() { sigCtx.clearRect(0, 0, sigPad.width, sigPad.height); }
export function saveSignature() { fabric.Image.fromURL(sigPad.toDataURL(), (img) => { img.set({ left: 100, top: 100 }).scaleToWidth(150); elements.fabricCanvas.add(img); closeSignatureModal(); }); }
