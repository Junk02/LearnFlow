from fastapi import FastAPI
import json
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/graph")
def get_graph():
    topics = json.loads(Path("backend/scripts/topics_with_details.json").read_text())
    edges = json.loads(Path("backend/scripts/topic_connections.json").read_text())

    return {
        "nodes": topics,
        "edges": edges
    }
