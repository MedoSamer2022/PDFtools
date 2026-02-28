// pdfViewer.js
import { state, elements } from './state.js';

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

function updatePageCountDisplay() {
    if (!state.pdfDoc) return;
    document.getElementById('page-count').textContent = state.pdfDoc.numPages - state.deletedPages.length;
    let displayNum = state.pageNum;
    state.deletedPages.forEach(p => { if (p < state.pageNum) displayNum--; });
    document.getElementById('page-num').textContent = displayNum;
}

export async function handlePdfUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function() {
        state.originalPdfBytes = this.result;
        const pdf = await pdfjsLib.getDocument(new Uint8Array(state.originalPdfBytes)).promise;
        state.pdfDoc = pdf;
        state.pageNum = 1;
        state.fabricPages = {}; 
        state.deletedPages = [];
        state.zoomLevel = 1;
        state.rotation = 0; 
        renderPage(state.pageNum);
    };
    reader.readAsArrayBuffer(file);
}

export function saveCurrentPageState() {
    if (state.pdfDoc && elements.fabricCanvas) {
        state.fabricPages[state.pageNum] = elements.fabricCanvas.toJSON();
    }
}

export function renderPage(num) {
    if (state.pageRendering) { state.pageNumPending = num; return; }
    state.pageRendering = true;
    
    state.pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 * state.zoomLevel, rotation: state.rotation });
        elements.pdfCanvas.height = viewport.height;
        elements.pdfCanvas.width = viewport.width;
        elements.fabricCanvas.setWidth(viewport.width);
        elements.fabricCanvas.setHeight(viewport.height);
        elements.canvasWrapper.style.width = `${viewport.width}px`;
        elements.canvasWrapper.style.height = `${viewport.height}px`;

        if (state.renderTask) state.renderTask.cancel();
        state.renderTask = page.render({ canvasContext: elements.ctx, viewport: viewport });

        state.renderTask.promise.then(() => {
            state.pageRendering = false;
            updatePageCountDisplay();
            if (state.pageNumPending) {
                renderPage(state.pageNumPending);
                state.pageNumPending = null;
            }
        });

        elements.fabricCanvas.clear();
        if (state.fabricPages[num]) {
            elements.fabricCanvas.loadFromJSON(state.fabricPages[num], elements.fabricCanvas.renderAll.bind(elements.fabricCanvas));
        }
    });
}

export function rotatePage() {
    if (!state.pdfDoc) return;
    saveCurrentPageState();
    state.rotation = (state.rotation + 90) % 360;
    renderPage(state.pageNum);
}

export function prevPage() {
    if (state.pageNum <= 1) return;
    saveCurrentPageState();
    state.pageNum--;
    renderPage(state.pageNum);
}

export function nextPage() {
    if (state.pageNum >= state.pdfDoc.numPages) return;
    saveCurrentPageState();
    state.pageNum++;
    renderPage(state.pageNum);
}

export function removeCurrentPage() {
    if (!state.pdfDoc) return;
    state.deletedPages.push(state.pageNum);
    if (state.pageNum < state.pdfDoc.numPages) nextPage(); else prevPage();
}

export function zoomIn() { state.zoomLevel += 0.2; renderPage(state.pageNum); }
export function zoomOut() { if (state.zoomLevel > 0.4) { state.zoomLevel -= 0.2; renderPage(state.pageNum); } }
