"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [newMessage, setNewMessage] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="container">
      <h1>Vem de chat manin!</h1>
      <div className="chat">
        <p>{newMessage}</p>
      </div>
      <form>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </form>
    </div>
  );
}
