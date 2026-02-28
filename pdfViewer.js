// pdfViewer.js
import { state, elements } from './state.js';

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export async function handlePdfUpload(file) {
    state.originalPdfBytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(state.originalPdfBytes).promise;
    state.pdfDoc = pdf;
    document.getElementById('page-count').textContent = pdf.numPages;
    state.pageNum = 1;
    renderPage(state.pageNum);
}

export function saveCurrentPageState() {
    if (state.pdfDoc) {
        state.fabricPages[state.pageNum] = elements.fabricCanvas.toJSON();
    }
}

export function renderPage(num) {
    state.pageRendering = true;
    state.pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        
        elements.pdfCanvas.height = viewport.height;
        elements.pdfCanvas.width = viewport.width;
        elements.fabricCanvas.setWidth(viewport.width);
        elements.fabricCanvas.setHeight(viewport.height);
        
        elements.canvasWrapper.style.width = `${viewport.width}px`;
        elements.canvasWrapper.style.height = `${viewport.height}px`;

        const renderContext = { canvasContext: elements.ctx, viewport: viewport };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            state.pageRendering = false;
            if (state.pageNumPending !== null) {
                renderPage(state.pageNumPending);
                state.pageNumPending = null;
            }
        });

        elements.fabricCanvas.clear();
        if (state.fabricPages[num]) {
            elements.fabricCanvas.loadFromJSON(state.fabricPages[num], elements.fabricCanvas.renderAll.bind(elements.fabricCanvas));
        }
    });

    document.getElementById('page-num').textContent = num;
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
    if (state.pageNum <= 1) return;
    state.pageNum--;
    queueRenderPage(state.pageNum);
}

export function nextPage() {
    if (state.pageNum >= state.pdfDoc.numPages) return;
    state.pageNum++;
    queueRenderPage(state.pageNum);
}
