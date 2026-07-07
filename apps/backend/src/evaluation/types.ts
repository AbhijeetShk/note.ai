export interface RetrievalGolden {
  query: string;
  expectedParentIds: number[];
  source: string;
  difficulty: "easy" | "medium" | "hard";
}