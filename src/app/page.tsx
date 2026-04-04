import Link from 'next/link';
import { VISIBLE_TOOL_CATEGORIES, VISIBLE_TOP_TOOLS, type Tool } from '@/lib/tools-config';
import { themeConfig } from '@/lib/theme';
import { FileText } from 'lucide-react';
import { getToolIconBadgeStyle, renderToolIcon } from '@/lib/tool-icons';

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link 
      href={`/${tool.id}`}
      className="group"
    >
      <div 
        className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white group-hover:-translate-y-1"
      >
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors"
          style={getToolIconBadgeStyle(tool.color)}
        >
          {renderToolIcon(tool.icon, 'w-6 h-6')}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{tool.label}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
      </div>
    </Link>
  );
}

function HeroToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <Link 
      href={`/${tool.id}`}
      className="group"
    >
      <div 
        className="p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 bg-white group-hover:-translate-y-2"
        style={{ 
          boxShadow: index === 0 ? `0 4px 20px ${themeConfig.colors.primary}20` : undefined 
        }}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors"
          style={getToolIconBadgeStyle(tool.color)}
        >
          {renderToolIcon(tool.icon, 'w-8 h-8')}
        </div>
        <h3 className="font-bold text-lg text-gray-900 mb-2">{tool.label}</h3>
        <p className="text-sm text-gray-500">{tool.description}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PDFPro</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">All Tools</Link>
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900">Blog</Link>
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                Sign In
              </button>
            </nav>
            <div className="md:hidden flex items-center gap-4">
              <Link href="/blog" className="text-xs font-medium text-gray-600 hover:text-gray-900">Blog</Link>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Every PDF Tool You Need
              <br className="hidden sm:block" />
              <span className="text-red-500"> Completely Free</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Merge, split, compress, convert, edit, sign & more. No signup required. 
              No watermarks. 100% free forever.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="relative group">
              <input
                type="text"
                placeholder="Find your PDF tool..."
                className="w-full pl-6 pr-24 sm:pr-32 py-4 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:outline-none transition-all shadow-sm group-hover:shadow-md"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-2 bg-red-500 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-red-600 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Popular Tools */}
          <div className="mb-12">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 text-center">Most Popular Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
              {VISIBLE_TOP_TOOLS.map((tool, index) => (
                <HeroToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="whitespace-nowrap">No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="whitespace-nowrap">No watermarks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="whitespace-nowrap">Files deleted after 1 hour</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Tools by Category */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {VISIBLE_TOOL_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-12 md:mb-16">
              <div className="flex items-baseline gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{category.name}</h2>
                <span className="text-xs md:text-sm text-gray-500">({category.tools.length} tools)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help With PDFs?</h2>
          <p className="text-gray-400 mb-8">
            Check our blog for tutorials, tips, and guides on PDF management.
          </p>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Visit Blog
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">PDFPro</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
              <span>© 2026 PDFPro. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
