import { RecursiveCharacterTextSplitter }
from "@langchain/textsplitters";

import {
  PARENT_SIZE,
  PARENT_OVERLAP,
} from "./constants.js";

export const parentSplitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: PARENT_SIZE,
    chunkOverlap: PARENT_OVERLAP,
  });