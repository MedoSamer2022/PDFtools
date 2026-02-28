// main.js
import { initElements } from './state.js';
import { handlePdfUpload, prevPage, nextPage, removeCurrentPage, zoomIn, zoomOut } from './pdfViewer.js';
import { enableCursorMode, addText, addImage, enableDrawMode, enableWhiteoutMode, deleteSelected, performOCR, openSignatureModal, closeSignatureModal, clearSignature, saveSignature } from './tools.js';
import { exportPdf, mergePdfs, extractCurrentPage } from './exporter.js';

document.addEventListener('DOMContentLoaded', () => {
    initElements();

    const uploadPdf = document.getElementById('upload-pdf');
    if (uploadPdf) {
        uploadPdf.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                handlePdfUpload(file);
            }
            e.target.value = ''; 
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

    const mergePdfsInput = document.getElementById('merge-pdfs');
    if (mergePdfsInput) {
        mergePdfsInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                mergePdfs(files);
            }
            e.target.value = '';
        });
    }

    document.getElementById('extract-page')?.addEventListener('click', extractCurrentPage);
    document.getElementById('prev-page')?.addEventListener('click', prevPage);
    document.getElementById('next-page')?.addEventListener('click', nextPage);
    document.getElementById('remove-page')?.addEventListener('click', removeCurrentPage);
    document.getElementById('zoom-in')?.addEventListener('click', zoomIn);
    document.getElementById('zoom-out')?.addEventListener('click', zoomOut);

    document.getElementById('cursor-mode')?.addEventListener('click', enableCursorMode);
    document.getElementById('add-text')?.addEventListener('click', addText);
    document.getElementById('toggle-draw')?.addEventListener('click', enableDrawMode);
    document.getElementById('whiteout-mode')?.addEventListener('click', enableWhiteoutMode);
    document.getElementById('delete-selected')?.addEventListener('click', deleteSelected);
    document.getElementById('ocr-btn')?.addEventListener('click', performOCR);

    document.getElementById('add-signature')?.addEventListener('click', openSignatureModal);
    document.getElementById('cancel-sig')?.addEventListener('click', closeSignatureModal);
    document.getElementById('clear-sig')?.addEventListener('click', clearSignature);
    document.getElementById('save-sig')?.addEventListener('click', saveSignature);

    document.getElementById('export-pdf')?.addEventListener('click', exportPdf);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                deleteSelected();
            }
        }
    });
});
