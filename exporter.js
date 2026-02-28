import { state, elements } from './state.js';
import { saveCurrentPageState } from './pdfViewer.js';

export async function exportPdf() {
    if (!state.originalPdfBytes) return;
    saveCurrentPageState();
    const { PDFDocument, degrees } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(state.originalPdfBytes);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (state.rotation !== 0) page.setRotation(degrees(state.rotation));
        if (state.fabricPages[i + 1]) {
            const { width, height } = page.getSize();
            const tempCanvas = document.createElement('canvas');
            const tempFabric = new fabric.StaticCanvas(tempCanvas);
            tempFabric.setWidth(width * 2); tempFabric.setHeight(height * 2);
            await new Promise(r => tempFabric.loadFromJSON(state.fabricPages[i + 1], r));
            const img = await pdfDoc.embedPng(tempFabric.toDataURL({ format: 'png', multiplier: 2 }));
            page.drawImage(img, { x: 0, y: 0, width, height });
        }
    }
    state.deletedPages.sort((a,b) => b-a).forEach(p => pdfDoc.removePage(p-1));
    download(await pdfDoc.save(), 'edited.pdf');
}

export async function extractCurrentPage() {
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(state.originalPdfBytes);
    const newDoc = await PDFDocument.create();
    const [page] = await newDoc.copyPages(pdfDoc, [state.pageNum - 1]);
    newDoc.addPage(page);
    download(await newDoc.save(), 'extracted.pdf');
}

export async function mergePdfs(files) {
    const { PDFDocument } = window.PDFLib;
    const newDoc = await PDFDocument.create();
    for (const f of files) {
        const doc = await PDFDocument.load(await f.arrayBuffer());
        const pages = await newDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => newDoc.addPage(p));
    }
    download(await newDoc.save(), 'merged.pdf');
}

function download(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
