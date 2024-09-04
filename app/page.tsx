// pages/room/[id].tsx
 
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

export default function Room() {
   
  return (
    <div>
      <h1>Room </h1>
       
    </div>
  );
}
