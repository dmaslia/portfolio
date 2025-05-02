import { useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js";

export default function Resume() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const pdfUrl = '/Daniel_Maslia_Resume.pdf';

  const handleDownload = () => {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'resume.pdf';
      link.click();
  };

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: "100vw",
        maxWidth: "1000px",
        margin: "0 auto",
      }}>
      <button
          onClick={handleDownload}
          style={{
              position: 'absolute',
              top: '57px',
              right: '400px',
            zIndex: 10,
            fontSize: '10px',
              padding: '4px 4px',
              background: 'rgb(0, 0, 0)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
          }}
      >
        ⬇
      </button>
      <Document
        file="/Daniel_Maslia_Resume.pdf"
        loading={<div style={{ height: '1120px', backgroundColor: '#f7f5f2' }} />}
      >
        <Page pageNumber={1} width={containerWidth} />
      </Document>
    </div>
  );
}
