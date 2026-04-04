// Master Tool Registry - Powers homepage, sitemap, navigation, and SEO

export interface Tool {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  category: string;
  icon: string;
  color: string;
  popularity: number; // 1-10, based on search volume
}

export interface ToolCategory {
  id: string;
  name: string;
  tools: Tool[];
}

// All PDF tools organized by category
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'organize',
    name: 'Organize PDF',
    tools: [
      { id: 'merge-pdf', label: 'Merge PDF', description: 'Combine multiple PDF files into one', keywords: ['merge pdf', 'combine pdf', 'join pdf'], category: 'organize', icon: 'layers', color: '#E53935', popularity: 10 },
      { id: 'split-pdf', label: 'Split PDF', description: 'Divide PDF into multiple files', keywords: ['split pdf', 'separate pdf', 'extract pdf pages'], category: 'organize', icon: 'scissors', color: '#D32F2F', popularity: 8 },
      { id: 'compress-pdf', label: 'Compress PDF', description: 'Reduce PDF file size', keywords: ['compress pdf', 'reduce pdf size', 'optimize pdf'], category: 'organize', icon: 'archive', color: '#C62828', popularity: 9 },
      { id: 'organize-pages', label: 'Organize Pages', description: 'Reorder, delete, rotate pages visually', keywords: ['organize pdf pages', 'reorder pdf pages'], category: 'organize', icon: 'grid', color: '#B71C1C', popularity: 6 },
      { id: 'extract-pages', label: 'Extract Pages', description: 'Extract specific pages to new PDF', keywords: ['extract pdf pages', 'extract pages from pdf'], category: 'organize', icon: 'file-minus', color: '#EF5350', popularity: 7 },
      { id: 'delete-pages', label: 'Delete Pages', description: 'Remove unwanted pages', keywords: ['delete pdf pages', 'remove pdf pages'], category: 'organize', icon: 'trash', color: '#E57373', popularity: 6 },
    ],
  },
  {
    id: 'convert-from',
    name: 'Convert from PDF',
    tools: [
      { id: 'pdf-to-word', label: 'PDF to Word', description: 'Convert PDF to editable DOCX', keywords: ['pdf to word', 'convert pdf to docx', 'pdf to microsoft word'], category: 'convert-from', icon: 'file-text', color: '#1E88E5', popularity: 9 },
      { id: 'pdf-to-excel', label: 'PDF to Excel', description: 'Convert PDF to XLSX spreadsheet', keywords: ['pdf to excel', 'convert pdf to xlsx'], category: 'convert-from', icon: 'table', color: '#1976D2', popularity: 7 },
      { id: 'pdf-to-ppt', label: 'PDF to PowerPoint', description: 'Convert PDF to PPTX slides', keywords: ['pdf to powerpoint', 'convert pdf to ppt'], category: 'convert-from', icon: 'presentation', color: '#1565C0', popularity: 5 },
      { id: 'pdf-to-jpg', label: 'PDF to JPG', description: 'Convert each page to JPG image', keywords: ['pdf to jpg', 'convert pdf to image', 'pdf to png'], category: 'convert-from', icon: 'image', color: '#0D47A1', popularity: 8 },
      { id: 'pdf-to-text', label: 'PDF to Text', description: 'Extract plain text from PDF', keywords: ['pdf to text', 'extract text from pdf'], category: 'convert-from', icon: 'align-left', color: '#42A5F5', popularity: 4 },
      { id: 'pdf-to-html', label: 'PDF to HTML', description: 'Convert PDF to HTML webpage', keywords: ['pdf to html', 'convert pdf to web'], category: 'convert-from', icon: 'code', color: '#2196F3', popularity: 3 },
    ],
  },
  {
    id: 'convert-to',
    name: 'Convert to PDF',
    tools: [
      { id: 'word-to-pdf', label: 'Word to PDF', description: 'Convert DOCX to PDF', keywords: ['word to pdf', 'docx to pdf'], category: 'convert-to', icon: 'file-text', color: '#43A047', popularity: 8 },
      { id: 'excel-to-pdf', label: 'Excel to PDF', description: 'Convert XLSX to PDF', keywords: ['excel to pdf', 'xlsx to pdf'], category: 'convert-to', icon: 'table', color: '#388E3C', popularity: 6 },
      { id: 'ppt-to-pdf', label: 'PowerPoint to PDF', description: 'Convert PPTX to PDF', keywords: ['ppt to pdf', 'powerpoint to pdf'], category: 'convert-to', icon: 'presentation', color: '#2E7D32', popularity: 4 },
      { id: 'jpg-to-pdf', label: 'JPG to PDF', description: 'Convert images to PDF', keywords: ['jpg to pdf', 'image to pdf', 'png to pdf'], category: 'convert-to', icon: 'image', color: '#66BB6A', popularity: 7 },
      { id: 'html-to-pdf', label: 'HTML to PDF', description: 'Convert webpage to PDF', keywords: ['html to pdf', 'url to pdf'], category: 'convert-to', icon: 'globe', color: '#4CAF50', popularity: 5 },
    ],
  },
  {
    id: 'edit',
    name: 'Edit PDF',
    tools: [
      { id: 'rotate-pdf', label: 'Rotate PDF', description: 'Rotate pages 90/180/270 degrees', keywords: ['rotate pdf', 'rotate pdf pages'], category: 'edit', icon: 'rotate-cw', color: '#FB8C00', popularity: 6 },
      { id: 'add-text', label: 'Add Text', description: 'Add text overlay to PDF', keywords: ['add text to pdf', 'annotate pdf'], category: 'edit', icon: 'type', color: '#F57C00', popularity: 5 },
      { id: 'add-image', label: 'Add Image', description: 'Insert images into PDF', keywords: ['add image to pdf', 'insert image pdf'], category: 'edit', icon: 'image-plus', color: '#EF6C00', popularity: 5 },
      { id: 'watermark-pdf', label: 'Add Watermark', description: 'Add text/image watermark', keywords: ['watermark pdf', 'add watermark to pdf'], category: 'edit', icon: 'droplet', color: '#E65100', popularity: 4 },
      { id: 'page-numbers', label: 'Add Page Numbers', description: 'Add header/footer page numbers', keywords: ['add page numbers pdf', 'page numbering'], category: 'edit', icon: 'hash', color: '#FF9800', popularity: 4 },
      { id: 'crop-pdf', label: 'Crop PDF', description: 'Crop pages to specific area', keywords: ['crop pdf', 'trim pdf'], category: 'edit', icon: 'crop', color: '#FFA726', popularity: 3 },
      { id: 'highlight-pdf', label: 'Highlight PDF', description: 'Highlight text in PDF', keywords: ['highlight pdf', 'highlight text'], category: 'edit', icon: 'highlighter', color: '#FFB74D', popularity: 3 },
    ],
  },
  {
    id: 'security',
    name: 'Security & Sign',
    tools: [
      { id: 'protect-pdf', label: 'Protect PDF', description: 'Add password encryption', keywords: ['protect pdf', 'password protect pdf', 'encrypt pdf'], category: 'security', icon: 'lock', color: '#8E24AA', popularity: 6 },
      { id: 'unlock-pdf', label: 'Unlock PDF', description: 'Remove PDF password', keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf'], category: 'security', icon: 'unlock', color: '#7B1FA2', popularity: 7 },
      { id: 'sign-pdf', label: 'Sign PDF', description: 'Add signature to PDF', keywords: ['sign pdf', 'electronic signature pdf'], category: 'security', icon: 'pen-tool', color: '#6A1B9A', popularity: 7 },
      { id: 'fill-form', label: 'Fill Form', description: 'Fill interactive PDF forms', keywords: ['fill pdf form', 'pdf form filler'], category: 'security', icon: 'pencil', color: '#4A148C', popularity: 5 },
      { id: 'redact-pdf', label: 'Redact PDF', description: 'Permanently remove sensitive info', keywords: ['redact pdf', 'remove sensitive data'], category: 'security', icon: 'eraser', color: '#9C27B0', popularity: 3 },
    ],
  },
  {
    id: 'ocr',
    name: 'OCR & Accessibility',
    tools: [
      { id: 'ocr-pdf', label: 'OCR PDF', description: 'Make scanned PDFs searchable', keywords: ['ocr pdf', 'scanned pdf to text', 'pdf text recognition'], category: 'ocr', icon: 'scan', color: '#00ACC1', popularity: 4 },
      { id: 'grayscale-pdf', label: 'Grayscale PDF', description: 'Convert color PDF to grayscale', keywords: ['grayscale pdf', 'black and white pdf'], category: 'ocr', icon: 'sun', color: '#00838F', popularity: 3 },
    ],
  },
];

