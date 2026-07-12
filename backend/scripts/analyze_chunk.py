from openai import OpenAI
import os


client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY"),
)

def analyze_chunk(chunk_text: str):
    prompt = f"""
    You are an AI that extracts semantic information from textbook fragments.

    DETECTION RULES (STRICT):
    The fragment MUST be treated as TABLE OF CONTENTS (TOC) and NOT analyzed if ANY of the following are true:

    - It contains mostly numbered headings (e.g., "1.", "1.1.", "2.", "3.4.1.")
    - It contains mostly section titles without explanations
    - It contains page numbers
    - It contains repeated patterns like "Summary", "Preface", "Introduction", "Installation", etc. without any explanatory text
    - It contains more than 5 consecutive short lines (< 8 words each)
    - It contains mostly capitalized headings
    - It contains dotted lines ("....") or formatting artifacts
    - It contains chapter names but no sentences

    If ANY of these conditions are met:
    RETURN EXACTLY:
    {{"topics": [], "summary": ""}}

    ANALYSIS RULES:
    Only analyze fragments that contain full sentences, explanations, examples, or descriptive text.

    OUTPUT FORMAT (STRICT JSON ONLY):
    {{
      "topics": [
        {{
          "name": "string",
          "description": "2-3 sentences",
          "keywords": ["k1","k2","k3"],
          "context": ["phrase1","phrase2"]
        }}
      ],
      "summary": "2-4 sentences"
    }}

    Fragment:
    {chunk_text}
    """

    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[
            {"role": "system", "content": "You are a semantic analyzer."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content
