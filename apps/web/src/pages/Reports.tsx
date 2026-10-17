import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Star,
  ArrowLeft,
  Calendar,
  Download,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function ReportsPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await apiClient.get('/reports/dashboard')).data
  });
  const sales = useQuery({
    queryKey: ['sales'],
    queryFn: async () => (await apiClient.get('/reports/sales')).data
  });

  const isLoading = dashboard.isLoading || sales.isLoading;
  const isError = dashboard.isError || sales.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3eadf] p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <Skeleton className="h-12 w-64 bg-[#eadfd2]" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-[#eadfd2]" />)}
          </div>
          <Skeleton className="h-96 rounded-3xl bg-[#eadfd2]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f3eadf] flex items-center justify-center p-8">
        <Card className="border-red-200 bg-red-50 p-8 text-center max-w-md">
          <p className="text-red-600 font-bold uppercase tracking-widest text-xs mb-4">Data Link Severed</p>
          <p className="text-[#756b63] mb-6">Unable to synchronize with the analytics core. Please check your connection.</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">Retry Connection</Button>
        </Card>
      </div>
    );
  }

  const d = dashboard.data;
  const s = sales.data;

  const stats = [
    { label: 'Active Orders', value: d.orders, icon: ShoppingBag, color: 'text-[#2b4a7d]', bg: 'bg-[#e7eff8]' },
    { label: 'Today\'s Revenue', value: `₹${(d.revenueCents / 100).toFixed(2)}`, icon: TrendingUp, color: 'text-[#356b4f]', bg: 'bg-[#dce5d7]' },
    { label: 'Table Occupancy', value: `${d.occupiedTables}/${d.totalTables}`, icon: LayoutGrid, color: 'text-[#a3543e]', bg: 'bg-[#f8f0e7]' },
    { label: 'Avg Satisfaction', value: d.averageRating || 'N/A', icon: Star, color: 'text-[#8c6d1f]', bg: 'bg-[#fcf3d7]' },
  ];

  return (
    <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans selection:bg-emerald-100">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-[#d9cbbd] bg-[#f3eadf]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-[#756b63] hover:text-[#28231f]">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#356b4f] p-2 text-white shadow-lg shadow-emerald-900/10">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-normal tracking-tight">Intelligence Hub</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-[#d9cbbd] text-[#756b63] font-bold uppercase tracking-widest text-[10px]">
              <Download className="mr-2 h-3.5 w-3.5" /> Export Data
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h2 className="text-3xl font-normal tracking-tight text-[#28231f]">System Overview</h2>
          <p className="text-[#756b63] font-medium mt-1">Operational performance metrics from real-time node activity.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-[#d9cbbd] bg-[#fffaf3] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">{stat.label}</p>
                  <div className={cn("rounded-lg p-2", stat.bg, stat.color)}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-normal text-[#28231f]">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Popular Items */}
          <Card className="lg:col-span-1 border-[#d9cbbd] bg-[#fffaf3] shadow-sm">
            <CardHeader className="border-b border-[#d9cbbd]/50">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#a3543e]" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Culinary Velocity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {s.popularItems?.length ? s.popularItems.map((item: any, idx: number) => (
                  <div key={item.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#a3543e] w-4">0{idx + 1}</span>
                      <span className="font-bold text-[#28231f] group-hover:text-[#356b4f] transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-24 rounded-full bg-[#eadfd2] overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-[#356b4f]"
                          style={{ width: `${(item.quantity / s.popularItems[0].quantity) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-[#756b63]">{item.quantity}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-[#d9cbbd]">No data captured</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Temporal Analytics */}
          <Card className="lg:col-span-2 border-[#d9cbbd] bg-[#fffaf3] shadow-sm">
            <CardHeader className="border-b border-[#d9cbbd]/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#2b4a7d]" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Temporal Traffic</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-[#d9cbbd]/50 border-b border-[#d9cbbd]/50">
                {[
                  { label: 'Daily Sessions', value: s.daily },
                  { label: 'Weekly Sessions', value: s.weekly },
                  { label: 'Monthly Sessions', value: s.monthly },
                ].map(stat => (
                  <div key={stat.label} className="p-8 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#756b63] mb-2">{stat.label}</p>
                    <p className="text-4xl font-normal text-[#28231f]">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-8">
                <div className="rounded-2xl border-2 border-dashed border-[#d9cbbd] p-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Advanced Visualization Module</p>
                  <p className="mt-2 text-xs text-[#d9cbbd]">Historical trend charting is currently processing background datasets.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
