'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Search as SearchIcon, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { VISIBLE_TOOL_CATEGORIES, VISIBLE_TOP_TOOLS, VISIBLE_TOOLS, type Tool } from '@/lib/tools-config';
import { themeConfig } from '@/lib/theme';
import { APP_VERSION_LABEL } from '@/lib/version';
import { absoluteUrl } from '@/lib/seo';
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
  const [searchQuery, setSearchQuery] = useState('');
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'mydearPDF',
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const filteredTools = (() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return VISIBLE_TOOLS.filter(tool => 
      tool.label.toLowerCase().includes(query) || 
      tool.description.toLowerCase().includes(query) ||
      tool.keywords.some(kw => kw.toLowerCase().includes(query))
    ).slice(0, 8); // Limit results for the dropdown
  })();

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      {/* Header */}
      <header className="border-b border-gray-100 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-32">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logos/logo.png" alt="mydearPDF" width={300} height={300} className="w-48 h-48 object-contain" />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">All Tools</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-6 md:py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Merge PDF & Compress PDF
              <br className="hidden sm:block" />
              <span className="text-red-500"> Online for Free</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Merge PDF, compress PDF, split, rotate, sign, and edit in seconds.
              No signup required. No watermarks. 100% free forever.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 md:mb-16 relative">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                <SearchIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your PDF tool (e.g. merge, split, compress)..."
                className="w-full pl-14 pr-12 py-4 text-base sm:text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:outline-none transition-all shadow-sm group-hover:shadow-md placeholder:text-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {filteredTools.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredTools.map((tool) => (
                    <Link 
                      key={tool.id}
                      href={`/${tool.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={getToolIconBadgeStyle(tool.color)}
                      >
                        {renderToolIcon(tool.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900">{tool.label}</h4>
                        <p className="text-sm text-gray-500 truncate">{tool.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery.trim() && filteredTools.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-xl z-50 text-center">
                <p className="text-gray-500">No tools found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
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
          <h2 className="text-3xl font-bold mb-4">Fast, Secure & Free</h2>
          <p className="text-gray-400 mb-8">
            Process your PDF files locally and securely without any limits or signups.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Explore All Tools
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">mydearPDF</span>
            </div>
            
            {/* Audentix Branding */}
            <div className="text-sm text-gray-500">
              A product of{' '}
              <a 
                href="https://audentix.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Audentix
              </a>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
              <Link href="/dashboard" className="text-xs text-gray-300 hover:text-gray-500 transition-colors" title="Admin">•</Link>
            </div>
            
            {/* Version & Copyright */}
            <div className="flex flex-col items-center gap-1 text-xs text-gray-400">
              <span>Version {APP_VERSION_LABEL}</span>
              <span>© 2026 mydearPDF. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
