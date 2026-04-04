// Tool page template with SEO
import type { Metadata } from 'next';
import Link from 'next/link';
import { getVisibleToolById } from '@/lib/tools-config';
import { FileText, ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react';
import { notFound } from 'next/navigation';
import ToolUploaderWrapper from '@/components/ToolUploaderWrapper';
import { getToolIconBadgeStyle, renderToolIcon } from '@/lib/tool-icons';

interface PageProps {
  params: Promise<{ toolId: string }>;
}

// Generate static params for all tools
export async function generateStaticParams() {
  const { VISIBLE_TOOLS } = await import('@/lib/tools-config');
  return VISIBLE_TOOLS.map((tool) => ({ toolId: tool.id }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { toolId } = await params;
  const tool = getVisibleToolById(toolId);
  
  if (!tool) {
    return { title: 'Tool Not Found' };
  }
  
  return {
    title: `${tool.label} Online Free - ${tool.description}`,
    description: `${tool.label} online for free. No signup required. ${tool.description}. Process your PDF files securely and fast.`,
    keywords: tool.keywords,
    alternates: {
      canonical: `https://pdfpro.tools/${toolId}`,
    },
    openGraph: {
      title: `${tool.label} | PDFPro`,
      description: tool.description,
      url: `https://pdfpro.tools/${toolId}`,
      siteName: 'PDFPro',
      locale: 'en_US',
      type: 'website',
    },
  };
}

// Tool page content
export default async function ToolPage({ params }: PageProps) {
  const { toolId } = await params;
  const tool = getVisibleToolById(toolId);
  
  if (!tool) {
    notFound();
  }
  
  // Get related tools
  const { VISIBLE_TOOLS } = await import('@/lib/tools-config');
  const relatedTools = VISIBLE_TOOLS
    .filter(t => t.category === tool.category && t.id !== tool.id)
    .slice(0, 4);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">All Tools</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">PDFPro</span>
            </div>
            <div className="w-16" /> {/* Spacer for balance */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tool Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={getToolIconBadgeStyle(tool.color)}
          >
            {renderToolIcon(tool.icon, 'w-8 h-8')}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.label}</h1>
          <p className="text-gray-600 max-w-xl mx-auto">{tool.description}</p>
        </div>

        {/* Interactive Tool Widget - Upload & Process */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ToolUploaderWrapper toolId={toolId} toolName={tool.label} />
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">How to {tool.label.split(' ')[1] || tool.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload</h3>
              <p className="text-sm text-gray-500">Drag and drop your PDF files or click to browse</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Process</h3>
              <p className="text-sm text-gray-500">Click the button and we&apos;ll process your files instantly</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-sm text-gray-500">Get your processed PDF files instantly</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">100% Free</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Fast Processing</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Secure & Private</span>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedTools.map((relatedTool) => {
                return (
                  <Link
                    key={relatedTool.id}
                    href={`/${relatedTool.id}`}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div
                      className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                      style={getToolIconBadgeStyle(relatedTool.color)}
                    >
                      {renderToolIcon(relatedTool.icon, 'w-5 h-5')}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{relatedTool.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© 2026 PDFPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
