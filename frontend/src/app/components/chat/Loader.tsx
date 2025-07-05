"use client";

export default function Loader() {
return (
<div className="text-left flex items-start space-x-2">
<div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">🤖</div>
<div className="bg-gray-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg px-3 py-2 max-w-xs animate-pulse">
Processing...
</div>
</div>
);
}