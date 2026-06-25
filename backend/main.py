import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cognee
from github import Github

app = FastAPI(title="DevMemory API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IngestRequest(BaseModel):
    repo_url: str
    github_token: str

class AskRequest(BaseModel):
    question: str
    repo: str
    session_id: str

class FeedbackRequest(BaseModel):
    question: str
    helpful: bool
    dataset: str

@app.on_event("startup")
async def startup_event():
    # Connect to Cognee Cloud if configured, else OSS mode
    cloud_url = os.getenv("COGNEE_CLOUD_API_URL")
    cloud_token = os.getenv("COGNEE_CLOUD_AUTH_TOKEN")
    if cloud_url and cloud_token:
        print(f"Connecting to Cognee Cloud at {cloud_url}")
        await cognee.serve(url=cloud_url, api_key=cloud_token)
    else:
        print("Using local OSS Cognee engine")

@app.post("/api/ingest")
async def ingest(req: IngestRequest):
    try:
        g = Github(req.github_token)
        repo_name = req.repo_url.replace("https://github.com/", "").replace(".git", "")
        repo = g.get_repo(repo_name)
        dataset_name = f"repo_{repo.name}"

        # Ingest the last 100 commits
        commits = repo.get_commits()
        for i, commit in enumerate(commits):
            if i >= 100:
                break
            author_name = commit.commit.author.name if commit.commit.author else "Unknown"
            await cognee.remember(
                f"Commit {commit.sha[:7]} by {author_name}: {commit.commit.message}",
                dataset_name=dataset_name
            )

        # Ingest the last 50 PRs
        prs = repo.get_pulls(state='all')
        for i, pr in enumerate(prs):
            if i >= 50:
                break
            await cognee.remember(
                f"PR #{pr.number} '{pr.title}': {pr.body or ''}\nMerged: {pr.merged}.",
                dataset_name=dataset_name
            )

        # Get status
        result = await cognee.datasets.get_status([dataset_name])
        return {"dataset": dataset_name, "status": "completed", "repoName": repo.name}
    except Exception as e:
        print(f"Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{dataset_id}")
async def status(dataset_id: str):
    # Cognee native status
    result = await cognee.datasets.get_status([dataset_id])
    return {"status": result, "progress": 100, "datasets": {"commits": 100, "prs": 50, "docs": 0}}

@app.post("/api/ask")
async def ask(req: AskRequest):
    try:
        results = await cognee.recall(
            query_text=req.question,
            datasets=[f"repo_{req.repo}"],
            session_id=req.session_id
        )
        
        # Format results
        if not results:
             return {"answer": "I don't have enough information in my memory graph to answer this yet.", "sources": []}
             
        answer = "\n\n".join([r.get("text", str(r)) for r in results[:5]])
        sources = [r.get("source", "Knowledge Graph") for r in results[:5]]
        return {"answer": answer, "sources": sources}
    except Exception as e:
        print(f"Recall error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph")
async def get_graph(dataset: str = None):
    try:
        # Cognee has a built-in visualize API, returning nodes/links
        if not dataset:
            # For hackathon demo, mock standard view if no dataset provided
            return {"nodes": [], "links": []}
            
        graph_data = await cognee.visualize(datasets=[dataset])
        return graph_data
    except Exception as e:
        print(f"Visualize error: {e}")
        return {"nodes": [], "links": []}

@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    try:
        if req.helpful:
            await cognee.improve(datasets=[req.dataset])
        return {"ok": True}
    except Exception as e:
        print(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/repo/{repo_name}")
async def forget_repo(repo_name: str):
    try:
        await cognee.forget(dataset=f"repo_{repo_name}")
        return {"forgotten": repo_name}
    except Exception as e:
        print(f"Forget error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
