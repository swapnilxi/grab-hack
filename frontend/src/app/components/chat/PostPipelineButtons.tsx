"use client";

import { useState } from "react";
import axios from "axios";
import { useChatStore } from "@/store/useChatStore";

interface Props {
  receiverId: string;
  amount: number;
}

export default function PostPipelineButtons({ receiverId, amount }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage } = useChatStore();

  const runAgent = async (agent: string) => {
    setIsLoading(true);
    addMessage({ type: "bot", text: `🔄 Running ${agent} check...` });

    try {
      const res = await axios.post(`http://localhost:8000/run-agent/${agent}`, {
        receiver_id: receiverId,
        amount: amount,
      });
      // Show backend message or fallback
      const isFraud = res.data.status === "fraud_found" || (res.data.result && res.data.result.includes("Fraud"));
      const icon = isFraud ? "🚨" : "✅";
      addMessage({ type: "bot", text: `${icon} ${agent} result: ${res.data.result || res.data.status || JSON.stringify(res.data)}` });
    } catch (err) {
      addMessage({ type: "bot", text: `❌ ${agent} agent failed.` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => runAgent("fraud")}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Run Fraud Check
      </button>
      <button
        onClick={() => runAgent("healing")}
        disabled={isLoading}
        className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Run Healing
      </button>
      <button
        onClick={() => runAgent("reconciliation")}
        disabled={isLoading}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Run Reconciliation
      </button>
      <button
        onClick={() => runAgent("routing")}
        disabled={isLoading}
        className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Run Routing
      </button>
      <button
        onClick={() => runAgent("review")}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Run Review
      </button>
    </div>
  );
}



