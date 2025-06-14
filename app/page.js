"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../app/lib/supabase";
import "@/app/styles.scss";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const endOfChat = useRef(null);

  async function selectMessages() {
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

  async function InsertMessages(e) {
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

  // Buscar mensagens existentes e iniciar realtime
  useEffect(() => {
    selectMessages();

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((oldMessages) => [...oldMessages, payload.new]);
          }

          if (payload.eventType === "UPDATE") {
            setMessages((oldMessages) =>
              oldMessages.map((msg) =>
                msg.id === payload.new.id ? payload.new : msg
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setMessages((oldMessages) =>
              oldMessages.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    endOfChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="container">
      <h1 className="header">A Chatt.</h1>
      <div className="chat">
        {messages.map((msg) => (
          <p className="loaded-message" key={msg.id}>
            {msg.content}{" "}
            <button
              onClick={async () => {
                await supabase
                  .from("messages")
                  .update({ content: newMessage })
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
        <div ref={endOfChat} />
      </div>

      <form onSubmit={InsertMessages}>
        <textarea
          className="textbox"
          placeholder="Write or edit a message to everyone in the chat"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              InsertMessages(e);
            }
          }}
        />
        <button type="submit">send</button>
      </form>
    </div>
  );
}
