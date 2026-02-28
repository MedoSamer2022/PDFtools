// exporter.js
import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    saveCurrentPageState();

    const exportBtn = document.getElementById('export-pdf');
    exportBtn.innerText = "⏳ Saving...";
    exportBtn.disabled = true;

    try {
        const { PDFDocument, degrees } = window.PDFLib;
        const pdfDocExport = await PDFDocument.load(state.originalPdfBytes);
        const pages = pdfDocExport.getPages();

        for (let i = 0; i < pages.length; i++) {
            const pageNumIter = i + 1;
            const page = pages[i];

            // Apply global rotation state if needed (or track per-page rotation if you prefer)
            if (state.rotation !== 0) {
                page.setRotation(degrees(state.rotation));
            }

            if (state.fabricPages[pageNumIter] && state.fabricPages[pageNumIter].objects.length > 0) {
                const { width, height } = page.getSize();
                const tempCanvas = document.createElement('canvas');
                const tempFabric = new fabric.StaticCanvas(tempCanvas);
                
                // Adjust canvas size based on rotation for overlay matching
                const isHorizontal = state.rotation % 180 !== 0;
                tempFabric.setWidth(isHorizontal ? height * 1.5 : width * 1.5);
                tempFabric.setHeight(isHorizontal ? width * 1.5 : height * 1.5);

                await new Promise(r => tempFabric.loadFromJSON(state.fabricPages[pageNumIter], r));
                
                const pngImage = await pdfDocExport.embedPng(tempFabric.toDataURL());
                page.drawImage(pngImage, { x: 0, y: 0, width: width, height: height });
            }
        }

        // Handle Deleted Pages
        [...state.deletedPages].sort((a, b) => b - a).forEach(num => pdfDocExport.removePage(num - 1));

        const pdfBytes = await pdfDocExport.save();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
        link.download = 'edited_pro.pdf';
        link.click();
    } catch (e) {
        console.error(e);
    } finally {
        exportBtn.innerText = "💾 Save & Download";
        exportBtn.disabled = false;
    }
}
