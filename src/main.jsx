import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Resume from './Resume.jsx'
import './index.css'
import ReactPDF from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Resume/>
  </StrictMode>,
)
