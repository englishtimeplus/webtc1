'use client'
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001');

const VideoChat = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [userList, setUserList] = useState<{ socketId: string; userId: string }[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');

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
        socket.emit('send-offer', roomId, peerConnectionRef.current!.localDescription, targetUserId);
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
    socket.on('update-user-list', (users: { socketId: string; userId: string }[]) => {
      setUserList(users);
    });

    socket.on('receive-offer', async ({ offer, senderSocketId }) => {
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = new RTCPeerConnection();

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('send-answer', roomId, peerConnectionRef.current!.localDescription, senderSocketId);
          }
        };
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('send-answer', roomId, answer, senderSocketId);
      } catch (error) {
        console.error('Error during offer handling:', error);
      }
    });

    socket.on('receive-answer', async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    return () => {
      socket.off('update-user-list');
      socket.off('receive-offer');
      socket.off('receive-answer');
    };
  }, [roomId, userId]);

  return (
    <div>
      <div>
        <input type="text" placeholder="Room ID" onChange={(e) => setRoomId(e.target.value)} />
        <input type="text" placeholder="Your User ID" onChange={(e) => setUserId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>
        {joined && (
          <div>
            <h3>Users in Room:</h3>
            <ul>
              {userList.map((user) => (
                <li key={user.socketId}>
                  {user.userId}
                  <button onClick={() => setTargetUserId(user.userId)}>Select</button>
                </li>
              ))}
            </ul>
            {targetUserId && <button onClick={startCall}>Call {targetUserId}</button>}
          </div>
        )}
      </div>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
  );
};

export default VideoChat;