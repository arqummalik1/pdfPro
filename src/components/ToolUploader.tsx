'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const isToolSupported = END_TO_END_TOOL_ID_SET.has(toolId);

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
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setResults([]);
    setGlobalError(null);
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
            blob: await rotatePdf(file0, 90),
            fileName: 'rotated.pdf',
          }];
          break;

        case 'delete-pages':
          // Default: delete page 2
          nextResults = [{
            blob: await deletePages(file0, [2]),
            fileName: 'pages-deleted.pdf',
          }];
          break;

        case 'extract-pages':
          // Default: extract page 1
          nextResults = [{
            blob: await extractPages(file0, [1]),
            fileName: 'extracted-pages.pdf',
          }];
          break;

        case 'watermark-pdf':
          nextResults = [{
            blob: await addWatermark(file0, {
              text: 'WATERMARK',
              fontSize: 48,
              opacity: 0.3,
              rotation: -45,
              position: 'center',
            }),
            fileName: 'watermarked.pdf',
          }];
          break;

        case 'sign-pdf':
          nextResults = [{
            blob: await signPdf(file0, { text: 'Signed' }),
            fileName: 'signed.pdf',
          }];
          break;

        case 'unlock-pdf':
          nextResults = [{
            blob: await unlockPdf(file0, 'password123'),
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
        <div className="p-4 md:p-8 bg-green-50 border border-green-200 rounded-xl text-center">
          <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-bold text-green-900 mb-1 md:mb-2">
            Processing Complete!
          </h3>
          <p className="text-sm md:text-base text-green-700 mb-4 px-2">
            {results.length === 1
              ? `Your ${toolName} file is ready to download`
              : `${results.length} PDF files are ready to download`}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 md:gap-3">
            {results.map((processedResult) => (
              <button
                key={processedResult.fileName}
                onClick={() => handleDownload(processedResult)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span className="truncate max-w-[200px]">
                  {results.length === 1 ? 'Download Result' : `Download ${processedResult.fileName}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
