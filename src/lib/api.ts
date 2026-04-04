/**
 * PDFPro API Client
 * Handles all backend API communication
 * 
 * @version 1.0.0
 */

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development' 
    ? 'http://localhost:10000/api/v1' 
    : 'https://pdfpro-s8il.onrender.com/api/v1';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
const API_BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

interface ApiErrorResponse {
  message?: string;
}

export interface SplitPdfResponse {
  success: boolean;
  files: Array<{
    buffer: string;
  }>;
  message?: string;
}

export interface PdfInfoResponse {
  success?: boolean;
  pageCount?: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  [key: string]: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  // Check content type to handle different response types
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    
    if (contentType?.includes('application/json')) {
      const error = (await response.json()) as ApiErrorResponse;
      errorMessage = error.message || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage);
  }

  // For PDF responses
  if (contentType?.includes('application/pdf')) {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
}

// ============================================================================
// PDF OPERATIONS
// ============================================================================

/**
 * Merge multiple PDF files into one
 * @param files - Array of PDF files to merge
 * @returns Promise<Blob> - Merged PDF
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  return fetchApi<Blob>('/merge', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Split PDF into pages
 * @param file - PDF file to split
 * @param options - Split options (mode, ranges, everyN)
 * @returns Promise<SplitPdfResponse> - Split result
 */
export async function splitPdf(
  file: File,
  options: { mode?: string; ranges?: number[][]; everyN?: number } = {}
): Promise<SplitPdfResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options.mode) formData.append('mode', options.mode);
  if (options.ranges) formData.append('ranges', JSON.stringify(options.ranges));
  if (options.everyN) formData.append('pagesPerFile', String(options.everyN));

  return fetchApi('/split', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Compress PDF file
 * @param file - PDF file to compress
 * @param level - Compression level (low, medium, high)
 * @returns Promise<Blob> - Compressed PDF
 */
export async function compressPdf(file: File, level: string = 'medium'): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('level', level);

  return fetchApi<Blob>('/compress', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Rotate PDF pages
 * @param file - PDF file
 * @param rotation - Rotation angle (90, 180, 270)
 * @param pages - Specific pages to rotate (optional)
 * @returns Promise<Blob> - Rotated PDF
 */
export async function rotatePdf(
  file: File,
  rotation: number = 90,
  pages?: Record<number, number>
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('rotation', String(rotation));
  if (pages) formData.append('pages', JSON.stringify(pages));

  return fetchApi<Blob>('/rotate', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Delete specific pages from PDF
 * @param file - PDF file
 * @param pages - Array of page numbers to delete
 * @returns Promise<Blob> - Modified PDF
 */
export async function deletePages(file: File, pages: number[]): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pages', JSON.stringify(pages));

  return fetchApi<Blob>('/delete-pages', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Extract specific pages from PDF
 * @param file - PDF file
 * @param pages - Array of page numbers to extract
 * @returns Promise<Blob> - Extracted PDF
 */
export async function extractPages(file: File, pages: number[]): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pages', JSON.stringify(pages));

  return fetchApi<Blob>('/extract', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Reorder PDF pages
 * @param file - PDF file
 * @param order - New page order (e.g., [3,1,2])
 * @returns Promise<Blob> - Reordered PDF
 */
export async function reorderPages(file: File, order: number[]): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('order', JSON.stringify(order));

  return fetchApi<Blob>('/reorder', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Add watermark to PDF
 * @param file - PDF file
 * @param options - Watermark options
 * @returns Promise<Blob> - Watermarked PDF
 */
export async function addWatermark(
  file: File,
  options: {
    type?: string;
    text?: string;
    image?: File;
    fontSize?: number;
    color?: string;
    opacity?: number;
    rotation?: number;
    position?: string;
    tiled?: boolean;
  } = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      const fieldName = key === 'signatureImage' ? 'signature' : key;

      if (value instanceof File) {
        formData.append(fieldName, value);
      } else {
        formData.append(fieldName, String(value));
      }
    }
  });

  return fetchApi<Blob>('/watermark', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Sign PDF
 * @param file - PDF file
 * @param options - Signature options
 * @returns Promise<Blob> - Signed PDF
 */
export async function signPdf(
  file: File,
  options: {
    type?: string;
    text?: string;
    signatureImage?: File;
    signerName?: string;
    reason?: string;
    pageNumber?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return fetchApi<Blob>('/sign', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Protect PDF with password
 * @param file - PDF file
 * @param password - Password
 * @param options - Permission options
 * @returns Promise<Blob> - Protected PDF
 */
export async function protectPdf(
  file: File,
  password: string,
  options: { allowPrint?: boolean; allowCopy?: boolean; allowEdit?: boolean; allowModify?: boolean } = {}
): Promise<Blob> {
  const formData = new FormData();
  const allowModify = options.allowModify ?? options.allowEdit ?? true;

  formData.append('file', file);
  formData.append('password', password);
  formData.append('allowPrint', String(options.allowPrint ?? true));
  formData.append('allowCopy', String(options.allowCopy ?? true));
  formData.append('allowModify', String(allowModify));

  return fetchApi<Blob>('/protect', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Unlock PDF
 * @param file - Protected PDF file
 * @param password - Password
 * @returns Promise<Blob> - Unlocked PDF
 */
export async function unlockPdf(file: File, password: string): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  return fetchApi<Blob>('/unlock', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Add page numbers
 * @param file - PDF file
 * @param options - Page number options
 * @returns Promise<Blob> - Numbered PDF
 */
export async function addPageNumbers(
  file: File,
  options: {
    position?: string;
    startNumber?: number;
    fontSize?: number;
    includeTotal?: boolean;
    format?: string;
  } = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });

  return fetchApi<Blob>('/page-numbers', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get PDF info/metadata
 * @param file - PDF file
 * @returns Promise<PdfInfoResponse> - PDF metadata
 */
export async function getPdfInfo(file: File): Promise<PdfInfoResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchApi('/info', {
    method: 'POST',
    body: formData,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Download a Blob as a file
 * @param blob - File blob
 * @param filename - Download filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate PDF file
 * @param file - File to validate
 * @returns Object with validation result
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
  }

  // Check file is not empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const apiClient = {
  mergePdfs,
  splitPdf,
  compressPdf,
  rotatePdf,
  deletePages,
  extractPages,
  reorderPages,
  addWatermark,
  signPdf,
  protectPdf,
  unlockPdf,
  addPageNumbers,
  getPdfInfo,
  downloadBlob,
  validatePdfFile,
  formatFileSize,
  ApiError,
};

export default apiClient;
