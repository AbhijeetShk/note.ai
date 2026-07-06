export interface RetrievalMetrics {
  retrieved: number;
  relevant: number;

  precision: number;
  recall: number;

  averageScore: number;
}