import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiLogOut, FiUser, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import FileUpload from '../components/FileUpload';
import UserList from '../components/UserList';
import TransferProgress from '../components/TransferProgress';
import { readFileAsArrayBuffer, chunkFile } from '../utils/fileUtils';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected, onlineUsers } = useSocket();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [incomingFiles, setIncomingFiles] = useState(new Map()); // Store incoming file chunks

  // Helper function to reconstruct file from chunks
  const reconstructFile = (chunks) => {
    const uint8Arrays = chunks.map(chunk => {
      // Convert base64 back to Uint8Array
      const binaryString = atob(chunk);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    });
    
    // Calculate total length
    const totalLength = uint8Arrays.reduce((sum, arr) => sum + arr.length, 0);
    
    // Combine all chunks
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of uint8Arrays) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  };

  useEffect(() => {
    if (!socket) return;

    const startFileTransfer = async (transferId) => {
      if (!selectedFile || !socket) return;

      setIsTransferring(true);

      try {
        const arrayBuffer = await readFileAsArrayBuffer(selectedFile);
        const chunks = chunkFile(arrayBuffer);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const isLastChunk = i === chunks.length - 1;
          
          // Convert ArrayBuffer to base64 for transmission
          const base64Chunk = btoa(String.fromCharCode(...new Uint8Array(chunk)));
          
          socket.emit('fileChunk', {
            transferId,
            chunk: base64Chunk,
            chunkIndex: i,
            isLastChunk
          });

          // Small delay to prevent overwhelming the socket
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error('File transfer error:', error);
        toast.error('Failed to transfer file');
        setIsTransferring(false);
      }
    };

    // Listen for incoming file transfer requests
    socket.on('incomingFileTransfer', (data) => {
      setTransfers(prev => [...prev, {
        ...data,
        status: 'pending',
        isIncoming: true
      }]);
      toast(`File transfer request from ${data.senderUsername}`, {
        icon: '📁',
        duration: 5000
      });
    });

    // Listen for transfer acceptance
    socket.on('transferAccepted', (data) => {
      setTransfers(prev => prev.map(transfer => 
        transfer.transferId === data.transferId 
          ? { ...transfer, status: 'accepted' }
          : transfer
      ));
      toast.success('Transfer accepted! Starting file transfer...');
      
      // Start sending file chunks
      if (selectedFile) {
        startFileTransfer(data.transferId);
      }
    });

    // Listen for transfer rejection
    socket.on('transferRejected', (data) => {
      toast.error('File transfer was rejected');
      setTransfers(prev => prev.filter(t => t.transferId !== data.transferId));
    });

    // Listen for transfer progress
    socket.on('transferProgress', (data) => {
      setTransfers(prev => prev.map(transfer => 
        transfer.transferId === data.transferId 
          ? { 
              ...transfer, 
              progress: data.progress,
              receivedSize: data.receivedSize,
              status: 'transferring'
            }
          : transfer
      ));
    });

    // Listen for file chunks (incoming transfers)
    socket.on('fileChunk', (data) => {
      const { transferId, chunk, chunkIndex, isLastChunk } = data;
      console.log(`Received chunk ${chunkIndex} for transfer ${transferId}`);
      
      // Store the chunk
      setIncomingFiles(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(transferId)) {
          newMap.set(transferId, { chunks: [], expectedChunks: new Set() });
        }
        const fileData = newMap.get(transferId);
        fileData.chunks[chunkIndex] = chunk;
        fileData.expectedChunks.add(chunkIndex);
        
        // If this is the last chunk, try to reconstruct the file
        if (isLastChunk) {
          fileData.totalChunks = chunkIndex + 1;
          
          // Check if we have all chunks
          const hasAllChunks = fileData.chunks.length === fileData.totalChunks &&
            fileData.chunks.every(c => c !== undefined);
          
          if (hasAllChunks) {
            // Reconstruct the file
            try {
              const reconstructedData = reconstructFile(fileData.chunks);
              const transfer = transfers.find(t => t.transferId === transferId);
              
              if (transfer) {
                // Create download link
                const blob = new Blob([reconstructedData], { type: transfer.fileType || 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = transfer.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast.success(`File "${transfer.fileName}" downloaded successfully!`);
              }
              
              // Clean up
              newMap.delete(transferId);
            } catch (error) {
              console.error('Failed to reconstruct file:', error);
              toast.error('Failed to reconstruct file');
            }
          }
        }
        
        return newMap;
      });
    });

    // Listen for transfer completion
    socket.on('transferCompleted', (data) => {
      setTransfers(prev => prev.map(transfer => 
        transfer.transferId === data.transferId 
          ? { ...transfer, status: 'completed', progress: 100 }
          : transfer
      ));
      toast.success('File transfer completed!');
      setIsTransferring(false);
    });

    // Listen for transfer errors
    socket.on('transferError', (data) => {
      toast.error(data.message);
      setIsTransferring(false);
    });

    return () => {
      socket.off('incomingFileTransfer');
      socket.off('transferAccepted');
      socket.off('transferRejected');
      socket.off('transferProgress');
      socket.off('fileChunk');
      socket.off('transferCompleted');
      socket.off('transferError');
    };
  }, [socket, selectedFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedUser(null);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleSendFile = () => {
    if (!selectedFile || !selectedUser || !socket) {
      toast.error('Please select a file and recipient');
      return;
    }

    const transferData = {
      recipientId: selectedUser.id,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type
    };

    socket.emit('fileTransferRequest', transferData);
    
    // Add to local transfers list
    const transferId = Date.now().toString();
    setTransfers(prev => [...prev, {
      transferId,
      ...transferData,
      recipientUsername: selectedUser.username,
      status: 'pending',
      isIncoming: false
    }]);

    toast.success(`File transfer request sent to ${selectedUser.username}`);
  };

  const handleAcceptTransfer = (transferId) => {
    if (socket) {
      socket.emit('fileTransferResponse', { transferId, accepted: true });
    }
  };

  const handleRejectTransfer = (transferId) => {
    if (socket) {
      socket.emit('fileTransferResponse', { transferId, accepted: false });
    }
    setTransfers(prev => prev.filter(t => t.transferId !== transferId));
  };

  const handleCancelTransfer = (transferId) => {
    // Implement cancel logic if needed
    setTransfers(prev => prev.filter(t => t.transferId !== transferId));
    toast.info('Transfer cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                File Transfer App
              </h1>
              <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                connected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiUser className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </span>
              </div>
              
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select File to Transfer
              </h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClearFile={handleClearFile}
              />
              
              {selectedFile && selectedUser && (
                <motion.button
                  onClick={handleSendFile}
                  disabled={isTransferring || !connected}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>
                    {isTransferring ? 'Transferring...' : `Send to ${selectedUser.username}`}
                  </span>
                </motion.button>
              )}
            </div>

            {/* Transfer Progress */}
            {transfers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  File Transfers
                </h2>
                <div className="space-y-4">
                  {transfers.map((transfer) => (
                    <TransferProgress
                      key={transfer.transferId}
                      transfer={transfer}
                      isIncoming={transfer.isIncoming}
                      onAccept={handleAcceptTransfer}
                      onReject={handleRejectTransfer}
                      onCancel={handleCancelTransfer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User List Section */}
          <div>
            <UserList
              users={onlineUsers}
              onSelectUser={handleSelectUser}
              selectedUser={selectedUser}
              hasFileSelected={!!selectedFile}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
