import asyncio
import time
import json
from concurrent.futures import ThreadPoolExecutor
from backend.scripts.analyze_chunk import analyze_chunk

SEM = asyncio.Semaphore(3)

async def analyze_chunk_async(chunk, index, total, executor, retries=5, timeout=30):
    async with SEM:
        for attempt in range(retries):
            try:
                print(f"[{index+1}/{total}] Starting chunk {index} (attempt {attempt+1})...")
                start_time = time.time()

                loop = asyncio.get_event_loop()
                result = await asyncio.wait_for(
                    loop.run_in_executor(executor, analyze_chunk, chunk),
                    timeout=timeout
                )

                elapsed = time.time() - start_time
                print(f"[{index+1}/{total}] Finished chunk {index} in {elapsed:.2f}s")

                return result

            except Exception as e:
                print(f"[{index+1}/{total}] Retry {attempt+1}/{retries} for chunk {index} due to error: {e}")
                await asyncio.sleep(1)

        print(f"[{index+1}/{total}] FAILED chunk {index}, returning empty JSON")
        return '{"topics": [], "summary": ""}'


async def analyze_chunks_async(chunks):
    executor = ThreadPoolExecutor(max_workers=4)
    total = len(chunks)

    tasks = [
        analyze_chunk_async(chunks[i], i, total, executor)
        for i in range(total)
    ]

    results = await asyncio.gather(*tasks)
    return results