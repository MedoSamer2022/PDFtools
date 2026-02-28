// main.js
document.addEventListener('DOMContentLoaded', () => {
    initElements();

    // Helper to safely attach events
    const attach = (id, fn, event = 'onclick') => {
        const el = document.getElementById(id);
        if (el) el[event] = fn;
        else console.warn(`Element with ID "${id}" was not found in HTML.`);
    };

    // File Uploads
    attach('upload-pdf', (e) => handlePdfUpload(e.target.files[0]), 'onchange');
    attach('merge-pdfs', (e) => mergePdfs(e.target.files), 'onchange');

    // Sidebar Tools
    attach('rotate-page', rotatePage);
    attach('cursor-mode', enableCursorMode);
    attach('add-text', addText);
    attach('highlight-mode', enableHighlightMode);
    attach('redact-mode', enableRedactionMode);
    attach('toggle-draw', enableDrawMode);
    attach('whiteout-mode', enableWhiteoutMode);
    attach('delete-selected', deleteSelected);
    attach('ocr-btn', performOCR);

    // Navigation & Zoom
    attach('prev-page', prevPage);
    attach('next-page', nextPage);
    attach('zoom-in', zoomIn);
    attach('zoom-out', zoomOut);
    attach('remove-page', removeCurrentPage);

    // Signature Modal
    attach('add-signature', openSignatureModal);
    attach('save-sig', saveSignature);
    attach('cancel-sig', closeSignatureModal);

    // Export & Extraction
    attach('export-pdf', exportPdf);
    attach('extract-page', extractCurrentPage);
});
