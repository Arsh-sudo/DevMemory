import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Mock Memory State
let ingestionStatus: Record<string, { status: string; progress: number; datasets: any }> = {};
let mockGraph: any = null;
let currentSessionId = "";

const generateMockGraph = (repo: string) => {
  return {
    nodes: [
      { id: "repo", group: 1, label: repo, val: 20 },
      { id: "auth", group: 2, label: "AuthService", val: 15 },
      { id: "payment", group: 2, label: "Payment API", val: 15 },
      { id: "db", group: 2, label: "Database Layer", val: 15 },
      { id: "user1", group: 3, label: "alice@dev", val: 10 },
      { id: "user2", group: 3, label: "bob@dev", val: 10 },
      { id: "pr123", group: 4, label: "PR #123 (Auth Rewrite)", val: 10 },
      { id: "pr456", group: 4, label: "PR #456 (Stripe Mig)", val: 10 },
      { id: "commitA", group: 5, label: "Commit abc1234", val: 5 },
      { id: "commitB", group: 5, label: "Commit def5678", val: 5 },
    ],
    links: [
      { source: "repo", target: "auth" },
      { source: "repo", target: "payment" },
      { source: "repo", target: "db" },
      { source: "user1", target: "pr123", label: "authored" },
      { source: "user2", target: "pr456", label: "authored" },
      { source: "pr123", target: "auth", label: "modified" },
      { source: "pr456", target: "payment", label: "modified" },
      { source: "user1", target: "commitA", label: "authored" },
      { source: "commitA", target: "db", label: "modified" },
      { source: "commitB", target: "payment", label: "fixed" },
    ]
  };
};

app.post("/api/ingest", (req, res) => {
  const { repo_url } = req.body;
  const repoName = repo_url.split("/").pop()?.replace(".git", "") || "unknown-repo";
  const datasetId = `dataset_${Date.now()}`;
  
  ingestionStatus[datasetId] = { status: "ingesting", progress: 0, datasets: { commits: 0, prs: 0, docs: 0 } };
  
  // Simulate ingestion
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    ingestionStatus[datasetId].progress = progress;
    ingestionStatus[datasetId].datasets.commits += Math.floor(Math.random() * 50);
    ingestionStatus[datasetId].datasets.prs += Math.floor(Math.random() * 5);
    ingestionStatus[datasetId].datasets.docs += Math.floor(Math.random() * 2);

    if (progress >= 100) {
      ingestionStatus[datasetId].status = "completed";
      mockGraph = generateMockGraph(repoName);
      clearInterval(interval);
    }
  }, 1000);

  res.json({ dataset: datasetId, status: "ingesting", repoName });
});

app.get("/api/status/:datasetId", (req, res) => {
  const status = ingestionStatus[req.params.datasetId];
  if (!status) return res.status(404).json({ error: "Not found" });
  res.json(status);
});

app.post("/api/ask", async (req, res) => {
  const { question, repo, session_id } = req.body;
  currentSessionId = session_id;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ 
      answer: "I am running in mock mode because GEMINI_API_KEY is not set. Based on the graph, Bob modified the payment service recently.",
      sources: ["PR #456 (Stripe Mig)", "Commit def5678"]
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are DevMemory, an AI pair programmer answering a developer's question about their codebase.
      Here is the knowledge graph representation of the repository "${repo}":
      ${JSON.stringify(mockGraph)}

      User Question: "${question}"
      
      Respond directly and concisely to the developer. Mention specific nodes (like PRs, users, or modules) as your sources if relevant. Format your response in simple markdown.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      answer: response.text,
      sources: ["Graph DB Traversal", "Vector Search"]
    });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate answer." });
  }
});

app.post("/api/feedback", (req, res) => {
  // Mock improve() behavior
  res.json({ ok: true, message: "Graph reinforced via Cognee improve()" });
});

app.delete("/api/repo/:repo_name", (req, res) => {
  // Mock forget() behavior
  mockGraph = null;
  res.json({ forgotten: req.params.repo_name, message: "Dataset pruned via Cognee forget()" });
});

app.get("/api/graph", (req, res) => {
  res.json(mockGraph || { nodes: [], links: [] });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
