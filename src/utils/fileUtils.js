// File utility functions

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  const videoTypes = ['mp4', 'avi', 'mkv', 'mov', 'wmv'];
  const audioTypes = ['mp3', 'wav', 'flac', 'aac'];
  
  if (imageTypes.includes(extension)) return 'image';
  if (documentTypes.includes(extension)) return 'document';
  if (videoTypes.includes(extension)) return 'video';
  if (audioTypes.includes(extension)) return 'audio';
  
  return 'other';
};

export const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'image':
      return '🖼️';
    case 'document':
      return '📄';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    default:
      return '📎';
  }
};

export const validateFile = (file, maxSize = 100 * 1024 * 1024) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size exceeds limit of ${formatFileSize(maxSize)}` 
    };
  }
  
  return { isValid: true };
};

export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

export const chunkFile = (arrayBuffer, chunkSize = 64 * 1024) => {
  const chunks = [];
  let offset = 0;
  
  while (offset < arrayBuffer.byteLength) {
    const chunk = arrayBuffer.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  
  return chunks;
};
