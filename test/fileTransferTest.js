// Simple test to verify file chunking
import { readFileAsArrayBuffer, chunkFile } from '../src/utils/fileUtils.js';

// Test with a small text file
const testFileTransfer = async () => {
  // Create a test blob
  const testData = 'Hello World! This is a test file for the file transfer application.';
  const blob = new Blob([testData], { type: 'text/plain' });
  
  try {
    const arrayBuffer = await readFileAsArrayBuffer(blob);
    const chunks = chunkFile(arrayBuffer, 10); // Small chunks for testing
    
    console.log('Original data:', testData);
    console.log('Array buffer size:', arrayBuffer.byteLength);
    console.log('Number of chunks:', chunks.length);
    
    // Reconstruct the data
    let reconstructed = '';
    chunks.forEach((chunk, index) => {
      const chunkData = String.fromCharCode(...new Uint8Array(chunk));
      console.log(`Chunk ${index}:`, chunkData);
      reconstructed += chunkData;
    });
    
    console.log('Reconstructed data:', reconstructed);
    console.log('Match:', reconstructed === testData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
if (typeof window !== 'undefined') {
  window.testFileTransfer = testFileTransfer;
  console.log('Test function available as window.testFileTransfer()');
}