// Helper to get flat list of all tools
export const ALL_TOOLS = TOOL_CATEGORIES.flatMap(cat => cat.tools);

// Tools that are currently implemented end-to-end across frontend and backend.
export const END_TO_END_TOOL_IDS = [
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'extract-pages',
  'delete-pages',
  'rotate-pdf',
  'watermark-pdf',
  'page-numbers',
  'unlock-pdf',
  'sign-pdf',
] as const;

export const END_TO_END_TOOL_ID_SET = new Set<string>(END_TO_END_TOOL_IDS);

export const VISIBLE_TOOL_CATEGORIES: ToolCategory[] = TOOL_CATEGORIES
  .map((category) => ({
    ...category,
    tools: category.tools.filter((tool) => END_TO_END_TOOL_ID_SET.has(tool.id)),
  }))
  .filter((category) => category.tools.length > 0);

export const VISIBLE_TOOLS = VISIBLE_TOOL_CATEGORIES.flatMap((category) => category.tools);

// Helper to get tool by ID
export function getToolById(id: string): Tool | undefined {
  return ALL_TOOLS.find(tool => tool.id === id);
}

export function getVisibleToolById(id: string): Tool | undefined {
  return VISIBLE_TOOLS.find((tool) => tool.id === id);
}

// Helper to get tools by category
export function getToolsByCategory(categoryId: string): Tool[] {
  const category = TOOL_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.tools || [];
}

// Top tools by popularity (for homepage hero)
export const TOP_TOOLS = [...ALL_TOOLS]
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 6);

export const VISIBLE_TOP_TOOLS = [...VISIBLE_TOOLS]
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 6);

// SEO keywords with search volume
export const SEO_KEYWORDS = [
  { keyword: 'merge pdf online free', tool: 'merge-pdf', volume: 110000 },
  { keyword: 'compress pdf', tool: 'compress-pdf', volume: 90000 },
  { keyword: 'convert pdf to word', tool: 'pdf-to-word', volume: 80000 },
  { keyword: 'word to pdf', tool: 'word-to-pdf', volume: 60000 },
  { keyword: 'split pdf online', tool: 'split-pdf', volume: 45000 },
  { keyword: 'remove pdf password', tool: 'unlock-pdf', volume: 40000 },
  { keyword: 'jpg to pdf', tool: 'jpg-to-pdf', volume: 35000 },
  { keyword: 'pdf to jpg', tool: 'pdf-to-jpg', volume: 28000 },
  { keyword: 'sign pdf online free', tool: 'sign-pdf', volume: 25000 },
  { keyword: 'edit pdf online', tool: 'edit-pdf', volume: 22000 },
];
