// exporter.js
import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    
    saveCurrentPageState();
    const { PDFDocument } = window.PDFLib;
    const pdfDocExport = await PDFDocument.load(state.originalPdfBytes);
    const pages = pdfDocExport.getPages();
    const tempCanvasEl = document.createElement('canvas');
    const tempFabricCanvas = new fabric.StaticCanvas(tempCanvasEl);

    for (let i = 0; i < pages.length; i++) {
        const pageNumIter = i + 1;
        if (state.fabricPages[pageNumIter] && state.fabricPages[pageNumIter].objects.length > 0) {
            const page = pages[i];
            const { width, height } = page.getSize();
            tempFabricCanvas.setWidth(width * 1.5);
            tempFabricCanvas.setHeight(height * 1.5);
            
            await new Promise(resolve => {
                tempFabricCanvas.loadFromJSON(state.fabricPages[pageNumIter], () => {
                    tempFabricCanvas.renderAll();
                    resolve();
                });
            });

            const pngDataUrl = tempFabricCanvas.toDataURL({ format: 'png' });
            const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
            const pngImage = await pdfDocExport.embedPng(pngImageBytes);

            page.drawImage(pngImage, { x: 0, y: 0, width: width, height: height });
        }
    }

    const pdfBytes = await pdfDocExport.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'edited_document.pdf';
    link.click();
}
