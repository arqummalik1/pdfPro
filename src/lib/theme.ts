// PDFPro Theme Configuration
import type { Metadata } from 'next';

export const siteConfig = {
  name: 'PDFPro',
  description: 'Free online PDF tools - Merge, Split, Compress, Convert, Edit, and more',
  url: 'https://pdfpro.tools',
  ogImage: '/og/home.png',
};

export const themeConfig = {
  // Brand colors - Red accent to compete with iLovePDF
  colors: {
    primary: '#E53935',        // Red
    primaryDark: '#C62828',
    primaryLight: '#EF5350',
    accent: '#1E88E5',         // Blue for secondary actions
    
    // Backgrounds
    bg: '#FFFFFF',
    bgSecondary: '#F5F5F5',
    bgDark: '#1A1A1A',
    surface: '#FFFFFF',
    surfaceDark: '#2A2A2A',
    
    // Text
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    textDark: '#FFFFFF',
    textDarkSecondary: 'rgba(255,255,255,0.7)',
    
    // Semantic
    success: '#43A047',
    warning: '#FB8C00',
    error: '#E53935',
    info: '#1E88E5',
    
    // Borders
    border: '#E0E0E0',
    borderDark: '#404040',
  },
  
  // Tool category colors
  toolColors: {
    'organize': '#E53935',     // Red
    'convert-from': '#1E88E5', // Blue
    'convert-to': '#43A047',   // Green
    'edit': '#FB8C00',         // Orange
    'security': '#8E24AA',     // Purple
    'ocr': '#00ACC1',          // Cyan
    'ai': '#5E35B1',           // Deep Purple
  },
};

export const metadataConfig: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: '%s | PDFPro',
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default themeConfig;