// pdfViewer.js
import { state, elements } from './state.js';

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export async function handlePdfUpload(file) {
    try {
        state.originalPdfBytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: state.originalPdfBytes }).promise;
        state.pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdf.numPages;
        state.pageNum = 1;
        state.fabricPages = {}; 
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
        
        elements.canvasWrapper.style.transform = `scale(${state.zoomLevel})`;
        elements.canvasWrapper.style.transformOrigin = 'top left';

        const renderContext = { canvasContext: elements.ctx, viewport: viewport };
        
        if (state.renderTask !== null) {
            state.renderTask.cancel();
        }

        state.renderTask = page.render(renderContext);

        state.renderTask.promise.then(() => {
            state.pageRendering = false;
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
    if (!state.pdfDoc || state.pageNum >= state.pdfDoc.numPages) return;
    state.pageNum++;
    queueRenderPage(state.pageNum);
}

export function zoomIn() {
    state.zoomLevel += 0.2;
    elements.canvasWrapper.style.transform = `scale(${state.zoomLevel})`;
}

export function zoomOut() {
    if (state.zoomLevel > 0.4) {
        state.zoomLevel -= 0.2;
        elements.canvasWrapper.style.transform = `scale(${state.zoomLevel})`;
    }
}
