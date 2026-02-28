// main.js
import { handlePdfUpload, prevPage, nextPage } from './pdfViewer.js';
import { enableCursorMode, addText, addImage, enableDrawMode, enableWhiteoutMode, deleteSelected } from './tools.js';
import { exportPdf } from './exporter.js';

const uploadPdf = document.getElementById('upload-pdf');
if (uploadPdf) {
    uploadPdf.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            handlePdfUpload(file);
        }
    });
}

const uploadImage = document.getElementById('upload-image');
if (uploadImage) {
    uploadImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            addImage(file);
        }
        e.target.value = ''; 
    });
}

document.getElementById('prev-page')?.addEventListener('click', prevPage);
document.getElementById('next-page')?.addEventListener('click', nextPage);

document.getElementById('cursor-mode')?.addEventListener('click', enableCursorMode);
document.getElementById('add-text')?.addEventListener('click', addText);
document.getElementById('toggle-draw')?.addEventListener('click', enableDrawMode);
document.getElementById('whiteout-mode')?.addEventListener('click', enableWhiteoutMode);
document.getElementById('delete-selected')?.addEventListener('click', deleteSelected);

document.getElementById('export-pdf')?.addEventListener('click', exportPdf);
// main.js
import { performOCR } from './tools.js';

document.getElementById('ocr-btn')?.addEventListener('click', performOCR);
