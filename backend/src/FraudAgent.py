# fraudAgent.py

import os
import boto3
import json

CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

VALID_FRAUD_RESULTS = {"fraud", "not_fraud", "uncertain"}

class FraudAgent:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
        )
        self.model_id = CLAUDE_MODEL_ID

    def analyze_data(self, summary: str, payload: dict) -> dict:
        print("[FraudAgent] Fraud Agent running...")  # Log to console
        """
        Calls Claude via Bedrock to assess the transaction for fraud.
        Returns: {
            fraud_detected: bool,
            fraud_result: "fraud"|"not_fraud"|"uncertain",
            reason: string,
            raw: string (optional, only on error)
        }
        """
        prompt = (
            "You are a payment fraud detection AI. Analyze the transaction below and reply ONLY with a JSON object in this format:\n"
            '{\n'
            '  "fraud_result": "fraud|not_fraud|uncertain",\n'
            '  "reason": "Short reason for your judgement"\n'
            '}\n'
            "Choose fraud_result as:\n"
            "- fraud: if you see clear suspicious or fraudulent activity\n"
            "- not_fraud: if you see no indication of fraud\n"
            "- uncertain: if you cannot tell from the data\n"
            "Be concise and objective. Example:\n"
            '{ "fraud_result": "fraud", "reason": "Unusual amount and flagged metadata" }\n\n'
            f"Summary: {summary}\n"
            f"Data: {json.dumps(payload, indent=2)}"
        )

        messages = [{"role": "user", "content": prompt}]
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 128,
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
                result_val = str(model_result.get("fraud_result", "")).lower()
                fraud_detected = (result_val == "fraud")
                if result_val not in VALID_FRAUD_RESULTS:
                    return {
                        "fraud_detected": False,
                        "fraud_result": "uncertain",
                        "reason": f"Invalid output from Claude: {result_val}",
                        "raw": result_text,
                        "agent": "Fraud Agent running"
                    }
                return {
                    "fraud_detected": fraud_detected,
                    "fraud_result": result_val,
                    "reason": model_result.get("reason", ""),
                    "agent": "Fraud Agent running"
                }
            except Exception:
                return {
                    "fraud_detected": False,
                    "fraud_result": "uncertain",
                    "reason": "LLM output parsing failed",
                    "raw": result_text,
                    "agent": "Fraud Agent running"
                }
        except Exception as e:
            return {
                "fraud_detected": False,
                "fraud_result": "uncertain",
                "reason": f"Exception in Bedrock call: {e}",
                "raw": "",
                "agent": "Fraud Agent running"
            }

fraud_detector = FraudAgent()
