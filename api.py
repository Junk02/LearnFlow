from cryptography.hazmat.backends.openssl import backend
from fastapi import FastAPI, UploadFile, File
import json
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from backend.scripts.analyze_pdf import analyze_pdf
from concurrent.futures import ThreadPoolExecutor


app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
DOCUMENTS_DIR = BASE_DIR / "documents"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=1)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    return {"status": "ok", "doc_name": 'byte_of_python_5'}

    pdf_path = Path("uploaded.pdf")
    pdf_path.write_bytes(await file.read())

    loop = asyncio.get_running_loop()

    result_dir = await loop.run_in_executor(
        executor,
        lambda: asyncio.run(analyze_pdf(str(pdf_path)))
    )

    return {"status": "ok", "doc_name": result_dir.name}


@app.get("/graph/{doc_name}")
def get_graph(doc_name: str):
    doc_dir = DOCUMENTS_DIR / doc_name
    graph_file = doc_dir / "graph.json"

    if not graph_file.exists():
        return {"error": "Graph not found"}

    graph = json.loads(graph_file.read_text(encoding="utf-8"))
    return graph