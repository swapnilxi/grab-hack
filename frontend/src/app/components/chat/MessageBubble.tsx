"use client";

interface MessageBubbleProps {
  type: "user" | "bot";
  text: string;
}

export default function MessageBubble({ type, text }: MessageBubbleProps) {
  const isUser = type === "user";

  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <div className={`flex ${isUser ? "justify-end" : "items-start space-x-2"}`}>
        {!isUser && (
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
            🤖
          </div>
        )}
        <div
          className={`inline-block px-3 py-2 max-w-xs rounded-lg break-words ${
            isUser
              ? "bg-green-100 dark:bg-green-900 text-black dark:text-white"
              : "bg-gray-200 dark:bg-zinc-700 text-black dark:text-white"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}