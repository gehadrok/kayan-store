export interface NormalizedDocument {
  documentId: string;
  type: string;
  metadata: Record<string, any>;
  pages?: number;
  sections?: any[];
  tables?: any[];
  sheets?: any[];
  text: string;
  base64Image?: string;
  mimeType?: string;
}
