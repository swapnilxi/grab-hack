# healingAgent.py

import os
import boto3
import json

CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

class HealingAgent:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
        )
        self.model_id = CLAUDE_MODEL_ID

    def analyze_failure(self, summary: str, payload: dict) -> dict:
        print("[HealingAgent] Healing Agent running...")  # Log to console
        """
        Calls Claude via Bedrock to assess if healing/self-healing/system intervention is needed.
        Returns:
            {
                healing_needed: bool,
                reason: str,
                recommended_action: str,
                raw: str (optional, only on error)
            }
        """
        prompt = (
            "You are a payment infrastructure healing agent. Given the transaction summary and system data, "
            "analyze if healing (such as retry, failover, self-healing, or manual intervention) is needed. "
            "Reply ONLY with a JSON object in the following format:\n"
            '{\n'
            '  "healing_needed": true/false,\n'
            '  "reason": "short reason for your judgement",\n'
            '  "recommended_action": "action or next steps"\n'
            '}\n'
            "Be concise and objective.\n"
            "Example:\n"
            '{ "healing_needed": true, "reason": "Detected server outage", "recommended_action": "Restart payment service and notify ops" }\n\n'
            f"Summary: {summary}\n"
            f"Data: {json.dumps(payload, indent=2)}"
        )

        messages = [{"role": "user", "content": prompt}]
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 256,
            "temperature": 0.0,
            "top_p": 1.0,
            "messages": messages,
        }

        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType="application/json"
            )
            response_body = response["body"].read().decode("utf-8")
            response_json = json.loads(response_body)
            result_text = response_json["content"][0]["text"]
            try:
                model_result = json.loads(result_text)
                healing_needed = bool(model_result.get("healing_needed", False))
                resolution = (
                    "Healing is successful" if healing_needed else "No healing required"
                )
                updated_status = (
                    "PENDING_REVIEW" if healing_needed else "NO_ACTION"
                )
                return {
                    "healing_needed": healing_needed,
                    "recommended_action": model_result.get("recommended_action", ""),
                    "resolution": f"Recommended action: {model_result.get('recommended_action', '')}",
                    "updated_status": updated_status,
                    "agent": "Healing Agent running"
                }
            except Exception:
                return {
                    "healing_needed": False,
                    "reason": "LLM output parsing failed",
                    "recommended_action": "",
                    "resolution": "Healing failed",  # Always include
                    "updated_status": "ERROR",       # Always include
                    "agent": "Healing Agent running"
                }
        except Exception as e:
            return {
                "healing_needed": False,
                "reason": f"Exception in Bedrock call: {e}",
                "recommended_action": "",
                "resolution": "Healing failed",      # Always include
                "updated_status": "ERROR",           # Always include
                "agent": "Healing Agent running"
            }

healing_agent = HealingAgent()
