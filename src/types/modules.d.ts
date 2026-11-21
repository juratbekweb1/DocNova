declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  function PDFParse(
    dataBuffer: Buffer | Uint8Array,
    options?: {
      pagerender?: (pageData: unknown) => string | Promise<string>;
      max?: number;
      version?: string;
    }
  ): Promise<PDFData>;

  export default PDFParse;
}
