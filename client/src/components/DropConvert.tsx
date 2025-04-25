import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Cloud, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  FileImage,
  Download,
  Loader,
  Zap,
  ArrowLeftRight
} from 'lucide-react';
import { 
  formatFileSize, 
  getBrowserCapabilities, 
  readFileOptimized,
  createDownloadUrl 
} from '@/lib/utils';
import { siteConfig } from '../config';

// Type for our accepted files
interface AcceptedFile extends File {
  path?: string;
}

// The main component (without memo yet)
function DropConvertInner() {
  const [isReady, setIsReady] = useState(true); // For MVP, set this to true directly
  const [files, setFiles] = useState<AcceptedFile[]>([]);
  const [status, setStatus] = useState<'idle' | 'ready' | 'processing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [processingFile, setProcessingFile] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState<number>(0); // Store file count for later reference
  
  // Mode selection: false = AVIF to JPG, true = JPG to AVIF
  // Use site configuration to determine default conversion mode
  const [jpgToAvif, setJpgToAvif] = useState(
    siteConfig.defaultConversionMode === 'jpgToAvif'
  );
  
  // Update the page title when conversion mode changes
  useEffect(() => {
    document.title = jpgToAvif 
      ? `${siteConfig.siteName} - Convert JPG to AVIF in your browser`
      : `${siteConfig.siteName} - Convert AVIF to JPG in your browser`;
  }, [jpgToAvif]);
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset state if we had a download before
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    
    const avifFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.avif') || 
      file.name.toLowerCase().endsWith('.png') || 
      file.name.toLowerCase().endsWith('.jpg') || 
      file.name.toLowerCase().endsWith('.jpeg')
    );
    
    if (avifFiles.length === 0) {
      setStatus('error');
      setErrorMessage('Please select image files (AVIF, PNG, JPG)');
      return;
    }
    
    // Always set status to 'ready' instead of auto-processing when files are added
    setFiles(avifFiles);
    setStatus('ready'); // This ensures the user needs to click convert
    setProgress(0);
  }, [downloadUrl]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/avif': ['.avif'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
  });
  
  // Check browser capabilities for optimized processing
  const capabilities = useMemo(() => getBrowserCapabilities(), []);
  
  // Use Web Workers for faster conversion if available
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize worker if supported
  useEffect(() => {
    // Cleanup any previous worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    // Only create worker if browser supports it
    if (capabilities.hasWebWorker) {
      try {
        // Create worker in try-catch since it may fail in some environments
        const worker = new Worker(new URL('../workers/conversion.worker.ts', import.meta.url), { 
          type: 'module' 
        });
        
        // Set up message handler
        worker.onmessage = (event) => {
          // Get current jpgToAvif state for debugging
          const currentJpgToAvifState = jpgToAvif;
          console.log('Worker message received:', event.data, 'jpgToAvif setting:', currentJpgToAvifState);
          
          const { 
            status: workerStatus, 
            progress: workerProgress, 
            file, 
            result, 
            error,
            isZipFile,
            outputMimeType,
            extension,
            originalFileName,
            type: messageType,
            // CRITICAL: Read these properties from the worker
            // The worker has the correct information about single vs multiple files
            fileCount: workerFileCount,
            isSingleFile: workerIsSingleFile,
            isMultiFile: workerIsMultiFile
          } = event.data;
          
          if (workerStatus === 'progress') {
            setProgress(workerProgress);
            setProcessingFile(file);
          } else if (workerStatus === 'success') {
            setProgress(100);
            const url = URL.createObjectURL(result);
            console.log('Worker conversion success, setting download URL:', url);
            setDownloadUrl(url);
            setStatus('success');
            
            // CRITICAL: Store the original file count in a local variable
            // that will be accessible in the setTimeout scope
            const originalFiles = [...files];
            const originalCount = originalFiles.length;
            console.log('Storing file count in closure for download:', originalCount);
            
            // Handle download based on number of files
            console.log('Triggering auto-download for conversion result...');
            setTimeout(() => {
              if (result instanceof Blob) {
                // Log the result object and file information
                console.log('Download result object:', result);
                console.log('Worker result blob size:', result.size, 'bytes, type:', result.type);
                
                // Make download MIME type decision based on file count and conversion type
                // Default to octet-stream to force download in all browsers
                let downloadMimeType = 'application/octet-stream';
                
                // Use ZIP MIME type for multiple files
                if (files.length > 1) {
                  downloadMimeType = 'application/zip';
                  console.log('Using ZIP MIME type for multiple files:', files.length);
                } else {
                  console.log('Using force-download MIME type for single file');
                }
                
                // Create a new blob with the download MIME type
                const forceDownloadBlob = new Blob([result], { type: downloadMimeType });
                const forceUrl = URL.createObjectURL(forceDownloadBlob);
                
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = forceUrl;
                
                // Use our closure-captured originalCount from when the success handler ran
                // This is more reliable than depending on React state or the files array
                // CRITICAL: This is the safe way to determine download format
                
                console.log('Captured original count in closure:', originalCount);
                console.log('Current file count in state:', fileCount);
                console.log('Current files array length:', files.length);
                
                // FINAL DECISION LOGIC:
                // 1. Use worker's isZipFile flag as our primary indicator (most reliable)
                // 2. Fall back to worker's file count
                // 3. Fall back to our closure variable (less reliable but better than files.length)
                // 4. Last resort: fall back to fileCount state
                
                // First check if worker is explicitly marking this as a ZIP file
                let shouldUseZip = isZipFile === true;
                
                // If worker didn't specify, use worker's file count or flags
                if (shouldUseZip === undefined) {
                  if (workerIsMultiFile === true) {
                    shouldUseZip = true;
                  } else if (workerIsSingleFile === true) {
                    shouldUseZip = false;
                  } else if (workerFileCount && workerFileCount > 1) {
                    shouldUseZip = true;
                  } else if (workerFileCount === 1) {
                    shouldUseZip = false;
                  }
                }
                
                // If still undefined, use our local tracking
                if (shouldUseZip === undefined) {
                  shouldUseZip = originalCount > 1;
                }
                
                // For debugging
                console.log('Download decision:', {
                  shouldUseZip,
                  isZipFile,
                  workerFileCount,
                  workerIsSingleFile,
                  workerIsMultiFile,
                  originalCount,
                  currentFileCount: fileCount
                });
                
                const actualFileCount = shouldUseZip ? 2 : 1; // Force correct path selection
                
                // FORCE single file paths for count===1 and ZIP for count>1
                // This ensures consistent download behavior
                if (actualFileCount === 1) {
                  // SINGLE FILE - always direct download with proper extension
                  // Make sure we preserve the file extension by explicitly setting it
                  // Use the originalFileName from the worker if available, otherwise generate it from the file
                  let baseFileName = originalFileName || 
                                    (files[0] ? files[0].name.replace(/\.(avif|png|jpe?g)$/i, '') : 'converted-file');
                  
                  // Then add the proper extension based on what we received from the worker
                  const fileExtension = extension || (jpgToAvif ? '.avif' : '.jpg');
                  const fileName = baseFileName + fileExtension;
                  
                  console.log('Downloading file with name:', fileName, 'extension:', fileExtension);
                  
                  downloadLink.download = fileName;
                  downloadLink.setAttribute('download', fileName); // Explicit download attribute
                  console.log('Auto-download triggered for single file via worker:', fileName);
                } else {
                  // ZIP download for batch processing
                  downloadLink.download = "converted_images.zip";
                  downloadLink.setAttribute('download', "converted_images.zip"); // Explicit download attribute
                  console.log('Auto-download triggered for ZIP with', files.length, 'files via worker');
                }
                
                // Force the download by using appropriate techniques for different browsers
                document.body.appendChild(downloadLink);
                
                // Create mouse event to trigger the click (more compatible with some browsers)
                const clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                downloadLink.dispatchEvent(clickEvent);
                
                // Clean up
                setTimeout(() => document.body.removeChild(downloadLink), 100);
              } else {
                console.error('Worker did not return a valid Blob:', result);
                setStatus('error');
                setErrorMessage('Conversion failed - invalid result');
              }
            }, 500);
          } else if (workerStatus === 'error') {
            setStatus('error');
            setErrorMessage(error || 'Conversion failed');
          }
        };
        
        workerRef.current = worker;
      } catch (err) {
        console.warn('Web Workers not fully supported, falling back to main thread processing', err);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [capabilities.hasWebWorker, jpgToAvif]); // Add jpgToAvif to the dependency array so the worker updates when it changes
  
  // Optimized conversion function with fallbacks for different browsers
  const convertFiles = async () => {
    if (files.length === 0 || status === 'processing') return;
    
    // IMPORTANT: Save the file count immediately when we start conversion
    // This ensures we maintain the correct count throughout the entire process
    const totalFiles = files.length;
    setFileCount(totalFiles);
    
    setStatus('processing');
    setProgress(0);
    setProcessingFile(0);
    
    try {
      
      console.log('Starting conversion with settings:', {
        fileCount: totalFiles,
        isSingleFile: totalFiles === 1,
        conversionMode: jpgToAvif ? 'JPG to AVIF' : 'AVIF to JPG'
      });
      
      // Try to use Web Worker for processing
      if (workerRef.current) {
        // Always use correct type based on file count 
        // Single file = direct download, multiple files = ZIP
        const processingType = totalFiles === 1 ? 'single' : 'batch';
        
        console.log(`Sending ${processingType} processing request to worker for ${totalFiles} file(s)`);
        
        // Send data to worker for processing
        // CRITICAL: Pass the totalFiles value to the worker as we know it's accurate at this point
        workerRef.current.postMessage({
          type: processingType,
          files,
          jpgToAvif, // Include conversion mode
          totalFiles, // Pass the actual file count to ensure worker has it
          isSingleFile: totalFiles === 1
        });
        return; // Worker will handle the rest via onmessage
      }
      
      // Fallback to main thread processing if worker isn't available
      if (totalFiles === 1) {
        // Single file conversion
        const file = files[0];
        
        setProcessingFile(1);
        
        // Use optimized file reading
        const fileData = await readFileOptimized(file);
        
        // For MVP, simulate conversion with minimal delay
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 200)); // Faster in development
        }
        
        // Create a blob with proper MIME type based on conversion mode
        const blob = new Blob([fileData], { 
          type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
        });
        
        // Use optimized URL creation
        const { url } = createDownloadUrl(blob, file.name);
        
        setProgress(100);
        setDownloadUrl(url);
        setStatus('success');
        
        // Auto-download file after a short delay - force download with octet-stream
        setTimeout(() => {
          // Use application/octet-stream MIME type to force browser download behavior
          const forceDownloadBlob = new Blob([fileData], { 
            type: 'application/octet-stream'
          });
          const forceUrl = URL.createObjectURL(forceDownloadBlob);
          
          const downloadLink = document.createElement('a');
          downloadLink.href = forceUrl;
          // Make sure file exists and has a name property
          const safeFileName = file && file.name ? file.name : 'converted-file';
          const fileName = safeFileName.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
          downloadLink.download = fileName;
          downloadLink.setAttribute('download', fileName); // Explicit download attribute
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          console.log('Auto-download triggered for single file via main thread:', fileName);
        }, 500);
      } else {
        // Multiple files - batch processing with ZIP
        console.log(`Processing ${totalFiles} files in batch mode (main thread)`);
        
        // Show a progress indicator
        setProcessingFile(1);
        
        try {
          // Create a ZIP file with JSZip
          const zip = new JSZip();
          
          // Process each file
          for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            
            // Update processing indicator
            setProcessingFile(i + 1);
            setProgress(Math.round(((i + 1) / totalFiles) * 70)); // Up to 70% for processing
            
            // Get the file data
            const fileData = await readFileOptimized(file);
            
            // Add to ZIP with output extension based on conversion mode
            const outputName = file.name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
            zip.file(outputName, fileData);
          }
          
          // Update progress for ZIP generation
          setProgress(80);
          
          // Generate ZIP file - optimize compression level for speed on larger batches
          // Lower compression level = faster processing, slightly larger file
          const compressionLevel = totalFiles > 10 ? 3 : 6;
          
          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
              level: compressionLevel
            },
            streamFiles: true // Better performance for large ZIPs
          });
          
          setProgress(100);
          
          // Create download URL
          const url = URL.createObjectURL(zipBlob);
          setDownloadUrl(url);
          setStatus('success');
          
          // Trigger auto-download of the ZIP file
          setTimeout(() => {
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'converted_images.zip';
            downloadLink.setAttribute('download', 'converted_images.zip'); // Explicit download attribute
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            console.log('Auto-download triggered for ZIP file via main thread');
          }, 500);
        } catch (err: any) {
          console.error('Error during batch conversion:', err);
          setStatus('error');
          setErrorMessage(err.message || 'Error creating ZIP file');
        }
      }
    } catch (err: any) {
      console.error('Error during conversion process:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Conversion failed');
    }
  };
  
  // Reset the state when an error occurs or for a new conversion
  const resetConversion = () => {
    setStatus('idle');
    setErrorMessage('');
    setProgress(0);
    setProcessingFile(0);
    setFiles([]);
    
    // Clean up any URLs to prevent memory leaks
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };
  
  // Toggle between JPG-to-AVIF and AVIF-to-JPG modes
  // This controls the direction of conversion
  const toggleConversionMode = useCallback(() => {
    setJpgToAvif(prev => !prev);
  }, []);
  
  // Display content based on the current status
  return (
    <div className="w-full max-w-3xl mx-auto bg-background/50 backdrop-blur-sm rounded-xl border shadow-sm p-5 mb-8">
      {/* Header with toggle for conversion direction */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Convert Images</h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${!jpgToAvif ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            AVIF to JPG
          </span>
          <Switch 
            checked={jpgToAvif} 
            onCheckedChange={toggleConversionMode} 
            className={jpgToAvif ? 'bg-primary' : ''}
          />
          <span className={`text-sm ${jpgToAvif ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            JPG to AVIF
          </span>
          <ArrowLeftRight className="ml-1.5 w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Main content area based on status */}
      {status === 'idle' && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <Cloud className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-lg font-medium mb-1">Drag & drop images here</p>
          <p className="text-sm text-muted-foreground mb-3">
            {jpgToAvif
              ? 'Convert JPG/PNG to space-saving AVIF format' 
              : 'Convert AVIF to widely-compatible JPG format'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = jpgToAvif 
                ? '.jpg,.jpeg,.png' 
                : '.avif';
              input.onchange = (e) => {
                // @ts-ignore
                if (e.target.files) {
                  // @ts-ignore
                  onDrop(Array.from(e.target.files));
                }
              };
              input.click();
            }}
          >
            <FileImage className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        </div>
      )}
      
      {status === 'ready' && (
        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Ready to Convert {files.length} {files.length === 1 ? 'File' : 'Files'}</h3>
            <p className="text-sm text-muted-foreground">
              {jpgToAvif
                ? 'Convert to space-saving AVIF format'
                : 'Convert to widely-compatible JPG format'}
            </p>
          </div>
          
          <div className="mb-4 max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="text-sm flex items-center text-muted-foreground">
                  <FileImage className="mr-2 h-3 w-3" />
                  {file.name} ({formatFileSize(file.size)})
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={convertFiles}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Conversion
            </Button>
            <Button
              variant="outline"
              onClick={resetConversion}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {status === 'processing' && (
        <div className="rounded-lg border p-6 text-center">
          <Loader className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <h3 className="text-lg font-medium mb-2">Converting Files...</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {processingFile > 0 && files.length > 1 
              ? `Processing file ${processingFile} of ${files.length}` 
              : 'Processing your file...'}
          </p>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-6 text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">Conversion Complete!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {files.length === 1 
              ? 'Your file has been successfully converted' 
              : `All ${files.length} files have been converted and compressed into a ZIP file`}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                // Create a download link for the converted file
                if (downloadUrl) {
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = files.length === 1 
                    ? files[0].name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg')
                    : 'converted_images.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="mr-2 h-4 w-4" />
              {files.length === 1 ? 'Download File' : 'Download ZIP'}
            </Button>
            <Button
              variant="outline"
              onClick={resetConversion}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Convert More
            </Button>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="rounded-lg border border-destructive/10 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium mb-2">Conversion Failed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage || 'There was an error converting your files'}
          </p>
          <Button
            variant="outline"
            onClick={resetConversion}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// Create a memoized version of the component
const DropConvert = memo(DropConvertInner);

// Add display name for better debugging
DropConvert.displayName = 'DropConvert';

export default DropConvert;