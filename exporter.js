// exporter.js
import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    
    saveCurrentPageState();
    
    const exportBtn = document.getElementById('export-pdf');
    const originalText = exportBtn.innerText;
    exportBtn.innerText = "⏳ Saving...";
    exportBtn.disabled = true;

    try {
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

        const pagesToDelete = [...state.deletedPages].sort((a, b) => b - a);
        pagesToDelete.forEach(pageNum => {
            pdfDocExport.removePage(pageNum - 1);
        });

        const pdfBytes = await pdfDocExport.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'edited_document.pdf';
        link.click();
    } catch (err) {
        console.error("Export Error:", err);
    } finally {
        exportBtn.innerText = originalText;
        exportBtn.disabled = false;
    }
}

export async function mergePdfs(files) {
    if (!files || files.length === 0) return;
    
    const { PDFDocument } = window.PDFLib;
    const mergedPdf = await PDFDocument.create();

    try {
        for (let file of files) {
            const bytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(bytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'merged_document.pdf';
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error merging PDFs.");
    }
}

export async function extractCurrentPage() {
    if (!state.originalPdfBytes) {
        alert("Please open a PDF first.");
        return;
    }
    
    const extractBtn = document.getElementById('extract-page');
    const originalText = extractBtn.innerText;
    extractBtn.innerText = "⏳ Extracting...";
    extractBtn.disabled = true;

    try {
        const { PDFDocument } = window.PDFLib;
        const pdfDocLoad = await PDFDocument.load(state.originalPdfBytes);
        const newPdf = await PDFDocument.create();
        
        const [copiedPage] = await newPdf.copyPages(pdfDocLoad, [state.pageNum - 1]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `extracted_page_${state.pageNum}.pdf`;
        link.click();
    } catch (e) {
        console.error(e);
    } finally {
        extractBtn.innerText = originalText;
        extractBtn.disabled = false;
    }
}
