// app.js
const uploadPdf = document.getElementById('upload-pdf');
const addTextBtn = document.getElementById('add-text');
const exportPdfBtn = document.getElementById('export-pdf');

let pdfDoc = null;
let pageNum = 1;
let canvas = new fabric.Canvas('fabric-canvas');
let pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

uploadPdf.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') return;

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            pdfDoc = pdf;
            renderPage(pageNum);
        });
    };
    fileReader.readAsArrayBuffer(file);
});

function renderPage(num) {
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        const pdfCanvas = document.getElementById('pdf-canvas');
        const ctx = pdfCanvas.getContext('2d');
        
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        
        canvas.setWidth(viewport.width);
        canvas.setHeight(viewport.height);

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext);
    });
}

addTextBtn.addEventListener('click', () => {
    const text = new fabric.IText('Enter text here', {
        left: 50,
        top: 50,
        fontFamily: 'Arial',
        fill: '#000',
        fontSize: 20
    });
    canvas.add(text);
});
