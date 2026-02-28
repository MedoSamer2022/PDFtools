// pdfViewer.js
import { state, elements } from './state.js';

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

function updatePageCountDisplay() {
    if (!state.pdfDoc) return;
    const activePages = state.pdfDoc.numPages - state.deletedPages.length;
    document.getElementById('page-count').textContent = activePages;
    
    let displayPageNum = state.pageNum;
    for (let i = 1; i <= state.pageNum; i++) {
        if (state.deletedPages.includes(i)) {
            displayPageNum--;
        }
    }
    document.getElementById('page-num').textContent = displayPageNum;
}

export async function handlePdfUpload(file) {
    try {
        state.originalPdfBytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: state.originalPdfBytes }).promise;
        state.pdfDoc = pdf;
        state.pageNum = 1;
        state.fabricPages = {}; 
        state.deletedPages = [];
        state.zoomLevel = 1; // Reset zoom on new file
        renderPage(state.pageNum);
    } catch (error) {
        console.error("Error loading PDF:", error);
    }
}

export function saveCurrentPageState() {
    if (state.pdfDoc && elements.fabricCanvas) {
        state.fabricPages[state.pageNum] = elements.fabricCanvas.toJSON();
    }
}

export function renderPage(num) {
    if (state.pageRendering) {
        state.pageNumPending = num;
        return;
    }

    state.pageRendering = true;
    
    state.pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        
        elements.pdfCanvas.height = viewport.height;
        elements.pdfCanvas.width = viewport.width;
        elements.fabricCanvas.setWidth(viewport.width);
        elements.fabricCanvas.setHeight(viewport.height);
        
        elements.canvasWrapper.style.width = `${viewport.width}px`;
        elements.canvasWrapper.style.height = `${viewport.height}px`;
        
        // استخدام خاصية zoom لضمان عمل أشرطة التمرير وتوافق إحداثيات الماوس
        elements.canvasWrapper.style.zoom = state.zoomLevel;

        const renderContext = { canvasContext: elements.ctx, viewport: viewport };
        
        if (state.renderTask !== null) {
            state.renderTask.cancel();
        }

        state.renderTask = page.render(renderContext);

        state.renderTask.promise.then(() => {
            state.pageRendering = false;
            updatePageCountDisplay();
            if (state.pageNumPending !== null) {
                renderPage(state.pageNumPending);
                state.pageNumPending = null;
            }
        }).catch(err => {
            state.pageRendering = false;
            if (err.name !== 'RenderingCancelledException') {
                console.error('Render error:', err);
            }
        });

        elements.fabricCanvas.clear();
        if (state.fabricPages[num]) {
            elements.fabricCanvas.loadFromJSON(state.fabricPages[num], elements.fabricCanvas.renderAll.bind(elements.fabricCanvas));
        }
    });
}

export function queueRenderPage(num) {
    saveCurrentPageState();
    if (state.pageRendering) {
        state.pageNumPending = num;
    } else {
        renderPage(num);
    }
}

export function prevPage() {
    let next = state.pageNum - 1;
    while (next > 0 && state.deletedPages.includes(next)) {
        next--;
    }
    if (next <= 0) return;
    state.pageNum = next;
    queueRenderPage(state.pageNum);
}

export function nextPage() {
    if (!state.pdfDoc) return;
    let next = state.pageNum + 1;
    while (next <= state.pdfDoc.numPages && state.deletedPages.includes(next)) {
        next++;
    }
    if (next > state.pdfDoc.numPages) return;
    state.pageNum = next;
    queueRenderPage(state.pageNum);
}

export function removeCurrentPage() {
    if (!state.pdfDoc) return;
    if (state.deletedPages.length >= state.pdfDoc.numPages - 1) {
        alert("Cannot delete the last remaining page.");
        return;
    }
    
    state.deletedPages.push(state.pageNum);
    
    let next = state.pageNum + 1;
    while (next <= state.pdfDoc.numPages && state.deletedPages.includes(next)) {
        next++;
    }
    
    if (next <= state.pdfDoc.numPages) {
        state.pageNum = next;
    } else {
        let prev = state.pageNum - 1;
        while (prev > 0 && state.deletedPages.includes(prev)) {
            prev--;
        }
        state.pageNum = prev;
    }
    
    queueRenderPage(state.pageNum);
}

export function zoomIn() {
    if (!state.pdfDoc) return;
    state.zoomLevel += 0.2;
    elements.canvasWrapper.style.zoom = state.zoomLevel;
}

export function zoomOut() {
    if (!state.pdfDoc) return;
    if (state.zoomLevel > 0.4) {
        state.zoomLevel -= 0.2;
        elements.canvasWrapper.style.zoom = state.zoomLevel;
    }
}
