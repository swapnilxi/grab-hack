# triageAgent.py

import os
import boto3
import json

CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

VALID_DECISIONS = {"fraud", "healing", "failed", "approved", "healing_and_fraud"}

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
        Ensures triage_decision is only one of: fraud, healing, failed, approved.
        """
        prompt = (
            "You are a payments triage AI. Your job is to assess the following transaction and decide ONE of the following (or BOTH if both are needed):\n"
            "- fraud (suspicious or fraudulent)\n"
            "- healing (needs system healing/self-healing/intervention)\n"
            "- healing_and_fraud (if both healing and fraud are needed)\n"
            "- failed (cannot be processed, error)\n"
            "- approved (all OK)\n"
            "Reply with a JSON object ONLY, in the format:\n"
            "{\n"
            '  "triage_decision": "fraud|healing|healing_and_fraud|failed|approved",\n'
            '  "reason": "short reason for your decision",\n'
            '  "suggested_resolution": "brief recommended next step for the operator"\n'
            "}\n"
            "Example:\n"
            '{ "triage_decision": "healing_and_fraud", "reason": "Server error and suspicious activity detected", "suggested_resolution": "Run healing and fraud agents" }\n\n'
            "Transaction details:\n"
            f"{json.dumps(payload, indent=2)}\n"
        )


        messages = [
            {"role": "user", "content": prompt}
        ]

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 128,
            "temperature": 0.0,
            "top_p": 1.0,
            "messages": messages,
        }

        response = self.client.invoke_model(
            modelId=CLAUDE_MODEL_ID,
            body=json.dumps(request_body),
            contentType="application/json"
        )

        response_body = response["body"].read().decode("utf-8")
        response_json = json.loads(response_body)
        result_text = response_json["content"][0]["text"]

        try:
            result = json.loads(result_text)
            decision = str(result.get("triage_decision", "")).lower()
            if decision not in VALID_DECISIONS:
                # PATCH: If both healing and fraud are needed, set healing_and_fraud
                if (
                    (result.get("reason", "").lower().find("healing") != -1 and result.get("reason", "").lower().find("fraud") != -1)
                    or (result.get("suggested_resolution", "").lower().find("healing") != -1 and result.get("suggested_resolution", "").lower().find("fraud") != -1)
                ):
                    result["triage_decision"] = "healing_and_fraud"
                else:
                    result = {
                        "triage_decision": "failed",
                        "reason": f"Invalid decision from Claude: {decision}",
                        "raw": result_text
                    }
        except Exception:
            result = {
                "triage_decision": "failed",
                "reason": "LLM output parsing failed",
                "raw": result_text
            }

        return result

triage_agent = TriageAgent()
