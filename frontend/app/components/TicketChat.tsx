import { useEffect, useRef, useState } from "react";

import {io, Socket } from "socket.io-client"

type UserRole = "user" | "agent" | "admin";

type CurrentUser = {
  user_id: number;
  email: string;
  name: string;
  role: UserRole;
};

type Ticket = {
  id: number;
  chatStarted: boolean;
};

type TicketMessage = {
  messageId: number;
  ticketId: number;
  senderUserId: number;
  messageText: string;
  createdAt: string;
  sender?: {
    user_id: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

type TicketChatProps = {
  ticket: Ticket;
  currentUser: CurrentUser | null;
};

const API_BASE_URL = "http://localhost:3000";

let socket: Socket | null = null;

export default function TicketChat({ ticket, currentUser }: TicketChatProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [chatStarted, setChatStarted] = useState(ticket.chatStarted);
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const isStaff =
    currentUser?.role === "agent" || currentUser?.role === "admin";

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // fixed the way loadMessages() updates the ticket chat
  async function loadMessages() {
    if (!chatStarted) {
        return;
    }

    try {
        if (!initialLoadDone) {
          setLoading(true);
        }

        setChatError("");

        const response = await fetch(
        `${API_BASE_URL}/tickets/${ticket.id}/messages`,
        {
            credentials: "include",
        }
        );

        if (!response.ok) {
        throw new Error("Failed to load chat messages.");
        }

        const data: TicketMessage[] = await response.json();
        setMessages(data);
        setInitialLoadDone(true);
    } catch (error) {
        setChatError(
        error instanceof Error ? error.message : "Something went wrong."
        );
    } finally {
        setLoading(false);
    }
  }

  async function startChat() {
    try {
      setChatError("");

      socket?.emit("startTicketChat", {
        ticketId: ticket.id,
        currentUser,
      });

      setChatStarted(true);
      setInitialLoadDone(false);
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  async function sendMessage() {
    if (messageText.trim() === "") {
      return;
    }

    try {
      setChatError("");

      socket?.emit("sendTicketMessage", {
        ticketId: ticket.id,
        messageText,
        currentUser,
      });

      setMessageText("");
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  useEffect(() => {
    setChatStarted(ticket.chatStarted);
    setMessages([]);
    setInitialLoadDone(false);
  }, [ticket.id, ticket.chatStarted]);

  useEffect(() => {
    void loadMessages();
  }, [ticket.id, chatStarted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket = io(API_BASE_URL, {
      withCredentials: true,
    });

    socket.emit("joinTicketChat", {
      ticketId: ticket.id,
    });

    socket.on("ticketChatStarted", () => {
      setChatStarted(true);
      setInitialLoadDone(false);
    });

    socket.on("ticketMessageReceived", (newMessage: TicketMessage) => {
      setMessages((currentMessages) => [...currentMessages, newMessage]);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [ticket.id]);

  return (
    <div>
      {!chatStarted && isStaff ? (
        <button
          type="button"
          onClick={() => void startChat()}
          className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
        >
          Start Chat
        </button>
      ) : null}

      {!chatStarted && !isStaff ? (
        <p className="text-sm text-gray-600">
          Chat has not been started by an Agent/Admin yet.
        </p>
      ) : null}

      {chatStarted ? (
        <div className="space-y-3">
          <div className="h-64 overflow-y-auto rounded-xl border border-gray-300 bg-white p-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading messages...</p>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.messageId} className="mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {message.sender?.name ?? "User"}
                  </p>

                  <p className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-gray-800">
                    {message.messageText}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No messages yet.</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
              placeholder="Type a message..."
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      {chatError ? (
        <p className="mt-3 text-sm text-red-600">{chatError}</p>
      ) : null}
    </div>
  );
}