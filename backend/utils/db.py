import os
import json
import asyncio
import asyncpg
import boto3
import logging
from dotenv import load_dotenv

# === Logging Config ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# === Load .env variables ===
load_dotenv()

# === AWS Config ===
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
MODEL_ID = "amazon.titan-embed-text-v2:0"
EMBED_DIM = 1024  

# === PG DB Config ===
DB_URL = os.getenv("DATABASE_URL")

# === AWS Bedrock Client ===
def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN
    )

# === Embedding Function ===
def get_titan_embedding(text: str) -> list:
    try:
        client = get_bedrock_client()
        body = {"inputText": text[:2000]}
        response = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body),
            accept="application/json",
            contentType="application/json"
        )
        result = json.loads(response["body"].read())
        return result["embedding"]
    except Exception as e:
        logging.error(f"Embedding failed: {e}")
        return []

# === DB Pool Setup ===
async def get_pool():
    return await asyncpg.create_pool(dsn=DB_URL)

# === Initialize DB ===
async def init_db(pool):
    async with pool.acquire() as conn:
        logging.info("Initializing database and extensions...")

        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS GrabData (
                id SERIAL PRIMARY KEY,
                filepath TEXT UNIQUE,
                content TEXT,
                embedding VECTOR({EMBED_DIM})
            );
        """)
        await conn.execute("DROP INDEX IF EXISTS idx_grabdata_embedding;")
        await conn.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_grabdata_embedding
            ON GrabData USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)
        logging.info("✅ DB initialized.")

# === Insert Chunk ===
async def insert_chunk(pool, filepath, content, embedding):
    if not embedding:
        logging.warning(f"Skipping {filepath} due to empty embedding.")
        return
    if len(embedding) != EMBED_DIM:
        logging.error(f"Insert failed for {filepath}: expected {EMBED_DIM} dimensions, got {len(embedding)}")
        return

    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    async with pool.acquire() as conn:
        try:
            await conn.execute("""
                INSERT INTO GrabData (filepath, content, embedding)
                VALUES ($1, $2, $3::vector)
                ON CONFLICT (filepath) DO NOTHING;
            """, filepath, content, embedding_str)
            logging.info(f"Inserted: {filepath}")
        except Exception as e:
            logging.error(f"Insert failed for {filepath}: {e}")

# === Fetch Similar ===
async def fetch_similar(pool, embedding, limit=5):
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT filepath, content FROM GrabData ORDER BY embedding <-> $1::vector LIMIT $2",
            embedding_str, limit
        )
        return rows

# === Load Dataset Files ===
def load_all_files(root=None):
    if root is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        root = os.path.abspath(os.path.join(script_dir, "../../datasets"))

    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            if path.endswith((".txt", ".md", ".log", ".json", ".csv")):
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        yield path, f.read()
                except Exception as e:
                    logging.error(f"Reading failed for {path}: {e}")

# === Embed All Files ===
async def embed_all_files():
    pool = await get_pool()
    await init_db(pool)
    total = 0
    for filepath, content in load_all_files():
        logging.info(f"Processing: {filepath}")
        short_content = content[:2000]
        embedding = get_titan_embedding(short_content)
        await insert_chunk(pool, filepath, short_content, embedding)
        total += 1
    logging.info(f"Embedding complete. Total files processed: {total}")
    await pool.close()

# === Entry Point ===
if __name__ == "__main__":
    asyncio.run(embed_all_files())
