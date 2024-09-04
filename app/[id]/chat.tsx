// components/Chat.tsx
'use client'
import { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react';
import io, { Socket } from 'socket.io-client';

interface ChatMessage {
  userId: string;
  message: string;
}

interface ChatProps {
  roomId: string;
}

const socket: Socket = io();

const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on('chatMessage', (data: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });

    return () => {
      socket.off('chatMessage');
    };
  }, []);

  const handleChatSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket.emit('chatMessage', { room: roomId, message: chatMessage });
    setChatMessage('');
  };

  const handleChatChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
  };

  return (
    <div>
      <div ref={chatRef} style={{ height: '300px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.userId}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit}>
        <input
          type="text"
          value={chatMessage}
          onChange={handleChatChange}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
