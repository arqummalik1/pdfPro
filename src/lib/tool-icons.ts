import { createElement, type CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  Archive,
  Crop,
  Droplets,
  Eraser,
  FileMinus,
  FileSpreadsheet,
  FileText,
  Globe,
  Hash,
  Highlighter,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  LayoutGrid,
  Lock,
  PenTool,
  Pencil,
  Presentation,
  RotateCw,
  Scan,
  Scissors,
  Sun,
  Table,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';

const DEFAULT_ICON = FileText;

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  layers: Layers,
  scissors: Scissors,
  archive: Archive,
  grid: LayoutGrid,
  'file-minus': FileMinus,
  trash: Trash2,
  'file-text': FileText,
  table: Table,
  presentation: Presentation,
  image: ImageIcon,
  'align-left': AlignLeft,
  code: FileSpreadsheet,
  'rotate-cw': RotateCw,
  type: Type,
  'image-plus': ImagePlus,
  droplet: Droplets,
  hash: Hash,
  crop: Crop,
  highlighter: Highlighter,
  lock: Lock,
  unlock: Unlock,
  'pen-tool': PenTool,
  pencil: Pencil,
  eraser: Eraser,
  scan: Scan,
  sun: Sun,
  globe: Globe,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');

  if (/^[\da-fA-F]{3}$/.test(normalized)) {
    const [r, g, b] = normalized.split('').map((char) => char + char);
    return {
      r: parseInt(r, 16),
      g: parseInt(g, 16),
      b: parseInt(b, 16),
    };
  }

  if (/^[\da-fA-F]{6}$/.test(normalized)) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  return null;
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return `rgba(23, 23, 23, ${alpha})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function getToolIcon(iconName: string): LucideIcon {
  return TOOL_ICON_MAP[iconName] || DEFAULT_ICON;
}

export function renderToolIcon(iconName: string, className: string) {
  return createElement(getToolIcon(iconName), {
    className,
    'aria-hidden': true,
  });
}

export function getToolIconBadgeStyle(color: string): CSSProperties {
  return {
    backgroundColor: withAlpha(color, 0.12),
    color,
  };
}
