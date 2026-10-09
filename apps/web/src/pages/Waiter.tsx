import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useMenu } from '../hooks/useMenu';
import { useState } from 'react';

export default function WaiterPage() {
  const client = useQueryClient(); const [sessionId, setSessionId] = useState(''); const [itemId, setItemId] = useState(''); const [quantity, setQuantity] = useState('1');
  const sessions = useQuery({ queryKey: ['waiter-sessions'], queryFn: async () => (await apiClient.get('/sessions')).data });
  const { data: menu } = useMenu();
  const create = useMutation({ mutationFn: () => apiClient.post('/orders', { sessionId, items: [{ menuItemId: itemId, quantity: Number(quantity) }] }), onSuccess: () => client.invalidateQueries({ queryKey: ['waiter-sessions'] }) });
  const items = menu?.flatMap((category) => category.items.filter((item) => item.isAvailable)) || [];
  return <main className="min-h-[100dvh] bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl space-y-8"><header><h1 className="text-3xl font-bold">Waiter service</h1><p className="text-slate-600">Add order rounds to an active table session.</p></header><section className="grid gap-3 rounded-xl border bg-white p-6 md:grid-cols-4"><select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="rounded-lg border p-3"><option value="">Choose session</option>{sessions.data?.sessions?.map((s: any) => <option key={s.id} value={s.id}>{s.tableName} · {s.id.slice(0, 6)}</option>)}</select><select value={itemId} onChange={(e) => setItemId(e.target.value)} className="rounded-lg border p-3"><option value="">Choose item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-lg border p-3" /><button disabled={!sessionId || !itemId || create.isPending} onClick={() => create.mutate()} className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white">Send to kitchen</button></section><section className="grid gap-4 md:grid-cols-3">{sessions.data?.sessions?.map((s: any) => <article key={s.id} className="rounded-xl border bg-white p-5"><h2 className="font-semibold">{s.tableName}</h2><p className="mt-2 text-sm text-slate-500">{s.unservedCount} active orders</p><p className="mt-4 text-lg font-bold">₹{(s.bill.totalCents / 100).toFixed(2)}</p></article>)}</section></div></main>;
}
