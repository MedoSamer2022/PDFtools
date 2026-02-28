// exporter.js
import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

/**
 * 💾 Export the full PDF with all Fabric.js overlays
 */
export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    saveCurrentPageState();

    const exportBtn = document.getElementById('export-pdf');
    if (exportBtn) exportBtn.innerText = "⏳ Saving...";

    try {
        const { PDFDocument, degrees } = window.PDFLib;
        const pdfDocExport = await PDFDocument.load(state.originalPdfBytes);
        const pages = pdfDocExport.getPages();

        for (let i = 0; i < pages.length; i++) {
            const pageNumIter = i + 1;
            const page = pages[i];

            if (state.rotation !== 0) {
                page.setRotation(degrees(state.rotation));
            }

            if (state.fabricPages[pageNumIter] && state.fabricPages[pageNumIter].objects.length > 0) {
                const { width, height } = page.getSize();
                const tempCanvas = document.createElement('canvas');
                const tempFabric = new fabric.StaticCanvas(tempCanvas);
                
                tempFabric.setWidth(width * 2); 
                tempFabric.setHeight(height * 2);

                await new Promise(r => tempFabric.loadFromJSON(state.fabricPages[pageNumIter], r));
                
                const pngImage = await pdfDocExport.embedPng(tempFabric.toDataURL({ format: 'png', multiplier: 2 }));
                page.drawImage(pngImage, { x: 0, y: 0, width: width, height: height });
            }
        }

        [...state.deletedPages].sort((a, b) => b - a).forEach(num => pdfDocExport.removePage(num - 1));

        const pdfBytes = await pdfDocExport.save();
        downloadBlob(pdfBytes, 'edited_pro.pdf', 'application/pdf');
    } catch (e) {
        console.error(e);
    } finally {
        if (exportBtn) exportBtn.innerText = "💾 Save & Download";
    }
}

/**
 * 🔗 Merge multiple PDFs
 */
export async function mergePdfs(files) {
    const { PDFDocument } = window.PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    downloadBlob(mergedBytes, 'merged.pdf', 'application/pdf');
}

/**
 * ✂️ Extract only the current page (The missing function)
 */
export async function extractCurrentPage() {
    if (!state.originalPdfBytes) return;
    
    try {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(state.originalPdfBytes);
        const singlePagePdf = await PDFDocument.create();
        
        // Copy only the current page (index starts at 0)
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [state.pageNum - 1]);
        singlePagePdf.addPage(copiedPage);

        const pdfBytes = await singlePagePdf.save();
        downloadBlob(pdfBytes, `extracted_page_${state.pageNum}.pdf`, 'application/pdf');
    } catch (e) {
        console.error("Extraction failed:", e);
    }
}

/**
 * Helper: Download helper
 */
function downloadBlob(data, fileName, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}
