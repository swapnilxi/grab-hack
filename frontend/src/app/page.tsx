import ChatUI from "@/app/components/chat/ChatUI";

export default function HomePage() {
  return (
    <div className=" flex flex-col w-full bg-white dark:bg-zinc-900 dark:text-white shadow-md rounded-xl  max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl p-4  justify-center items-center">
      <h1 className="text-2xl font-bold mb-4 text-center p-2">💸 PayAgent</h1>
      <ChatUI />
    </div>
  );
}