// app.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let originalPdfBytes = null;
const fabricPages = {}; 

const canvasWrapper = document.getElementById('canvas-wrapper');
const pdfCanvas = document.getElementById('pdf-canvas');
const ctx = pdfCanvas.getContext('2d');
const fabricCanvas = new fabric.Canvas('fabric-canvas');
fabricCanvas.freeDrawingBrush.color = "red";
fabricCanvas.freeDrawingBrush.width = 3;

document.getElementById('upload-pdf').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') return;
    
    originalPdfBytes = await file.arrayBuffer();
    pdfjsLib.getDocument(originalPdfBytes).promise.then(pdf => {
        pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdf.numPages;
        pageNum = 1;
        renderPage(pageNum);
    });
});

function saveCurrentPageState() {
    if (pdfDoc) {
        fabricPages[pageNum] = fabricCanvas.toJSON();
    }
}

function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        fabricCanvas.setWidth(viewport.width);
        fabricCanvas.setHeight(viewport.height);
        
        canvasWrapper.style.width = `${viewport.width}px`;
        canvasWrapper.style.height = `${viewport.height}px`;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        fabricCanvas.clear();
        if (fabricPages[num]) {
            fabricCanvas.loadFromJSON(fabricPages[num], fabricCanvas.renderAll.bind(fabricCanvas));
        }
    });

    document.getElementById('page-num').textContent = num;
}

function queueRenderPage(num) {
    saveCurrentPageState();
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
});

document.getElementById('add-text').addEventListener('click', () => {
    const text = new fabric.IText('Double click to edit', {
        left: 50,
        top: 50,
        fontFamily: 'Segoe UI',
        fill: '#000000',
        fontSize: 24,
        transparentCorners: false,
        cornerColor: 'blue'
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
});

document.getElementById('delete-selected').addEventListener('click', () => {
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        fabricCanvas.discardActiveObject();
        activeObjects.forEach(function(object) {
            fabricCanvas.remove(object);
        });
    }
});

let isDrawing = false;
document.getElementById('toggle-draw').addEventListener('click', (e) => {
    isDrawing = !isDrawing;
    fabricCanvas.isDrawingMode = isDrawing;
    e.target.style.backgroundColor = isDrawing ? '#e74c3c' : '#ecf0f1';
    e.target.style.color = isDrawing ? 'white' : '#2c3e50';
});

document.getElementById('export-pdf').addEventListener('click', async () => {
    if (!originalPdfBytes) return alert('Please upload a PDF first.');
    
    saveCurrentPageState();
    
    const { PDFDocument } = PDFLib;
    const pdfDocExport = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDocExport.getPages();

    const tempCanvasEl = document.createElement('canvas');
    const tempFabricCanvas = new fabric.StaticCanvas(tempCanvasEl);

    for (let i = 0; i < pages.length; i++) {
        const pageNumIter = i + 1;
        if (fabricPages[pageNumIter] && fabricPages[pageNumIter].objects.length > 0) {
            const page = pages[i];
            const { width, height } = page.getSize();
            
            tempFabricCanvas.setWidth(width * 1.5);
            tempFabricCanvas.setHeight(height * 1.5);
            
            await new Promise(resolve => {
                tempFabricCanvas.loadFromJSON(fabricPages[pageNumIter], () => {
                    tempFabricCanvas.renderAll();
                    resolve();
                });
            });

            const pngDataUrl = tempFabricCanvas.toDataURL({ format: 'png' });
            const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
            const pngImage = await pdfDocExport.embedPng(pngImageBytes);

            page.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }
    }

    const pdfBytes = await pdfDocExport.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'edited_document.pdf';
    link.click();
});
