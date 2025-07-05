"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useChatStore } from "@/store/useChatStore";
import MessageBubble from "./MessageBubble";
import Loader from "./Loader";
import PostPipelineButtons from "./PostPipelineButtons";
import FileUploadIcon from '@mui/icons-material/FileUpload';
export default function ChatUI() {
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [chatInput, setChatInput] = useState(""); // ADDED FOR BOTTOM CHAT
  const [loading, setLoading] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const { messages, addMessage, reset } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // HANDLES PAYMENT FORM SUBMIT
  const handlePayment = async () => {
    reset();
    setLoading(true);
    setShowButtons(true);
    addMessage({ type: "user", text: `🧝 Sending ₹${amount} to ${receiverId}` });
    addMessage({ type: "bot", text: `🤖 Processing payment...` });

    try {
      const res = await axios.post("http://localhost:8080/run-pipeline", {
        sender_id: "test@upi", // Mock sender_id to satisfy backend
        receiver_id: receiverId,
        amount: parseFloat(amount),
      });

      const data = res.data;

      addMessage({ type: "bot", text: `✅ Fraud: ${data.fraud?.result}` });
      addMessage({ type: "bot", text: `✅ Reconciliation: ${data.reconciliation?.result}` });
      addMessage({ type: "bot", text: `✅ Routing: ${data.routing?.result}` });
      addMessage({ type: "bot", text: `✅ Healing: ${data.healing?.result}` });
      addMessage({ type: "bot", text: `🧠 Final Review: ${data.review?.status}` });
      addMessage({ type: "bot", text: `🎉 Payment complete. Need anything else?` });
    } catch (err) {
      addMessage({ type: "bot", text: `❌ Something went wrong.` });
    } finally {
      setLoading(false);
    }
  };


const handleChatSend = async () => {
  if (chatInput.trim() === "") return;
  addMessage({ type: "user", text: chatInput });
  setChatInput("");
  setLoading(true); // Start loader

  if (chatInput.trim().toLowerCase() === "yes") {
    try {
      const res = await axios.post("http://localhost:8080/ask", { question: "yes" });
      addMessage({ type: "bot", text: res.data.response || "Fraud override activated." });
      const fraudRes = await axios.post("http://localhost:8080/run-agent/fraud", {
        receiver_id: receiverId,
        amount: parseFloat(amount),
        confirm: "yes",
      });
      addMessage({ type: "bot", text: fraudRes.data.result || JSON.stringify(fraudRes.data) });
    } catch (err) {
      addMessage({ type: "bot", text: "❌ Something went wrong." });
    } finally {
      setLoading(false); // Stop loader
    }
  } else {
    try {
      const res = await axios.post("http://localhost:8080/ask", { question: chatInput });
      addMessage({ type: "bot", text: res.data.response });
    } catch (err) {
      addMessage({ type: "bot", text: "❌ Something went wrong." });
    } finally {
      setLoading(false); // Stop loader
    }
  }
  
};

  // ENTER KEY SUBMIT FOR CHAT
  const onChatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleChatSend();
  };

  return (
    <div className="max-w-xl relative bg-white dark:bg-zinc-900 dark:text-white shadow-md p-4 rounded-xl flex flex-col h-[600px]">
      {/* Chat Message Feed */}
      <div className="flex-1 bg-gray-50 dark:bg-zinc-800 p-4 rounded overflow-y-auto text-sm space-y-4">
        {/* Welcome Message */}
        <div className="text-left">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
              🤖
            </div>
            <div className="bg-gray-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg px-3 py-2 max-w-xs">
              Welcome to PayBot! Enter UPI and amount to make a secure payment.
            </div>
          </div>
        </div>
        {/* Payment Form as a "bot" message */}
        <div className="flex items-start space-x-2">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
            🤖
          </div>
          <div className="bg-gray-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg px-3 py-2 w-full">
            <div className="space-y-2">
              <input
                placeholder="Receiver UPI ID"
                className="w-full p-2 border rounded bg-white text-black border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              />
              <input
                placeholder="Amount"
                className="w-full p-2 border rounded bg-white text-black border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
              <button
                className="bg-green-600 text-white p-2 rounded w-full hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                onClick={handlePayment}
                disabled={loading || !receiverId || !amount}
              >
                Send Payment
              </button>
            </div>
          </div>
        </div>
        {/* User/Bot chat */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} type={msg.type} text={msg.text} />
        ))}

        {loading && <Loader />}
        <div ref={scrollRef} />
        {showButtons && (
          <PostPipelineButtons receiverId={receiverId} amount={parseFloat(amount)} />
        )}
      </div>

      {/* Persistent Bottom Input (like ChatGPT) */}
      <div className="mt-2 p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2 sticky bottom-0 z-10">
        <label className="flex items-center cursor-pointer">
          <input
            type="file"
            className="hidden"
            // onChange={handleFileUpload} // Add handler if needed
          />
          <span className="bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-white px-3 py-2 rounded ml-1 flex items-center">
            <FileUploadIcon className="w-5 h-5 mr-1" />
            Upload
          </span>
        </label>
        <input
          type="text"
          placeholder="Type a message…"
          className="flex-1 p-2 rounded border border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={onChatInputKeyDown}
          disabled={loading}
        />
        
        <button
          onClick={handleChatSend}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          disabled={loading || chatInput.trim() === ""}
        >
          Send
        </button>
      </div>
    </div>
  );
}
