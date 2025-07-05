import os
import json
import asyncpg
import boto3
from dotenv import load_dotenv

load_dotenv()

# AWS
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# PGVECTOR
DB_URL = os.getenv("DATABASE_URL")

# === Bedrock Claude Client ===
def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN,
    )

# === Search similar context from DB ===
async def fetch_similar_chunks(query_embedding: list, limit=15):
    import asyncpg
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    pool = await asyncpg.create_pool(dsn=DB_URL)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT content FROM GrabData ORDER BY embedding <-> $1::vector LIMIT $2",
            embedding_str, limit
        )
    await pool.close()
    return [row['content'] for row in rows]

# === Get Titan Embedding for user query ===
def get_titan_embedding(text: str) -> list:
    try:
        client = get_bedrock_client()
        body = {"inputText": text[:2000]}
        response = client.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            body=json.dumps(body),
            accept="application/json",
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return result["embedding"]
    except Exception as e:
        print(f"[ERROR] Embedding failed: {e}")
        return []

# === Call Claude to answer using retrieved context ===
def call_claude(context: str, question: str) -> str:
    try:
        client = get_bedrock_client()
        body = {
            "messages": [
                {"role": "user", "content": f"Use the following context to answer:\n\n{context}\n\nQuestion: {question}"}
            ],
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024
        }
        response = client.invoke_model(
            modelId=CLAUDE_MODEL_ID,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json"
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception as e:
        print(f"[ERROR] Claude call failed: {e}")
        return "❌ Claude model failed to respond."

# === Final function for /ask ===
async def ask_question_from_db(question: str) -> str:
    query_embedding = get_titan_embedding(question)
    if not query_embedding:
        return "❌ Could not generate embedding for your question."

    chunks = await fetch_similar_chunks(query_embedding)
    if not chunks:
        return "❌ No relevant information found in the database."

    combined_context = "\n---\n".join(chunks)
    return call_claude(combined_context, question)

