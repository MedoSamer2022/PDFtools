// main.js
import { elements, initElements } from './state.js';
import { handlePdfUpload, prevPage, nextPage, removeCurrentPage, zoomIn, zoomOut, rotatePage } from './pdfViewer.js';
import { 
    enableCursorMode, addText, addRectangle, addCircle,
    enableDrawMode, enableWhiteoutMode, enableHighlightMode, enableRedactionMode,
    deleteSelected, performOCR, updateBrush,
    openSignatureModal, closeSignatureModal, clearSignature, saveSignature,
    syncTextToolbar, updateTextProperty
} from './tools.js';
import { exportPdf, mergePdfs, extractCurrentPage } from './exporter.js';

document.addEventListener('DOMContentLoaded', () => {
    initElements();

    // Event Listeners for Fabric Selection
    elements.fabricCanvas.on('selection:created', syncTextToolbar);
    elements.fabricCanvas.on('selection:updated', syncTextToolbar);
    elements.fabricCanvas.on('selection:cleared', syncTextToolbar);

    // Text Toolbar
    document.getElementById('font-family').onchange = (e) => updateTextProperty('fontFamily', e.target.value);
    document.getElementById('font-size').oninput = (e) => updateTextProperty('fontSize', e.target.value);
    document.getElementById('font-color').oninput = (e) => updateTextProperty('fill', e.target.value);
    document.getElementById('font-bold').onclick = () => updateTextProperty('fontWeight');
    document.getElementById('font-italic').onclick = () => updateTextProperty('fontStyle');

    // Brush Toolbar
    document.getElementById('brush-color').oninput = updateBrush;
    document.getElementById('brush-size').oninput = updateBrush;

    // Sidebar Buttons
    document.getElementById('upload-pdf').onchange = (e) => handlePdfUpload(e.target.files[0]);
    document.getElementById('cursor-mode').onclick = enableCursorMode;
    document.getElementById('add-text').onclick = addText;
    document.getElementById('highlight-mode').onclick = enableHighlightMode;
    document.getElementById('redact-mode').onclick = enableRedactionMode;
    document.getElementById('toggle-draw').onclick = enableDrawMode;
    document.getElementById('whiteout-mode').onclick = enableWhiteoutMode;
    document.getElementById('add-rect').onclick = addRectangle;
    document.getElementById('add-circle').onclick = addCircle;
    document.getElementById('rotate-page').onclick = rotatePage;
    document.getElementById('delete-selected').onclick = deleteSelected;
    document.getElementById('ocr-btn').onclick = performOCR;

    // Page Navigation
    document.getElementById('prev-page').onclick = prevPage;
    document.getElementById('next-page').onclick = nextPage;
    document.getElementById('zoom-in').onclick = zoomIn;
    document.getElementById('zoom-out').onclick = zoomOut;
    document.getElementById('remove-page').onclick = removeCurrentPage;

    // Signature Modal
    document.getElementById('add-signature').onclick = openSignatureModal;
    document.getElementById('cancel-sig').onclick = closeSignatureModal;
    document.getElementById('clear-sig').onclick = clearSignature;
    document.getElementById('save-sig').onclick = saveSignature;

    // Export & Tools
    document.getElementById('export-pdf').onclick = exportPdf;
    document.getElementById('extract-page').onclick = extractCurrentPage;
    document.getElementById('merge-pdfs').onchange = (e) => mergePdfs(e.target.files);
});
