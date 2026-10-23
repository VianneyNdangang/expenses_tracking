declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number]
    filename?: string
    image?: { type?: string; quality?: number }
    enableLinks?: boolean
    html2canvas?: Record<string, any>
    jsPDF?: Record<string, any>
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance
    from(element: HTMLElement | string): Html2PdfInstance
    save(): Promise<void>
    outputPdf(type?: string): Promise<any>
  }

  function html2pdf(): Html2PdfInstance
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Promise<void>

  export default html2pdf
}
