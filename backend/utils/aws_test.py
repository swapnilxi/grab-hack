# claude_test.py
import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

# === Setup Bedrock Client ===
client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=os.getenv("AWS_SESSION_TOKEN")
)

def test_claude():
    try:
        # Print AWS credentials and region for verification
        print("AWS_DEFAULT_REGION:", os.getenv("AWS_REGION"))
        print("AWS_ACCESS_KEY_ID:", os.getenv("AWS_ACCESS_KEY_ID"))
        print("AWS_SECRET_ACCESS_KEY:", os.getenv("AWS_SECRET_ACCESS_KEY")[:4] + "****")
        print("AWS_SESSION_TOKEN:", (os.getenv("AWS_SESSION_TOKEN")[:4] + "****") if os.getenv("AWS_SESSION_TOKEN") else None)

        model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

        prompt = """\n\nHuman: What is the capital of Japan?\n\nAssistant:"""

        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 100,
                "temperature": 0.7,
                "top_k": 250,
                "top_p": 1.0,
                "stop_sequences": ["\n\nHuman:"]
            }),
            contentType="application/json",
            accept="application/json"
        )

        result = json.loads(response["body"].read())
        print("✅ Claude response:")
        print(result["completion"])
    except Exception as e:
        print("❌ Claude 3.5 call failed")
        print("Error:", e)

if __name__ == "__main__":
    test_claude()
