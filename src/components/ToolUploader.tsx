'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Download, FileCheck, Share2, RefreshCw } from 'lucide-react';
import { 
  mergePdfs, 
  compressPdf, 
  rotatePdf, 
  splitPdf, 
  deletePages, 
  extractPages,
  addWatermark,
  signPdf,
  unlockPdf,
  addPageNumbers,
  downloadBlob,
  validatePdfFile,
  formatFileSize,
  ApiError
} from '@/lib/api';
import { END_TO_END_TOOL_ID_SET } from '@/lib/tools-config';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ProcessedResult {
  fileName: string;
  blob: Blob;
}

interface ToolUploaderProps {
  toolId: string;
  toolName: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onSuccess?: (blob: Blob) => void;
}

function decodeBase64Pdf(base64: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: 'application/pdf' });
}

export default function ToolUploader({ 
  toolId, 
  toolName,
  multiple = false, 
  maxFiles = 30,
  maxSize = 100 * 1024 * 1024,
  onSuccess
}: ToolUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [hasSignatureStroke, setHasSignatureStroke] = useState(false);
  const [pageSelection, setPageSelection] = useState('1');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('WATERMARK');
  const [rotationAngle, setRotationAngle] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const isToolSupported = END_TO_END_TOOL_ID_SET.has(toolId);

  // Initialize Canvas for Drawing
  useEffect(() => {
    if (toolId === 'sign-pdf' && signatureMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [toolId, signatureMode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasSignatureStroke(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignatureStroke(false);
  };

  const getCanvasBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const getTypedSignatureBlob = async (): Promise<Blob | null> => {
    const text = typedSignature.trim();
    if (!text) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Transparent background lets the signature blend naturally on PDFs.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.textBaseline = 'middle';
    ctx.font = "64px 'Noto Sans', 'Segoe UI', Arial, sans-serif";
    ctx.fillText(text, 24, canvas.height / 2);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const parsePageSelectionInput = (value: string): number[] => {
    return value
      .split(',')
      .flatMap((part) => {
        const token = part.trim();
        if (!token) return [];
        if (token.includes('-')) {
          const [start, end] = token.split('-').map((n) => Number(n.trim()));
          if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        const n = Number(token);
        return Number.isFinite(n) ? [n] : [];
      })
      .filter(Number.isFinite);
  };

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const currentCount = files.length;

    Array.from(selectedFiles).forEach((file) => {
      // Check max files
      if (currentCount + newFiles.length >= maxFiles) {
        setGlobalError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file
      const validation = validatePdfFile(file);
      if (!validation.valid) {
        setGlobalError(validation.error || 'Invalid file');
        return;
      }

      newFiles.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
      });
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setGlobalError(null);
    }
  }, [files.length, maxFiles]);

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResults([]);
    setGlobalError(null);
    if (toolId === 'sign-pdf') {
      clearCanvas();
      setTypedSignature('');
    }
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setResults([]);
    setGlobalError(null);
    if (toolId === 'sign-pdf') {
      clearCanvas();
      setTypedSignature('');
    }
  };

  // Process PDF
  const processPdf = async () => {
    if (!isToolSupported) {
      setGlobalError(`${toolName} is not available in the current release yet.`);
      return;
    }

    if (files.length === 0) {
      setGlobalError('Please select at least one file');
      return;
    }

    // Check minimum files for merge
    if (toolId === 'merge-pdf' && files.length < 2) {
      setGlobalError('Please select at least 2 files to merge');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setResults([]);

    // Update file statuses
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

    try {
      let nextResults: ProcessedResult[] = [];
      const file0 = files[0].file;

      switch (toolId) {
        case 'merge-pdf':
          nextResults = [{
            blob: await mergePdfs(files.map(f => f.file)),
            fileName: 'merged.pdf',
          }];
          break;

        case 'compress-pdf':
          nextResults = [{
            blob: await compressPdf(file0, 'medium'),
            fileName: 'compressed.pdf',
          }];
          break;

        case 'split-pdf': {
          const splitResult = await splitPdf(file0, { mode: 'pages' });
          nextResults = splitResult.files.map((splitFile, index) => ({
            blob: decodeBase64Pdf(splitFile.buffer),
            fileName: `split-page-${index + 1}.pdf`,
          }));
          break;
        }

        case 'rotate-pdf':
          nextResults = [{
            blob: await rotatePdf(file0, rotationAngle),
            fileName: 'rotated.pdf',
          }];
          break;

        case 'delete-pages': {
          const pages = parsePageSelectionInput(pageSelection);
          if (pages.length === 0) {
            throw new Error('Please enter valid page numbers (example: 2 or 2,4-6).');
          }
          nextResults = [{
            blob: await deletePages(file0, pages),
            fileName: 'pages-deleted.pdf',
          }];
          break;
        }

        case 'extract-pages': {
          const pages = parsePageSelectionInput(pageSelection);
          if (pages.length === 0) {
            throw new Error('Please enter valid page numbers (example: 1 or 1,3-5).');
          }
          nextResults = [{
            blob: await extractPages(file0, pages),
            fileName: 'extracted-pages.pdf',
          }];
          break;
        }

        case 'watermark-pdf':
          nextResults = [{
            blob: await addWatermark(file0, {
              text: watermarkText.trim() || 'WATERMARK',
              fontSize: 48,
              opacity: 0.3,
              rotation: -45,
              position: 'center',
            }),
            fileName: 'watermarked.pdf',
          }];
          break;

        case 'sign-pdf': {
          if (signatureMode === 'draw' && !hasSignatureStroke) {
            throw new Error('Please draw your signature before signing the PDF.');
          }

          if (signatureMode === 'type' && !typedSignature.trim()) {
            throw new Error('Please type your signature before signing the PDF.');
          }

          const signatureBlob =
            signatureMode === 'draw'
              ? await getCanvasBlob()
              : await getTypedSignatureBlob();

          if (!signatureBlob) {
            throw new Error('Unable to generate signature image. Please try again.');
          }

          const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });

          nextResults = [{
            blob: await signPdf(file0, { 
              signatureImage: signatureFile,
              pageNumber: 1,
              x: 100,
              y: 100,
              width: 150
            }),
            fileName: 'signed.pdf',
          }];
          break;
        }

        case 'unlock-pdf':
          if (!unlockPassword.trim()) {
            throw new Error('Please enter the PDF password to unlock the file.');
          }
          nextResults = [{
            blob: await unlockPdf(file0, unlockPassword),
            fileName: 'unlocked.pdf',
          }];
          break;

        case 'page-numbers':
          nextResults = [{
            blob: await addPageNumbers(file0, {
              position: 'bottom-center',
              includeTotal: true,
            }),
            fileName: 'page-numbers.pdf',
          }];
          break;

        default:
          throw new Error(`${toolName} is not available in the current release yet.`);
      }

      if (nextResults.length === 0) {
        throw new Error(`No output was generated for ${toolName}.`);
      }

      // Set result
      setResults(nextResults);

      // Update file statuses
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' as const })));

      // Callback
      if (onSuccess) {
        onSuccess(nextResults[0].blob);
      }

    } catch (error) {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setGlobalError(errorMessage);

      // Update file statuses
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const,
        error: errorMessage 
      })));
    } finally {
      setIsProcessing(false);
    }
  };

  // Download result
  const handleDownload = (processedResult: ProcessedResult) => {
    downloadBlob(processedResult.blob, processedResult.fileName);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {!isToolSupported && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{toolName} is listed in the catalog, but the processing flow is not implemented yet.</p>
        </div>
      )}

      {/* Global Error Message */}
      {globalError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{globalError}</p>
          <button 
            onClick={() => setGlobalError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing && isToolSupported) {
            inputRef.current?.click();
          }
        }}
        className={`
          relative border-2 border-dashed rounded-xl md:rounded-2xl p-6 sm:p-12 text-center 
          cursor-pointer transition-all duration-200
          ${isProcessing || !isToolSupported
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${files.length > 0 && toolId === 'sign-pdf' ? 'hidden' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isProcessing || !isToolSupported}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto animate-spin" />
            <p className="text-gray-600 font-medium text-sm md:text-base">Processing your PDF...</p>
            <p className="text-xs md:text-sm text-gray-400">This may take a moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-base md:text-lg font-medium text-gray-900 px-4">
                Drag & drop files for {toolName}
              </p>
              <p className="text-gray-500 text-sm hidden sm:block">or</p>
            </div>
            <button
              type="button"
              disabled={!isToolSupported}
              className="px-6 py-2 bg-red-500 text-white text-sm md:text-base font-medium rounded-lg 
                         hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                if (isToolSupported) {
                  inputRef.current?.click();
                }
              }}
            >
              Select Files
            </button>
            <p className="text-[10px] md:text-xs text-gray-400 mt-4 leading-relaxed">
              Max size: {formatFileSize(maxSize)} • 
              {multiple ? ` Up to ${maxFiles} files` : ' Single file'} • 
              PDF only
            </p>
          </div>
        )}
      </div>

      {/* Signature Pad (Only for sign-pdf tool after file is selected) */}
      {toolId === 'sign-pdf' && files.length > 0 && results.length === 0 && (
        <div className="space-y-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm">2</span>
              Create Your Signature
            </h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSignatureMode('draw')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${signatureMode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Draw
              </button>
              <button
                onClick={() => setSignatureMode('type')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${signatureMode === 'type' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Type
              </button>
            </div>
          </div>

          {signatureMode === 'draw' ? (
            <div className="space-y-4">
              <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 touch-none">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] sm:h-[200px] cursor-crosshair"
                />
                <button
                  onClick={clearCanvas}
                  className="absolute bottom-3 right-3 p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-lg shadow-sm border border-gray-200 transition-all"
                  title="Clear signature"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center italic">Sign inside the box above using your mouse or touch screen</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your name here..."
                className="w-full px-6 py-4 text-2xl border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-all italic text-gray-900"
                style={{ fontFamily: "'Dancing Script', cursive, serif" }}
              />
              <p className="text-xs text-gray-400 text-center italic">Type your name above for a digital signature</p>
            </div>
          )}
        </div>
      )}

      {/* Tool-Specific Controls */}
      {files.length > 0 && results.length === 0 && (toolId === 'delete-pages' || toolId === 'extract-pages' || toolId === 'unlock-pdf' || toolId === 'watermark-pdf' || toolId === 'rotate-pdf') && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          {(toolId === 'delete-pages' || toolId === 'extract-pages') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Page Selection
              </label>
              <input
                type="text"
                value={pageSelection}
                onChange={(e) => setPageSelection(e.target.value)}
                placeholder="Example: 1,3-5"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500">Use commas and ranges (for example: `1,3-5`).</p>
            </div>
          )}

          {toolId === 'unlock-pdf' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                PDF Password
              </label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter your PDF password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
              />
            </div>
          )}

          {toolId === 'watermark-pdf' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="WATERMARK"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
              />
            </div>
          )}

          {toolId === 'rotate-pdf' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rotation Angle
              </label>
              <select
                value={rotationAngle}
                onChange={(e) => setRotationAngle(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
              >
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-medium text-gray-900 text-sm md:text-base">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={clearFiles}
              className="text-xs md:text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 md:p-4 bg-white 
                           rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {uploadedFile.status === 'uploading' ? (
                      <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-spin" />
                    ) : uploadedFile.status === 'success' ? (
                      <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    ) : uploadedFile.status === 'error' ? (
                      <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                    ) : (
                      <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm md:text-base truncate pr-2">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-500 truncate">{uploadedFile.error}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      {files.length > 0 && results.length === 0 && (
        <button
          onClick={processPdf}
          disabled={isProcessing || files.length === 0 || !isToolSupported}
          className={`
            w-full py-3 md:py-4 px-6 font-semibold rounded-xl transition-all shadow-sm
            ${isProcessing || files.length === 0 || !isToolSupported
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </span>
          ) : (
            `${toolName} ${files.length !== 1 ? `(${files.length} files)` : ''}`.trim()
          )}
        </button>
      )}

      {/* Result */}
      {results.length > 0 && (
        <div className="relative overflow-hidden bg-white border-2 border-green-500 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-500">
          {/* Success Banner */}
          <div className="bg-green-500 p-4 text-white flex items-center justify-center gap-3">
            <CheckCircle className="w-6 h-6 animate-bounce" />
            <span className="font-bold text-lg">Processing Complete!</span>
          </div>
          
          <div className="p-6 md:p-10 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileCheck className="w-10 h-10" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Your PDF is ready!
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              {results.length === 1
                ? `The ${toolName} operation was successful. You can now download your file below.`
                : `We successfully generated ${results.length} files for you. Download them individually or all at once.`}
            </p>
            
            <div className="flex flex-col gap-4">
              {results.map((processedResult) => (
                <div 
                  key={processedResult.fileName}
                  className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4 sm:mb-0">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-[240px]">
                        {processedResult.fileName}
                      </p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">PDF Document</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(processedResult)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={clearFiles}
                className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Start Over
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'PDFPro - Free PDF Tools',
                      text: 'I just processed my PDF for free using PDFPro!',
                      url: window.location.href,
                    });
                  }
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-500 font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Tool
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
        </div>
      )}

    </div>
  );
}
