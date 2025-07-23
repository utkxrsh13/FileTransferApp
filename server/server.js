import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import process from 'process';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { authenticateSocket } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100MB max file size
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Routes
app.use('/api/auth', authRoutes);

// Store active users and transfers
const activeUsers = new Map();
const activeTransfers = new Map();

// Encryption utilities
const algorithm = 'aes-256-cbc';
const secretKey = crypto.randomBytes(32);

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function decryptData(encryptedData, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.username})`);
  
  // Store user info
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    username: socket.username,
    status: 'online'
  });

  console.log(`Active users: ${activeUsers.size}`);

  // Broadcast updated user list
  socket.broadcast.emit('userListUpdate', Array.from(activeUsers.entries()).map(([id, user]) => ({
    id,
    username: user.username,
    status: user.status
  })));

  // Send current user list to new user
  socket.emit('userListUpdate', Array.from(activeUsers.entries()).map(([id, user]) => ({
    id,
    username: user.username,
    status: user.status
  })));

  // Handle file transfer request
  socket.on('fileTransferRequest', (data) => {
    console.log(`File transfer request from ${socket.username}:`, data);
    const { recipientId, fileName, fileSize, fileType } = data;
    const recipient = activeUsers.get(recipientId);
    
    if (recipient) {
      const transferId = crypto.randomUUID();
      activeTransfers.set(transferId, {
        senderId: socket.userId,
        senderUsername: socket.username,
        recipientId,
        fileName,
        fileSize,
        fileType,
        status: 'pending',
        chunks: [],
        receivedSize: 0
      });

      console.log(`Sending transfer request to ${recipient.username} (ID: ${transferId})`);

      io.to(recipient.socketId).emit('incomingFileTransfer', {
        transferId,
        senderUsername: socket.username,
        fileName,
        fileSize,
        fileType
      });
    } else {
      console.log(`Recipient ${recipientId} not found or offline`);
      socket.emit('transferError', { message: 'Recipient not found or offline' });
    }
  });

  // Handle file transfer response
  socket.on('fileTransferResponse', (data) => {
    const { transferId, accepted } = data;
    const transfer = activeTransfers.get(transferId);
    
    if (transfer) {
      const sender = activeUsers.get(transfer.senderId);
      
      if (accepted) {
        transfer.status = 'accepted';
        activeTransfers.set(transferId, transfer);
        
        if (sender) {
          io.to(sender.socketId).emit('transferAccepted', { transferId });
        }
      } else {
        activeTransfers.delete(transferId);
        
        if (sender) {
          io.to(sender.socketId).emit('transferRejected', { transferId });
        }
      }
    }
  });

  // Handle file chunk transmission
  socket.on('fileChunk', (data) => {
    const { transferId, chunk, chunkIndex, isLastChunk } = data;
    const transfer = activeTransfers.get(transferId);
    
    if (transfer && transfer.status === 'accepted') {
      const recipient = activeUsers.get(transfer.recipientId);
      
      if (recipient) {
        // Store chunk data (chunk is already base64 encoded from client)
        transfer.chunks[chunkIndex] = chunk;
        
        // Calculate size from base64 string
        const chunkSize = Buffer.from(chunk, 'base64').length;
        transfer.receivedSize += chunkSize;
        
        const progress = (transfer.receivedSize / transfer.fileSize) * 100;
        
        // Send progress to both sender and recipient
        io.to(recipient.socketId).emit('transferProgress', {
          transferId,
          progress,
          receivedSize: transfer.receivedSize,
          totalSize: transfer.fileSize
        });
        
        const sender = activeUsers.get(transfer.senderId);
        if (sender) {
          io.to(sender.socketId).emit('transferProgress', {
            transferId,
            progress,
            receivedSize: transfer.receivedSize,
            totalSize: transfer.fileSize
          });
        }
        
        // Send chunk to recipient (we can add encryption here later if needed)
        io.to(recipient.socketId).emit('fileChunk', {
          transferId,
          chunk,
          chunkIndex,
          isLastChunk
        });
        
        if (isLastChunk) {
          transfer.status = 'completed';
          activeTransfers.set(transferId, transfer);
          
          io.to(recipient.socketId).emit('transferCompleted', {
            transferId,
            fileName: transfer.fileName,
            fileType: transfer.fileType
          });
          
          if (sender) {
            io.to(sender.socketId).emit('transferCompleted', {
              transferId,
              fileName: transfer.fileName,
              fileType: transfer.fileType
            });
          }
        }
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    activeUsers.delete(socket.userId);
    
    // Broadcast updated user list
    socket.broadcast.emit('userListUpdate', Array.from(activeUsers.entries()).map(([id, user]) => ({
      id,
      username: user.username,
      status: user.status
    })));
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
