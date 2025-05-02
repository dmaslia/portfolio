import { useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js";

export default function Resume() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
<div style={{ width: '100vw' }}>
  <div ref={containerRef} style={{ width: '100%' }}>
    <Document file="/Daniel_Maslia_Resume.pdf">
      <Page pageNumber={1} width={width} />
    </Document>
  </div>
</div>
  );
}
