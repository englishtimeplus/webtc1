'use client'

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Connect to the Socket.IO server running on Express
const socket: Socket = io('http://localhost:3001');

const VideoChat = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    peerConnectionRef.current = new RTCPeerConnection();
    localStreamRef.current.getTracks().forEach((track) => {
      peerConnectionRef.current!.addTrack(track, localStreamRef.current!);
    });

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('send-offer', roomId, peerConnectionRef.current!.localDescription);
      }
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
  };

  const joinRoom = () => {
    socket.emit('join-room', roomId, userId);
    setJoined(true);
  };

  useEffect(() => {
    socket.on('receive-offer', async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit('send-answer', roomId, answer);
    });

    socket.on('receive-answer', async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    return () => {
      socket.off('receive-offer');
      socket.off('receive-answer');
    };
  }, [roomId, userId]);

  return (
    <div>
      <div>
        <input type="text" placeholder="Room ID" onChange={(e) => setRoomId(e.target.value)} />
        <input type="text" placeholder="User ID" onChange={(e) => setUserId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>
        {joined && <button onClick={startCall}>Call User</button>}
      </div>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
  );
};

export default VideoChat;
