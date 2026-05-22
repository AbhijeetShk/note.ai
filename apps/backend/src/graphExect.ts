const PIPELINE_NODES = [
  { name: "classify", stateKey: "classification", label: "Classify" },
  { name: "do_research", stateKey: "research", label: "Research" },
  { name: "analyze", stateKey: "analysis", label: "Analyze" },
  { name: "synthesize", stateKey: "synthesis", label: "Synthesize" },
];

const PIPELINE_NODE_NAMES = new Set(PIPELINE_NODES.map((n) => n.name));



