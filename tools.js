// tools.js
import { elements } from './state.js';

export async function performAdvancedAI_OCR() {
    disableDrawingMode();
    const progressCont = document.getElementById('ocr-progress-container');
    const statusText = document.getElementById('ocr-status-text');
    
    progressCont.style.display = 'block';
    statusText.innerText = "Running Deep Learning Models...";

    try {
        // 1. Initialize the Engine (Runs locally on your Mac M2 GPU)
        const engine = await RapidOCR.create({
            detModel: 'ch_PP-OCRv3_det_infer.onnx', // Detection Model
            recModel: 'ch_PP-OCRv3_rec_infer.onnx', // Recognition Model
            dict: 'arabic_dict.txt'                 // Supports your Arabic docs
        });

        // 2. Process the Canvas
        const result = await engine.ocr(elements.pdfCanvas);

        // 3. Adobe-Style Reconstruction
        result.forEach(item => {
            const [box, [text, confidence]] = item;
            
            // Calculate Box Coordinates
            const x = box[0][0];
            const y = box[0][1];
            const w = box[1][0] - x;
            const h = box[2][1] - y;

            if (confidence < 0.5) return;

            // Step A: Whiteout the original "image" text
            elements.fabricCanvas.add(new fabric.Rect({
                left: x, top: y, width: w, height: h,
                fill: 'white', selectable: false
            }));

            // Step B: Add the smart editable layer
            const editableText = new fabric.IText(text, {
                left: x,
                top: y,
                fontSize: h * 0.8,
                fontFamily: 'Arial',
                fill: '#000',
                // Keep the exact orientation
                angle: calculateAngle(box) 
            });
            
            elements.fabricCanvas.add(editableText);
        });

    } catch (e) {
        console.error("AI OCR Failed:", e);
    } finally {
        progressCont.style.display = 'none';
        elements.fabricCanvas.renderAll();
    }
}
export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fill: '#000000',
        fontSize: 24,
        cornerColor: '#3498db',
        transparentCorners: false
    });
    elements.fabricCanvas.add(text);
    elements.fabricCanvas.setActiveObject(text);
}
// Helper to handle crooked/rotated scans
function calculateAngle(box) {
    const dy = box[1][1] - box[0][1];
    const dx = box[1][0] - box[0][0];
    return Math.atan2(dy, dx) * (180 / Math.PI);
}
export function addRectangle() { 
    disableDrawingMode();
    const rect = new fabric.Rect({ 
        left: 150, top: 150, width: 100, height: 60, 
        fill: 'transparent', stroke: 'red', strokeWidth: 2,
        cornerColor: '#3498db', transparentCorners: false
    });
    elements.fabricCanvas.add(rect);
    elements.fabricCanvas.setActiveObject(rect);
}
export function addCircle() { 
    disableDrawingMode();
    const circle = new fabric.Circle({ 
        left: 150, top: 150, radius: 40, 
        fill: 'transparent', stroke: 'blue', strokeWidth: 2,
        cornerColor: '#3498db', transparentCorners: false
    });
    elements.fabricCanvas.add(circle);
    elements.fabricCanvas.setActiveObject(circle);
}
