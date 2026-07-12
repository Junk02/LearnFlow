import json
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY"),
)

def build_connections(topics, temp_dir: Path):

    compact = [
        {"id": t["id"], "name": t["name"]}
        for t in topics
    ]

    prompt = f"""
You are an AI that analyzes conceptual relationships between textbook topics.

INPUT:
A list of topics. Each topic has:
- id
- name

TASK:
1. Compare all topics with each other.
2. Identify meaningful conceptual relationships.
3. Output a list of edges: pairs of topic IDs.
4. Each pair [A, B] means "A is conceptually related to B".
5. Do NOT output duplicates.
6. Do NOT output explanations.
7. Output STRICT JSON ONLY:
[
  [id1, id2],
  [id3, id4],
  ...
]

Here is the list of topics:
{json.dumps(compact, ensure_ascii=False)}
"""

    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[
            {"role": "system", "content": "You build conceptual graphs."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1
    )

    raw = response.choices[0].message.content

    try:
        edges = json.loads(raw)
    except Exception:
        (temp_dir / "connections_raw.txt").write_text(raw, encoding="utf-8")
        print("[build_connections] ERROR: invalid JSON, saved raw output")
        return []

    output_file = temp_dir / "topic_connections.json"
    output_file.write_text(json.dumps(edges, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[build_connections] Saved {len(edges)} connections to {output_file}")

    return edges