'use client';

import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: number;
}

export function ShimmerSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
  gap = 8,
}: ShimmerSkeletonProps) {
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
      }}
    />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return (
    <div className="flex flex-col" style={{ gap }}>
      {skeletons}
    </div>
  );
}

// Pre-built skeleton patterns for common use cases
export function FileItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <ShimmerSkeleton variant="circular" width={32} height={32} className="md:w-8 md:h-8 flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerSkeleton variant="text" width="80%" height={16} />
          <ShimmerSkeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <ShimmerSkeleton variant="circular" width={24} height={24} className="flex-shrink-0" />
    </div>
  );
}

export function UploadZoneSkeleton() {
  return (
    <div className="border-2 border-dashed rounded-xl md:rounded-2xl p-6 sm:p-12 text-center border-gray-300 bg-gray-50">
      <div className="space-y-4">
        <ShimmerSkeleton variant="rounded" width={48} height={48} className="mx-auto" />
        <div className="space-y-2">
          <ShimmerSkeleton variant="text" width={200} height={20} className="mx-auto" />
          <ShimmerSkeleton variant="text" width={100} height={14} className="mx-auto" />
        </div>
        <ShimmerSkeleton variant="rounded" width={120} height={36} className="mx-auto rounded-lg" />
        <ShimmerSkeleton variant="text" width={250} height={12} className="mx-auto" />
      </div>
    </div>
  );
}

export function ProcessingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-xl md:rounded-2xl p-6 sm:p-12 text-center border-red-200 bg-red-50/30">
        <div className="space-y-4">
          <ShimmerSkeleton variant="circular" width={64} height={64} className="mx-auto" />
          <ShimmerSkeleton variant="text" width={180} height={24} className="mx-auto" />
          <ShimmerSkeleton variant="text" width={120} height={16} className="mx-auto" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <ShimmerSkeleton variant="text" width={100} height={16} />
          <ShimmerSkeleton variant="text" width={60} height={14} />
        </div>
        <FileItemSkeleton />
      </div>
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white border-2 border-green-200 rounded-2xl shadow-xl">
      <div className="bg-green-100 p-4 flex items-center justify-center gap-3">
        <ShimmerSkeleton variant="circular" width={24} height={24} />
        <ShimmerSkeleton variant="text" width={150} height={20} />
      </div>
      
      <div className="p-6 md:p-10 text-center space-y-6">
        <ShimmerSkeleton variant="circular" width={80} height={80} className="mx-auto" />
        <div className="space-y-2">
          <ShimmerSkeleton variant="text" width={200} height={24} className="mx-auto" />
          <ShimmerSkeleton variant="text" width={280} height={16} className="mx-auto" />
        </div>
        <ShimmerSkeleton variant="rounded" width="100%" height={48} className="rounded-xl" />
      </div>
    </div>
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <ShimmerSkeleton variant="rounded" width={48} height={48} className="rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <ShimmerSkeleton variant="text" width="70%" height={20} />
          <ShimmerSkeleton variant="text" width="100%" height={14} />
          <ShimmerSkeleton variant="text" width="40%" height={12} />
        </div>
      </div>
    </div>
  );
}

export function ToolGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ShimmerSkeleton variant="text" width={150} height={28} />
        <ShimmerSkeleton variant="rounded" width={100} height={36} className="rounded-lg" />
      </div>
      
      {/* Upload Zone */}
      <UploadZoneSkeleton />
      
      {/* Tool Options */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <ShimmerSkeleton variant="text" width={120} height={16} />
        <div className="grid grid-cols-3 gap-3">
          <ShimmerSkeleton variant="rounded" width="100%" height={60} className="rounded-lg" />
          <ShimmerSkeleton variant="rounded" width="100%" height={60} className="rounded-lg" />
          <ShimmerSkeleton variant="rounded" width="100%" height={60} className="rounded-lg" />
        </div>
      </div>
      
      {/* Action Button */}
      <ShimmerSkeleton variant="rounded" width="100%" height={48} className="rounded-xl" />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <ShimmerSkeleton variant="text" width={80} height={14} />
          <ShimmerSkeleton variant="text" width={60} height={32} />
          <ShimmerSkeleton variant="text" width={100} height={12} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <ShimmerSkeleton variant="text" width={80} height={14} />
          <ShimmerSkeleton variant="text" width={60} height={32} />
          <ShimmerSkeleton variant="text" width={100} height={12} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <ShimmerSkeleton variant="text" width={80} height={14} />
          <ShimmerSkeleton variant="text" width={60} height={32} />
          <ShimmerSkeleton variant="text" width={100} height={12} />
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <ShimmerSkeleton variant="text" width={150} height={20} />
        <div className="space-y-3">
          <ShimmerSkeleton variant="text" width="100%" height={40} />
          <ShimmerSkeleton variant="text" width="100%" height={40} />
          <ShimmerSkeleton variant="text" width="100%" height={40} />
        </div>
      </div>
    </div>
  );
}
