'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with PDF processing
const ToolUploader = dynamic(() => import('@/components/ToolUploader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  ),
});

interface ToolUploaderWrapperProps {
  toolId: string;
  toolName: string;
}

function ToolUploaderWrapper({ toolId, toolName }: ToolUploaderWrapperProps) {
  return (
    <ToolUploader 
      toolId={toolId} 
      toolName={toolName}
      multiple={toolId === 'merge-pdf'}
    />
  );
}

export default ToolUploaderWrapper;
