import json
import os
import asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY"),
)

PARALLEL = 3
SEM = asyncio.Semaphore(PARALLEL)


def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def generate_details_sync(chunk):
    prompt = f"""
You are an AI that generates study materials for textbook topics.

INPUT:
A list of topics. Each topic has:
- id
- name
- description
- keywords
- context

TASK FOR EACH TOPIC:
1. Write a clear, structured summary (5–8 sentences) based on ALL provided fields.
2. Generate 6–10 flashcards:
   - Format: {{ "q": "question", "a": "answer" }}
   - Questions must be based STRICTLY on the summary you wrote.
3. Output STRICT JSON ONLY:
[
  {{
    "id": number,
    "displayed_info": "summary text",
    "flashcards": [
      {{ "q": "...", "a": "..." }},
      ...
    ]
  }},
  ...
]

Here are the topics:
{json.dumps(chunk, ensure_ascii=False)}
"""

    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[
            {"role": "system", "content": "You generate summaries and flashcards."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


async def generate_details_async(chunk, index, total, executor, retries=5, timeout=120):
    async with SEM:
        for attempt in range(retries):
            try:
                print(f"[details] Chunk {index+1}/{total} attempt {attempt+1}")

                loop = asyncio.get_event_loop()
                raw = await asyncio.wait_for(
                    loop.run_in_executor(executor, generate_details_sync, chunk),
                    timeout=timeout
                )

                return raw

            except Exception as e:
                print(f"[details] Retry {attempt+1}/{retries} due to: {e}")
                await asyncio.sleep(2)

        print(f"[details] FAILED chunk {index}")
        return "[]"


async def generate_details(topics, temp_dir: Path):

    chunks = list(chunk_list(topics, 5))
    total = len(chunks)

    executor = ThreadPoolExecutor(max_workers=PARALLEL)

    async def run():
        tasks = [
            generate_details_async(chunks[i], i, total, executor)
            for i in range(total)
        ]
        return await asyncio.gather(*tasks)

    raw_results = await run()

    final_topics = {t["id"]: t for t in topics}

    for idx, raw in enumerate(raw_results):
        try:
            items = json.loads(raw)
            for item in items:
                final_topics[item["id"]]["displayed_info"] = item["displayed_info"]
                final_topics[item["id"]]["flashcards"] = item["flashcards"]
        except Exception:
            (temp_dir / f"details_chunk_{idx}_raw.txt").write_text(raw, encoding="utf-8")
            print(f"[details] Chunk {idx} returned invalid JSON")

    output_file = temp_dir / "topics_with_details.json"
    output_file.write_text(
        json.dumps(list(final_topics.values()), indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"[details] Saved detailed topics to {output_file}")

    return list(final_topics.values())