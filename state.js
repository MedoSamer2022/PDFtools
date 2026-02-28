// state.js
export const state = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    originalPdfBytes: null,
    fabricPages: {},
    renderTask: null,
    zoomLevel: 1
};

export const elements = {};

export function initElements() {
    elements.canvasWrapper = document.getElementById('canvas-wrapper');
    elements.pdfCanvas = document.getElementById('pdf-canvas');
    elements.ctx = document.getElementById('pdf-canvas').getContext('2d');
    elements.fabricCanvas = new fabric.Canvas('fabric-canvas', {
        preserveObjectStacking: true
    });
}
