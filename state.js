// state.js
export const state = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    originalPdfBytes: null,
    fabricPages: {}
};

export const elements = {
    canvasWrapper: document.getElementById('canvas-wrapper'),
    pdfCanvas: document.getElementById('pdf-canvas'),
    ctx: document.getElementById('pdf-canvas').getContext('2d'),
    fabricCanvas: new fabric.Canvas('fabric-canvas')
};
