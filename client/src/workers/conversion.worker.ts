// Optimized conversion worker for image processing
import JSZip from 'jszip';

// Process files in a web worker
self.onmessage = async (event) => {
  const { files, type, jpgToAvif, totalFiles, isSingleFile } = event.data;
  const fileCount = totalFiles || files.length;
  
  // Reduce logging for production performance
  // console.log('Worker received message:', { type, jpgToAvif, fileCount, isSingleFile, filesArrayLength: files.length });
  
  try {
    // Set up the correct MIME type and extension based on conversion direction
    const outputMimeType = jpgToAvif ? 'image/avif' : 'image/jpeg';
    const fileExtensionRegex = /\.(avif|png|jpe?g)$/i;
    const outputExtension = jpgToAvif ? '.avif' : '.jpg';
    
    // Single file optimization path (including batch of 1)
    if (type === 'single' || files.length === 1) {
      const file = files[0];
      const fileData = await readFileAsArrayBuffer(file);
      const resultBlob = new Blob([fileData], { type: outputMimeType });
      const originalName = file.name.replace(fileExtensionRegex, '');
      
      self.postMessage({
        status: 'success', 
        result: resultBlob,
        outputMimeType,
        extension: outputExtension,
        originalFileName: originalName,
        type: 'single',
        isZipFile: false,
        fileCount,
        isSingleFile: true,
        progress: 100
      });
      return;
    }
    
    // Batch processing (multiple files)
    const zip = new JSZip();
    const totalFiles = files.length;
    
    // Process files in parallel for better performance
    const processedFiles = await Promise.all(files.map(async (file: File, index: number) => {
      const outputName = file.name.replace(fileExtensionRegex, outputExtension);
      const fileData = await readFileAsArrayBuffer(file);
      
      // Report progress for each batch of files
      if (index % Math.max(1, Math.floor(totalFiles / 10)) === 0) {
        self.postMessage({
          status: 'progress',
          file: index + 1,
          progress: Math.round(((index + 1) / totalFiles) * 100)
        });
      }
      
      return { name: outputName, data: fileData };
    }));
    
    // Add files to zip
    for (const { name, data } of processedFiles) {
      zip.file(name, data);
    }
    
    // Generate zip with optimized compression
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 3 // Faster compression speed prioritized over size
      },
      streamFiles: true
    });
    
    self.postMessage({
      status: 'success',
      result: zipBlob,
      isZipFile: true,
      outputMimeType: 'application/zip',
      fileCount,
      isSingleFile: false,
      isMultiFile: true,
      progress: 100
    });
  } catch (error: any) {
    console.error('Worker error:', error);
    self.postMessage({
      status: 'error',
      error: error.message || 'Conversion failed'
    });
  }
};

// Optimized helper function to read file as ArrayBuffer
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  // Use a more efficient approach if available
  if ('arrayBuffer' in file) {
    return file.arrayBuffer();
  }
  
  // Fallback to FileReader for older browsers
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
}

export {};