# triageAgent.py

import os
import boto3
import json

# Claude model ID for Sonnet (Bedrock)
CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

class TriageAgent:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
        )

    def route_request(self, summary: str, payload: dict):
        """
        Calls Claude via Bedrock to triage the transaction.
        """
        # Create a simple prompt for Claude
        prompt = (
            "You are a payments triage AI. Your job is to assess the following transaction for risk, "
            "potential fraud, or operational errors. Summarize the key issue, flag any suspicious signals, "
            "and suggest the next action (investigate, escalate, ignore, etc).\n\n"
            f"Transaction details (JSON):\n{json.dumps(payload, indent=2)}\n\n"
            "Return a JSON with fields: triage_decision (investigate/ignore/escalate), reason (string), "
            "and if relevant, any key fields you noticed."
        )
        # Claude 3.5 Sonnet requires a 'messages' list
        messages = [
            {"role": "user", "content": prompt}
        ]

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 512,
            "temperature": 0.2,
            "top_p": 0.99,
            "messages": messages,
        }

        response = self.client.invoke_model(
            modelId=CLAUDE_MODEL_ID,
            body=json.dumps(request_body),
            contentType="application/json"
        )

        # Claude returns a streamable object or dict
        response_body = response["body"].read().decode("utf-8")
        response_json = json.loads(response_body)

        # Typically, Claude's output is in response_json['content'][0]['text']
        result_text = response_json["content"][0]["text"]
        try:
            # Expect a JSON result
            result = json.loads(result_text)
        except Exception:
            result = {"triage_decision": "error", "reason": "LLM output parsing failed", "raw": result_text}

        return result

# Singleton instance for FastAPI
triage_agent = TriageAgent()
