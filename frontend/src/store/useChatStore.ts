import { create } from "zustand";

type Message = { type: "user" | "bot"; text: string };

interface ChatStore {
  messages: Message[];
  addMessage: (msg: Message) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  reset: () => set({ messages: [] }),
}));