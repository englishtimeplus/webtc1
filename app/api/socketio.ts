import { Server } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as NetServer } from "http"; 
import { Server as SocketIOServer } from "socket.io";
import { Server as IoServer } from "socket.io";
type NextApiResponseServerIO = NextApiResponse & {
    socket: {
      server: NetServer & {
        io: IoServer;
      };
    };
  };
const ioHandler = (req:NextApiRequest, res:NextApiResponseServerIO) => {
  if (res.socket && !res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("New client connected", socket.id);

      socket.on("offer", (data) => {
        socket.broadcast.emit("offer", data);
      });

      socket.on("answer", (data) => {
        socket.broadcast.emit("answer", data);
      });

      socket.on("ice-candidate", (data) => {
        socket.broadcast.emit("ice-candidate", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
