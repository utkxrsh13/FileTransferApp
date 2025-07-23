import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiUpload, FiCheck, FiX } from 'react-icons/fi';
import { formatFileSize } from '../utils/fileUtils';

const TransferProgress = ({ 
  transfer, 
  isIncoming = false, 
  onAccept, 
  onReject, 
  onCancel 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'accepted':
      case 'transferring':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'rejected':
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = () => {
    if (isIncoming) {
      return <FiDownload className="w-5 h-5" />;
    }
    return <FiUpload className="w-5 h-5" />;
  };

  const getStatusText = () => {
    switch (transfer.status) {
      case 'pending':
        return isIncoming ? 'Incoming file transfer' : 'Waiting for recipient';
      case 'accepted':
        return 'Transfer accepted';
      case 'transferring':
        return `Transferring... ${Math.round(transfer.progress || 0)}%`;
      case 'completed':
        return 'Transfer completed';
      case 'rejected':
        return 'Transfer rejected';
      case 'error':
        return 'Transfer failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border-2 rounded-lg p-4 ${getStatusColor(transfer.status)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {transfer.fileName}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatFileSize(transfer.fileSize)}
              {isIncoming && transfer.senderUsername && (
                <span> • From {transfer.senderUsername}</span>
              )}
              {!isIncoming && transfer.recipientUsername && (
                <span> • To {transfer.recipientUsername}</span>
              )}
            </p>
            <p className="text-sm font-medium mt-1">
              {getStatusText()}
            </p>
            
            {(transfer.status === 'transferring' || transfer.status === 'accepted') && transfer.progress !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{formatFileSize(transfer.receivedSize || 0)}</span>
                  <span>{formatFileSize(transfer.fileSize)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${transfer.progress || 0}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-blue-600 h-2 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          {transfer.status === 'pending' && isIncoming && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAccept(transfer.transferId)}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
                title="Accept transfer"
              >
                <FiCheck className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onReject(transfer.transferId)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                title="Reject transfer"
              >
                <FiX className="w-4 h-4" />
              </motion.button>
            </>
          )}
          
          {(transfer.status === 'transferring' || transfer.status === 'accepted') && !isIncoming && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onCancel(transfer.transferId)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              title="Cancel transfer"
            >
              <FiX className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransferProgress;
