import { useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Download } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js";

export default function Resume() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const pdfUrl = "/Daniel_Maslia_Resume.pdf";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "resume.pdf";
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
  const aspectRatio = 1.294; // 11in / 8.5in
  const scaledHeight = containerWidth * aspectRatio;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100vw",
        maxWidth: "1000px",
        margin: "0 auto",
      }}>
            <button
        onClick={handleDownload}
        style={{
          position: "absolute",
          top: `${scaledHeight * 0.0453}px`,
          left: `${containerWidth * 0.583}px`,
          zIndex: 10,
          background: "#000",
          color: "white",
          border: "none",
          borderRadius: "0px", // square corners (or use "50%" for circle)
          cursor: "pointer",
          width: `${containerWidth * 0.02}px`,     // set fixed square size
          height: `${containerWidth * 0.02}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <Download size={containerWidth * 0.012} />
      </button>
      <Document
        file="/Daniel_Maslia_Resume.pdf"
        loading={
          <div style={{ height: "1120px", backgroundColor: "#f7f5f2" }} />
        }>
        <Page pageNumber={1} width={containerWidth} />
      </Document>
    </div>
  );
}
