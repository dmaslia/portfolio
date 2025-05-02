import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js';
export default function Resume() {
  return (
    <div>
      <Document file="/Daniel_Maslia_Resume.pdf">
        <Page pageNumber={1}       scale={1.7} />
      </Document>
    </div>
  );
}