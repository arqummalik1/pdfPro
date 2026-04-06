import type { Metadata } from 'next';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | mydearPDF',
  description: 'Internal analytics dashboard for mydearPDF visitor and tool usage metrics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
