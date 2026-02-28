// state.js
export function initElements() {
    elements.canvasWrapper = document.getElementById('canvas-wrapper');
    elements.pdfCanvas = document.getElementById('pdf-canvas');
    elements.ctx = elements.pdfCanvas.getContext('2d');
    
    // Fix for the scroll-blocking 'wheel' violation
    elements.fabricCanvas = new fabric.Canvas('fabric-canvas', {
        preserveObjectStacking: true,
        allowTouchScrolling: true, // Helps with mobile/touch
        enableRetinaScaling: true
    });

    // Explicitly handle the wheel event if you want to fix the violation warning
    elements.fabricCanvas.on('mouse:wheel', function(opt) {
        // Your zoom logic here if you want mouse-wheel zoom
    });
}
