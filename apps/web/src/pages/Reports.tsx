import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export default function ReportsPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await apiClient.get('/reports/dashboard')).data });
  const sales = useQuery({ queryKey: ['sales'], queryFn: async () => (await apiClient.get('/reports/sales')).data });
  if (dashboard.isLoading || sales.isLoading) return <main className="p-8">Loading reports...</main>;
  if (dashboard.isError || sales.isError) return <main className="p-8 text-red-600">Unable to load reports.</main>;
  const d = dashboard.data;
  return <main className="min-h-[100dvh] bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl space-y-8"><header><h1 className="text-3xl font-bold">Reports</h1><p className="text-slate-600">Basic operational performance from real database data.</p></header><div className="grid gap-4 md:grid-cols-5">{[['Orders', d.orders], ['Revenue', `₹${(d.revenueCents / 100).toFixed(2)}`], ['Occupied', `${d.occupiedTables}/${d.totalTables}`], ['Rating', d.averageRating || 'No ratings'], ['30 day sessions', sales.data.monthly]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div><section className="rounded-xl border bg-white"><h2 className="border-b p-5 font-semibold">Popular items</h2>{sales.data.popularItems?.length ? sales.data.popularItems.map((item: any) => <div key={item.name} className="flex justify-between border-b p-4 last:border-0"><span>{item.name}</span><span className="font-semibold">{item.quantity}</span></div>) : <p className="p-5 text-slate-500">No item sales yet.</p>}</section></div></main>;
}
