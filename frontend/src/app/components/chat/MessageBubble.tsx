import React from "react";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ type, text }: { type: string; text: string }) {
  const isBot = type === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`rounded-lg px-3 py-2 max-w-xs break-words whitespace-pre-wrap ${
          isBot
            ? "bg-gray-200 dark:bg-zinc-700 text-black dark:text-white"
            : "bg-green-600 text-white"
        }`}
      >
        {isBot ? <ReactMarkdown>{text}</ReactMarkdown> : text}
      </div>
    </div>
  );
}