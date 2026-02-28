// main.js
import { initElements } from './state.js';
import { handlePdfUpload, prevPage, nextPage, removeCurrentPage, zoomIn, zoomOut, rotatePage } from './pdfViewer.js';
import { 
    enableCursorMode, addText, enableDrawMode, enableWhiteoutMode, enableHighlightMode, enableRedactionMode,
    deleteSelected, performOCR, updateBrush, openSignatureModal, closeSignatureModal, saveSignature 
} from './tools.js';
import { exportPdf } from './exporter.js';

document.addEventListener('DOMContentLoaded', () => {
    initElements();

    // File Upload
    document.getElementById('upload-pdf').onchange = (e) => handlePdfUpload(e.target.files[0]);

    // Rotation
    document.getElementById('rotate-page').onclick = rotatePage;

    // Standard Tools
    document.getElementById('cursor-mode').onclick = enableCursorMode;
    document.getElementById('add-text').onclick = addText;
    document.getElementById('highlight-mode').onclick = enableHighlightMode;
    document.getElementById('redact-mode').onclick = enableRedactionMode;
    document.getElementById('toggle-draw').onclick = enableDrawMode;
    document.getElementById('whiteout-mode').onclick = enableWhiteoutMode;
    document.getElementById('delete-selected').onclick = deleteSelected;
    document.getElementById('ocr-btn').onclick = performOCR;

    // Navigation
    document.getElementById('prev-page').onclick = prevPage;
    document.getElementById('next-page').onclick = nextPage;
    document.getElementById('zoom-in').onclick = zoomIn;
    document.getElementById('zoom-out').onclick = zoomOut;
    document.getElementById('remove-page').onclick = removeCurrentPage;

    // Signature
    document.getElementById('add-signature').onclick = openSignatureModal;
    document.getElementById('save-sig').onclick = saveSignature;
    document.getElementById('cancel-sig').onclick = closeSignatureModal;

    // Final Action
    document.getElementById('export-pdf').onclick = exportPdf;
});
