import asyncio
import os
import shutil
import time
import json
from pathlib import Path
from backend.scripts.extract_text import extract_text
from backend.scripts.chunk_text import chunk_text
from backend.scripts.analyze_chunks_async import analyze_chunks_async
from backend.scripts.clear_topics import clear_topics
from backend.scripts.merge_topics import merge_topics
from backend.scripts.assign_ids import assign_ids
from backend.scripts.build_connections import build_connections
from backend.scripts.add_fields import add_fields
from backend.scripts.generate_details import generate_details


BASE_DIR = Path(__file__).resolve().parent.parent
DOCUMENTS_DIR = BASE_DIR.parent / "documents"

def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


async def analyze_pdf(pdf_path: str):
    start_time = time.time()

    print(f"[analyze_pdf] Получен PDF: {pdf_path}")

    pdf_name = Path(pdf_path).stem
    print(f"[analyze_pdf] Имя файла: {pdf_name}")

    target_dir = DOCUMENTS_DIR / pdf_name
    index = 1

    while target_dir.exists():
        target_dir = DOCUMENTS_DIR / f"{pdf_name}_{index}"
        index += 1

    target_dir.mkdir()
    print(f"[analyze_pdf] Создана рабочая папка: {target_dir}")

    temp_dir = target_dir / "temp"
    temp_dir.mkdir()
    print(f"[analyze_pdf] Создана temp папка: {temp_dir}")

    original_pdf_path = target_dir / f"{pdf_name}_original.pdf"
    shutil.copy(pdf_path, original_pdf_path)
    print(f"[analyze_pdf] Оригинал PDF сохранён: {original_pdf_path}")

    working_pdf_path = target_dir / f"{pdf_name}.pdf"
    shutil.copy(pdf_path, working_pdf_path)
    print(f"[analyze_pdf] Рабочая копия PDF сохранена: {working_pdf_path}")

    print("[analyze_pdf] Начинаем полный анализ PDF...")

    # EXTRACT TEXT
    text = extract_text(str(working_pdf_path))
    (temp_dir / "extracted_text.txt").write_text(text, encoding="utf-8")
    print("[extract_text] Текст извлечён и сохранён")

    # CHUNK TEXT
    chunks = chunk_text(text, chunk_size=5000)
    write_json(temp_dir / "chunks.json", chunks)
    print(f"[chunk_text] Чанки созданы: {len(chunks)}")

    # ANALYZE CHUNKS
    print("[analyze_chunks] Запускаем асинхронный анализ чанков...")
    results = await analyze_chunks_async(chunks)
    write_json(temp_dir / "chunks_analyzed.json", results)

    # CLEAR TOPICS
    print("[analyze_chunks] Чистим топики...")
    cleaned_topics = clear_topics(results, temp_dir)
    write_json(temp_dir / "cleaned_topics.json", cleaned_topics)
    print("[analyze_chunks] Топики почищены...")

    # MERGE TOPICS
    print("[analyze_chunks] Merging topics(so there're a lil bit less of them)...")
    merged_topics = await merge_topics(cleaned_topics, temp_dir)
    write_json(temp_dir / "merged_topics.json", merged_topics)
    print("[analyze_chunks] Merging completed...")

    # ASSIGNING IDS
    print("[analyze_chunks] Assigning ids...")
    topics_with_ids = assign_ids(merged_topics, temp_dir)
    write_json(temp_dir / "topics_with_ids.json", topics_with_ids)
    print("[analyze_chunks] Ids have been assigned...")

    # GENERATING CONNECTIONS
    print("[analyze_chunks] Connecting topics...")
    edges = build_connections(topics_with_ids, temp_dir)
    write_json(temp_dir / "edges.json", edges)
    print("[analyze_chunks] Topics have been connected...")

    # ADDING FIELDS
    print("[analyze_chunks] Adding fields...")
    topics_with_fields = add_fields(topics_with_ids, temp_dir)
    write_json(temp_dir / "topics_with_fields.json", topics_with_fields)
    print("[analyze_chunks] Fields have been added...")

    # GENERATING DETAILS
    print("[analyze_chunks] Generating details...")
    topics_with_details = await generate_details(topics_with_fields, temp_dir)
    write_json(temp_dir / "topics_with_details.json", topics_with_details)
    print("[analyze_chunks] Details have been generated...")

    print("[analyze_chunks] Building final graph...")
    final_graph = {
        "topics": topics_with_details,
        "edges": edges
    }
    write_json(target_dir / "graph.json", final_graph)
    print(f"[analyze_chunks] Final graph saved to {target_dir / 'graph.json'}")

    elapsed = time.time() - start_time
    print(f"[analyze_pdf] Анализ завершён за {elapsed:.2f} секунд")

    return target_dir

if __name__ == "__main__":
    analyze_pdf("D:/Projects/LearnFlow/backend/byte_of_python.pdf")