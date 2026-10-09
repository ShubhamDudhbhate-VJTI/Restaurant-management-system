import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useTables } from '../hooks/useTables';
import { useMemo, useState } from 'react';
import { ReservationStatus } from '@/contracts';
import { useAuth } from '../hooks/useAuth';

export default function ReservationsPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const { data: tablesData } = useTables();
  const [form, setForm] = useState({ tableId: '', reservationDate: '', startTime: '18:00', endTime: '19:30', guestCount: '2' });
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['reservations'], queryFn: async () => (await apiClient.get('/reservations')).data });
  const create = useMutation({
    mutationFn: async () => (await apiClient.post('/reservations', { ...form, guestCount: Number(form.guestCount) })).data,
    onSuccess: () => { client.invalidateQueries({ queryKey: ['reservations'] }); setForm({ ...form, tableId: '' }); }
  });
  const cancel = useMutation({ mutationFn: (id: string) => apiClient.post(`/reservations/${id}/cancel`), onSuccess: () => client.invalidateQueries({ queryKey: ['reservations'] }) });
  const updateStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) => apiClient.patch(`/reservations/${id}/status`, { status }), onSuccess: () => client.invalidateQueries({ queryKey: ['reservations'] }) });
  const tables = tablesData?.tables || [];
  const reservations = useMemo(() => (query.data?.reservations || []).filter((r: any) => {
    const matchesDate = !dateFilter || r.reservationDate === dateFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const haystack = `${r.tableId} ${r.customerName || ''} ${r.reservationDate}`.toLowerCase();
    return matchesDate && matchesStatus && haystack.includes(search.toLowerCase());
  }), [query.data?.reservations, dateFilter, statusFilter, search]);
  return <main className="min-h-[100dvh] bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl space-y-8">
    <header><h1 className="text-3xl font-bold">Reservations</h1><p className="mt-1 text-slate-600">Reserve a suitable table for a future visit.</p></header>
    {user?.role === 'customer' && <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-5">
      <select required value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} className="rounded-lg border p-3"><option value="">Table</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.seats} seats)</option>)}</select>
      <input required type="date" value={form.reservationDate} onChange={(e) => setForm({ ...form, reservationDate: e.target.value })} className="rounded-lg border p-3" />
      <input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-lg border p-3" />
      <input required type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-lg border p-3" />
      <button disabled={create.isPending} className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white">{create.isPending ? 'Saving...' : 'Reserve'}</button>
      <input required min="1" type="number" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} className="rounded-lg border p-3" placeholder="Guests" />
    </form>}
    <section className="rounded-xl border bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b p-5">
        <strong className="mr-auto">Reservations</strong>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search table or customer" className="rounded-lg border p-2 text-sm" />
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border p-2 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2 text-sm"><option value="">All statuses</option>{Object.values(ReservationStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select>
      </div>
      {query.isLoading ? <p className="p-5 text-slate-500">Loading reservations...</p> : query.isError ? <p className="p-5 text-red-600">Unable to load reservations.</p> : reservations.length ? reservations.map((r: any) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b p-5 last:border-0"><div><p className="font-semibold">{r.reservationDate} · {r.startTime}-{r.endTime}</p><p className="text-sm text-slate-500">{r.guestCount} guests · Table {r.tableId}</p></div><div className="flex items-center gap-3"><span className="text-sm capitalize text-slate-600">{r.status}</span>{user?.role === 'admin' ? <select value={r.status} onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value as ReservationStatus })} className="rounded-lg border p-2 text-sm">{Object.values(ReservationStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select> : ![ReservationStatus.CANCELLED, ReservationStatus.COMPLETED, ReservationStatus.SEATED].includes(r.status) && <button onClick={() => cancel.mutate(r.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Cancel</button>}</div></div>) : <p className="p-5 text-slate-500">No matching reservations.</p>}
    </section>
  </div></main>;
}
