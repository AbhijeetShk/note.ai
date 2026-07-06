import { RecursiveCharacterTextSplitter }
from "@langchain/textsplitters";

import {
  CHILD_SIZE,
  CHILD_OVERLAP,
} from "./constants.js";

export const childSplitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: CHILD_SIZE,
    chunkOverlap: CHILD_OVERLAP,
  });