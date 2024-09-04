// pages/room/[id].tsx
'use client'

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import io, { Socket } from 'socket.io-client';

interface Message {
  userId: string;
  message: string;
}

interface StreamData {
  streamData: MediaStream;
}

const socket: Socket = io();
export default function Room({params}:{params:{id:number}}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const router = useRouter();
  // const { id } = router.query;
  const id = params.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    socket.emit('joinRoom', id);

    socket.on('userJoined', (data: { userId: string }) => {
      console.log('User joined:', data.userId);
    });

    socket.on('receiveStream', (data: StreamData) => {
      if (videoRef.current) {
        videoRef.current.srcObject = data.streamData;
      }
    });

    socket.on('chatMessage', (data: Message) => {
      setMessages(prevMessages => [...prevMessages, data]);
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });

    return () => {
      socket.off('userJoined');
      socket.off('receiveStream');
      socket.off('chatMessage');
    };
  }, [id]);

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    socket.emit('chatMessage', { room: id, message: chatMessage });
    setChatMessage('');
  };

  const handleStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        socket.emit('sendStream', { room: id, streamData: stream });
      })
      .catch((err) => console.error('Error accessing media devices.', err));
  };

  return (
    <div>
      <h1>Room: {id}</h1>
      <button onClick={handleStream}>Start Stream</button>
      <video ref={videoRef} autoPlay playsInline></video>
      <div>
        <div ref={chatRef} style={{ height: '300px', overflowY: 'scroll' }}>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>{msg.userId}: {msg.message}</li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleChatSubmit}>
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
