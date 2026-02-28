// tools.js
import { elements } from './state.js';

export function disableDrawingMode() {
    elements.fabricCanvas.isDrawingMode = false;
    document.getElementById('toggle-draw').style.backgroundColor = '#ecf0f1';
    document.getElementById('toggle-draw').style.color = '#2c3e50';
    document.getElementById('whiteout-mode').style.backgroundColor = '#ecf0f1';
    document.getElementById('whiteout-mode').style.color = '#2c3e50';
}

export function enableCursorMode() {
    disableDrawingMode();
}

export function addText() {
    disableDrawingMode();
    const text = new fabric.IText('Double click to edit', {
        left: 50, top: 50, fontFamily: 'Segoe UI', fill: '#000000', fontSize: 24, transparentCorners: false, cornerColor: 'blue'
    });
    elements.fabricCanvas.add(text);
    elements.fabricCanvas.setActiveObject(text);
}

export function enableDrawMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "red";
    elements.fabricCanvas.freeDrawingBrush.width = 3;
    btnEvent.target.style.backgroundColor = '#e74c3c';
    btnEvent.target.style.color = 'white';
}

export function enableWhiteoutMode(btnEvent) {
    disableDrawingMode();
    elements.fabricCanvas.isDrawingMode = true;
    elements.fabricCanvas.freeDrawingBrush.color = "#ffffff"; 
    elements.fabricCanvas.freeDrawingBrush.width = 20; 
    btnEvent.target.style.backgroundColor = '#f1c40f';
    btnEvent.target.style.color = 'black';
}

export function deleteSelected() {
    const activeObjects = elements.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        elements.fabricCanvas.discardActiveObject();
        activeObjects.forEach(object => elements.fabricCanvas.remove(object));
    }
}
