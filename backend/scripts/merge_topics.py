import json
import asyncio
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY"),
)

PARALLEL = 3
SEM = asyncio.Semaphore(PARALLEL)


def auto_chunk_size(n):
    if n > 80:
        return 10
    elif n > 40:
        return 8
    elif n > 20:
        return 5
    else:
        return n


def auto_target_per_chunk(n):
    if n > 80:
        return 3
    elif n > 40:
        return 4
    elif n > 20:
        return 5
    else:
        return n


def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def merge_chunk_sync(chunk, target_count):
    prompt = f"""
You are an AI that merges similar textbook topics.

INPUT:
A JSON array of topic objects. Each object has:
- name
- description
- keywords
- context

TASK:
1. Merge similar topics.
2. Preserve all important information.
3. Do NOT remove unique topics.
4. Do NOT change JSON structure.
5. Do NOT rename keys.
6. Do NOT add new keys.
7. Output {target_count} merged topics.

OUTPUT:
STRICT JSON ONLY.

Here is the input JSON:
{json.dumps(chunk, ensure_ascii=False)}

OUTPUT:
STRICT JSON ONLY.
"""

    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[
            {"role": "system", "content": "You are a semantic topic merger."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1
    )

    return response.choices[0].message.content


async def merge_chunk_async(chunk, index, total, executor, target_count, retries=5, timeout=60):
    async with SEM:
        for attempt in range(retries):
            try:
                print(f"[merge_topics] Chunk {index+1}/{total} attempt {attempt+1}")

                loop = asyncio.get_event_loop()
                raw = await asyncio.wait_for(
                    loop.run_in_executor(executor, merge_chunk_sync, chunk, target_count),
                    timeout=timeout
                )

                return raw

            except Exception as e:
                print(f"[merge_topics] Retry {attempt+1}/{retries} due to: {e}")
                await asyncio.sleep(2)

        print(f"[merge_topics] FAILED chunk {index}")
        return "[]"


async def merge_topics(topics, temp_dir: Path):
    n = len(topics)
    chunk_size = auto_chunk_size(n)
    target_per_chunk = auto_target_per_chunk(n)

    print(f"[merge_topics] Total topics: {n}")
    print(f"[merge_topics] Chunk size: {chunk_size}")
    print(f"[merge_topics] Target per chunk: {target_per_chunk}")

    chunks = list(chunk_list(topics, chunk_size))
    total = len(chunks)

    executor = ThreadPoolExecutor(max_workers=PARALLEL)

    async def run():
        tasks = [
            merge_chunk_async(chunks[i], i, total, executor, target_per_chunk)
            for i in range(total)
        ]
        return await asyncio.gather(*tasks)

    raw_results = await run()

    merged_all = []

    for idx, raw in enumerate(raw_results):
        try:
            merged = json.loads(raw)
            merged_all.extend(merged)
        except Exception:
            (temp_dir / f"merge_chunk_{idx}_raw.txt").write_text(raw, encoding="utf-8")
            print(f"[merge_topics] Chunk {idx} returned invalid JSON")

    output_file = temp_dir / "topics_merged.json"
    output_file.write_text(json.dumps(merged_all, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[merge_topics] Merged topics: {len(merged_all)}")
    print(f"[merge_topics] Saved to {output_file}")

    return merged_all