// Tool page template with SEO
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getVisibleToolById } from '@/lib/tools-config';
import { ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react';
import { notFound } from 'next/navigation';
import ToolUploaderWrapper from '@/components/ToolUploaderWrapper';
import { getToolIconBadgeStyle, renderToolIcon } from '@/lib/tool-icons';
import { APP_VERSION_LABEL } from '@/lib/version';
import { absoluteUrl } from '@/lib/seo';

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
      canonical: absoluteUrl(`/${toolId}`),
    },
    openGraph: {
      title: `${tool.label} | mydearPDF`,
      description: tool.description,
      url: absoluteUrl(`/${toolId}`),
      siteName: 'mydearPDF',
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
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm sm:text-base">All Tools</span>
            </Link>
            <div className="flex items-center gap-2">
              <Image src="/logos/logo.png" alt="mydearPDF" width={72} height={72} className="w-18 h-18 object-contain" />
              <span className="font-bold text-gray-900 text-sm sm:text-base">mydearPDF</span>
            </div>
            <div className="w-20 sm:w-24" /> {/* Spacer for balance */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Tool Header */}
        <div className="text-center mb-6 md:mb-10">
          <div 
            className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4"
            style={getToolIconBadgeStyle(tool.color)}
          >
            {renderToolIcon(tool.icon, 'w-6 h-6 md:w-8 md:h-8')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">{tool.label}</h1>
          <p className="text-sm md:text-lg text-gray-600 max-w-xl mx-auto px-4">{tool.description}</p>
        </div>

        {/* Interactive Tool Widget - Upload & Process */}
        <div className="max-w-3xl mx-auto mb-10 md:mb-16">
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-8 shadow-sm">
            <ToolUploaderWrapper toolId={toolId} toolName={tool.label} />
          </div>
        </div>

        {/* Features/Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-16">
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Processing</h3>
            <p className="text-sm text-gray-500">Your files are encrypted and automatically deleted after 1 hour.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
            <p className="text-sm text-gray-500">We use the best PDF processing engine to ensure your files look perfect.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast & Easy</h3>
            <p className="text-sm text-gray-500">Simple interface allows you to process your files in seconds.</p>
          </div>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="border-t border-gray-200 pt-10 md:pt-16">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">Related Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedTools.map((t) => (
                <Link 
                  key={t.id} 
                  href={`/${t.id}`}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all text-center group"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={getToolIconBadgeStyle(t.color)}
                  >
                    {renderToolIcon(t.icon, 'w-5 h-5')}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-red-500 transition-colors">{t.label}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col items-center gap-3 mb-3">
            <span className="text-sm text-gray-500">
              A product of{' '}
              <a 
                href="https://audentix.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Audentix
              </a>
            </span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Version {APP_VERSION_LABEL}</p>
            <p>© 2026 mydearPDF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
