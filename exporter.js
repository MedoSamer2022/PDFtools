// exporter.js
import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

/**
 * 💾 Export the current PDF with all Fabric.js overlays
 */
export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    saveCurrentPageState();

    const exportBtn = document.getElementById('export-pdf');
    const originalText = exportBtn.innerText;
    exportBtn.innerText = "⏳ Saving...";
    exportBtn.disabled = true;

    try {
        const { PDFDocument, degrees } = window.PDFLib;
        const pdfDocExport = await PDFDocument.load(state.originalPdfBytes);
        const pages = pdfDocExport.getPages();

        for (let i = 0; i < pages.length; i++) {
            const pageNumIter = i + 1;
            const page = pages[i];

            // Apply global rotation
            if (state.rotation !== 0) {
                page.setRotation(degrees(state.rotation));
            }

            // If there are Fabric.js objects, flatten them onto the PDF
            if (state.fabricPages[pageNumIter] && state.fabricPages[pageNumIter].objects.length > 0) {
                const { width, height } = page.getSize();
                const tempCanvas = document.createElement('canvas');
                const tempFabric = new fabric.StaticCanvas(tempCanvas);
                
                // Set size to match PDF (at high resolution)
                tempFabric.setWidth(width * 2); 
                tempFabric.setHeight(height * 2);

                await new Promise(r => tempFabric.loadFromJSON(state.fabricPages[pageNumIter], r));
                
                const pngImage = await pdfDocExport.embedPng(tempFabric.toDataURL({ format: 'png', multiplier: 2 }));
                page.drawImage(pngImage, { x: 0, y: 0, width: width, height: height });
            }
        }

        // Remove deleted pages (in reverse order to keep indices correct)
        [...state.deletedPages].sort((a, b) => b - a).forEach(num => {
            pdfDocExport.removePage(num - 1);
        });

        const pdfBytes = await pdfDocExport.save();
        downloadBlob(pdfBytes, 'edited_document.pdf', 'application/pdf');
    } catch (e) {
        console.error("Export Error:", e);
        alert("Failed to export PDF.");
    } finally {
        exportBtn.innerText = originalText;
        exportBtn.disabled = false;
    }
}

/**
 * 🔗 Merge multiple PDF files into one
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
    downloadBlob(mergedBytes, 'merged_document.pdf', 'application/pdf');
}

/**
 * ✂️ Extract ONLY the current viewing page as a new PDF
 * Fixed: This is the function causing your error
 */
export async function extractCurrentPage() {
    if (!state.pdfDoc || !state.originalPdfBytes) return;
    
    try {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(state.originalPdfBytes);
        const singlePagePdf = await PDFDocument.create();
        
        // Copy only the current page (state.pageNum is 1-indexed)
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [state.pageNum - 1]);
        singlePagePdf.addPage(copiedPage);

        const pdfBytes = await singlePagePdf.save();
        downloadBlob(pdfBytes, `extracted_page_${state.pageNum}.pdf`, 'application/pdf');
    } catch (e) {
        console.error("Extraction Error:", e);
    }
}

/**
 * Helper: Download binary data as a file
 */
function downloadBlob(data, fileName, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
}
