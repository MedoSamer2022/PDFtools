// tools.js (Shapes Section)

export function addRectangle() { 
    disableDrawingMode();
    const rect = new fabric.Rect({ 
        left: 100, 
        top: 100, 
        width: 150, 
        height: 100, 
        fill: 'transparent', 
        stroke: 'red', 
        strokeWidth: 2,
        cornerColor: '#3498db',
        transparentCorners: false
    });
    elements.fabricCanvas.add(rect);
    elements.fabricCanvas.setActiveObject(rect);
}

export function addCircle() { 
    disableDrawingMode();
    const circle = new fabric.Circle({ 
        left: 100, 
        top: 100, 
        radius: 50, 
        fill: 'transparent', 
        stroke: 'blue', 
        strokeWidth: 2,
        cornerColor: '#3498db',
        transparentCorners: false
    });
    elements.fabricCanvas.add(circle);
    elements.fabricCanvas.setActiveObject(circle);
}
