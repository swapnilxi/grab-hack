# db.py
import os
import json
import asyncio
import asyncpg
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Credentials
AWS_REGION = os.getenv("AWS_DEFAULT_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
MODEL_ID = "amazon.titan-embed-text-v2"
EMBED_DIM = 1536  # Titan V2 output

# DB
DB_URL = os.getenv("DATABASE_URL")

# === AWS Bedrock ===
def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN
    )

def get_titan_embedding(text: str) -> list:
    try:
        client = get_bedrock_client()
        body = { "inputText": text[:2000] }  # Truncate if needed
        response = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body),
            accept="application/json",
            contentType="application/json"
        )
        result = json.loads(response["body"].read())
        return result["embedding"]
    except Exception as e:
        print(f"[ERROR] Embedding failed: {e}")
        return []

# === PGVECTOR Setup ===
async def get_pool():
    return await asyncpg.create_pool(dsn=DB_URL)

async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id SERIAL PRIMARY KEY,
                filepath TEXT UNIQUE,
                content TEXT,
                embedding VECTOR({EMBED_DIM})
            );
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
            ON document_chunks
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)

# === Insert Logic ===
async def insert_chunk(pool, filepath, content, embedding):
    if not embedding:
        return
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        try:
            await conn.execute("""
                INSERT INTO document_chunks (filepath, content, embedding)
                VALUES ($1, $2, $3::vector)
                ON CONFLICT (filepath) DO NOTHING;
            """, filepath, content, embedding_str)
        except Exception as e:
            print(f"[ERROR] Insert failed for {filepath}: {e}")

# === Search Logic ===
async def fetch_similar(pool, embedding, limit=5):
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT filepath, content FROM document_chunks ORDER BY embedding <-> $1::vector LIMIT $2",
            embedding_str, limit
        )
        return rows

# === File Scanner ===
def load_all_files(root="datasets"):
    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            if path.endswith((".txt", ".md", ".log", ".json", ".csv")):
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        yield path, f.read()
                except Exception as e:
                    print(f"[ERROR] Reading {path}: {e}")

# === Embed All ===
async def embed_all_files():
    pool = await get_pool()
    await init_db(pool)
    for filepath, content in load_all_files():
        short_content = content[:2000]
        embedding = get_titan_embedding(short_content)
        await insert_chunk(pool, filepath, short_content, embedding)
    await pool.close()

# === CLI Entrypoint ===
if __name__ == "__main__":
    asyncio.run(embed_all_files())
