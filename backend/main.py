from fastapi import FastAPI, Request, Body
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from utils.query import ask_question_from_db

from src.TriageAgent import TriageAgent
from src.FraudAgent import FraudAgent
from src.HealingAgent import HealingAgent

fraud_detector = FraudAgent()
healing_agent = HealingAgent()
triage_agent = TriageAgent()



app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PaymentRequest(BaseModel):
    sender_id: str
    receiver_id: str
    amount: float
    id: Optional[str] = None
    transaction_id: Optional[str] = None

fraud_check_override = {"allow": False}  # GLOBAL DEMO STATE

def run_fraud_agent(data: PaymentRequest, pipeline_mode=False):
    if pipeline_mode:
        # For pipeline, always show the custom message
        return {
            "status": "fraud_found",
            "result": "🚨 Fraud registered in our database. Do you want to do a fraud check and then proceed?"
        }
    # For agent, check override
    if not fraud_check_override["allow"]:
        return {
            "status": "fraud_found",
            "result": "🚨 Fraud found. Do you still want to continue? Type 'yes'"
        }
    else:
        return {
            "status": "done",
            "result": "No fraud detected on receiver end."
        }

def run_reconciliation_agent(data: PaymentRequest):
    return {"status": "done", "result": "Reconciled with bank database successfully."}

def run_routing_agent(data: PaymentRequest):
    return {"status": "done", "result": "Routed via Gateway-X.checking for other server"}

def run_self_healing_agent(data: PaymentRequest):
    return {"status": "done", "result": "No healing needed, payment successful."}

def run_consistency_reviewer(data: PaymentRequest, agent_outputs: dict):
    return {"status": "consistent", "action_taken": False}

@app.get("/")
def root():
    return {"message": "Grab Agent App is running"}

@app.post("/run-agent/{agent_name}")
def run_single_agent(agent_name: str, payload: dict = Body(...)):
    mock_request = PaymentRequest(
        sender_id="demo@id", receiver_id=payload.get("receiver_id", "demo@id"), amount=payload.get("amount", 0)
    )
    # Fraud check: expects payload.get("confirm") == "yes"
    if agent_name == "fraud":
        if payload.get("confirm") == "yes":
            fraud_check_override["allow"] = True
            return run_fraud_agent(mock_request)
        return run_fraud_agent(mock_request)
    elif agent_name == "reconciliation":
        return run_reconciliation_agent(mock_request)
    elif agent_name == "routing":
        return run_routing_agent(mock_request)
    elif agent_name == "healing":
        return run_self_healing_agent(mock_request)
    elif agent_name == "review":
        return run_consistency_reviewer(mock_request, {})
    else:
        return {"error": "Unknown agent"}

@app.post("/run-pipeline")
def run_pipeline(payload: PaymentRequest):
    response = {}
    response["fraud"] = run_fraud_agent(payload, pipeline_mode=True)
    response["reconciliation"] = run_reconciliation_agent(payload)
    response["routing"] = run_routing_agent(payload)
    response["healing"] = run_self_healing_agent(payload)
    response["review"] = run_consistency_reviewer(payload, response)
    return response

@app.post("/run-triage")
def run_triage(payload: dict = Body(...)):
    summary = f"Transaction of {payload}"
    result = triage_agent.route_request(summary, payload)
    return result

@app.post("/run-fraud-agent")
def run_fraud(payload: dict = Body(...)):
    summary = f"Transaction of {payload}"
    result = fraud_detector.analyze_data(summary, payload)
    return {"status": "fraud_detected" if result["fraud_detected"] else "clear", "result": result}

@app.post("/run-healing-agent")
def run_healing(payload: dict = Body(...)):
    summary = f"Transaction of {payload}"
    result = healing_agent.analyze_failure(summary, payload)
    return {"status": "healing_needed" if result["healing_needed"] else "ok", "result": result}


@app.post("/chat-message")
def chat_message(payload: dict = Body(...)):
    user_message = payload.get("message", "")
    # Reset fraud override if user says anything else
    if user_message.strip().lower() == "yes":
        fraud_check_override["allow"] = True
        return {"response": "Fraud override activated. Please rerun fraud check."}
    else:
        fraud_check_override["allow"] = False
        return {"response": f"❌ Payment failed for: {user_message}"}

class AskRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_endpoint(request: AskRequest):
    response = await ask_question_from_db(request.question)
    return {"response": response}


@app.post("/ask-context")
async def ask_with_context(body: AskRequest):
    return await ask_question_with_context(body.question)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
