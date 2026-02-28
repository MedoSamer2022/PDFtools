// state.js
export const state = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    originalPdfBytes: null,
    fabricPages: {},
    renderTask: null,
    zoomLevel: 1,
    rotation: 0,
    deletedPages: []
};

// Fixed: Added 'export' here
export const elements = {};

export function initElements() {
    elements.canvasWrapper = document.getElementById('canvas-wrapper');
    elements.pdfCanvas = document.getElementById('pdf-canvas');
    if (elements.pdfCanvas) {
        elements.ctx = elements.pdfCanvas.getContext('2d');
    }
    
    // Initialize Fabric Canvas
    elements.fabricCanvas = new fabric.Canvas('fabric-canvas', {
        preserveObjectStacking: true,
        allowTouchScrolling: true
    });
}
