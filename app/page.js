"use client";

import { useEffect, useState } from "react";
import { supabase } from "../app/lib/supabase";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Buscar mensagens existentes e iniciar realtime
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          console.log("Payload recebido:", payload);

          if (payload.eventType === "INSERT") {
            setMessages((msgs) => [...msgs, payload.new]);
          }

          if (payload.eventType === "UPDATE") {
            setMessages((msgs) =>
              msgs.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          }

          if (payload.eventType === "DELETE") {
            setMessages((msgs) =>
              msgs.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mensagens:", error);
    } else {
      setMessages(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from("messages")
      .insert([{ content: newMessage }]);

    if (error) {
      console.error("Erro ao enviar mensagem:", error);
    } else {
      setNewMessage("");
    }
  }

  return (
    <div className="container">
      <h1>Vem de chat manin!</h1>

      <div className="chat">
        {messages.map((msg) => (
          <p key={msg.id}>
            {msg.content}{" "}
            <button
              onClick={async () => {
                await supabase
                  .from("messages")
                  .update({ content: msg.content + " (editado)" })
                  .eq("id", msg.id);
              }}
            >
              Editar
            </button>{" "}
            <button
              onClick={async () => {
                await supabase.from("messages").delete().eq("id", msg.id);
              }}
            >
              Apagar
            </button>
          </p>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
