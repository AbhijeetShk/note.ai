export interface RetrievalMetrics {
  retrieved: number;
  relevant: number;

  precision: number;
  recall: number;

  averageScore: number;
}
export interface ParentDocument {
  id: number;
  document_id: string;
  parent_index: number;
  content: string;
  metadata: Record<string, any>;
}