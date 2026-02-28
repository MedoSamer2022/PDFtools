// main.js
import { initElements, elements } from './state.js';
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

    const safeAttach = (id, fn, eventType = 'onclick') => {
        const el = document.getElementById(id);
        if (el) el[eventType] = fn;
    };

    // Selection UI Sync
    elements.fabricCanvas.on('selection:created', syncTextToolbar);
    elements.fabricCanvas.on('selection:updated', syncTextToolbar);
    elements.fabricCanvas.on('selection:cleared', syncTextToolbar);

    // Tools & Toolbar
    safeAttach('font-family', (e) => updateTextProperty('fontFamily', e.target.value), 'onchange');
    safeAttach('font-size', (e) => updateTextProperty('fontSize', e.target.value), 'oninput');
    safeAttach('font-color', (e) => updateTextProperty('fill', e.target.value), 'oninput');
    safeAttach('font-bold', () => updateTextProperty('fontWeight'));
    safeAttach('font-italic', () => updateTextProperty('fontStyle'));
    safeAttach('brush-color', updateBrush, 'oninput');
    safeAttach('brush-size', updateBrush, 'oninput');

    // Sidebar
    safeAttach('upload-pdf', (e) => handlePdfUpload(e.target.files[0]), 'onchange');
    safeAttach('merge-pdfs', (e) => mergePdfs(e.target.files), 'onchange');
    safeAttach('extract-page', extractCurrentPage);
    safeAttach('cursor-mode', enableCursorMode);
    safeAttach('add-text', addText);
    safeAttach('add-rect', addRectangle);
    safeAttach('add-circle', addCircle);
    safeAttach('highlight-mode', enableHighlightMode);
    safeAttach('redact-mode', enableRedactionMode);
    safeAttach('toggle-draw', enableDrawMode);
    safeAttach('whiteout-mode', enableWhiteoutMode);
    safeAttach('delete-selected', deleteSelected);
    safeAttach('ocr-btn', performOCR);
    safeAttach('rotate-page', rotatePage);

    // Nav
    safeAttach('prev-page', prevPage);
    safeAttach('next-page', nextPage);
    safeAttach('zoom-in', zoomIn);
    safeAttach('zoom-out', zoomOut);
    safeAttach('remove-page', removeCurrentPage);

    // Sig & Export
    safeAttach('add-signature', openSignatureModal);
    safeAttach('save-sig', saveSignature);
    safeAttach('cancel-sig', closeSignatureModal);
    safeAttach('clear-sig', clearSignature);
    safeAttach('export-pdf', exportPdf);
});
