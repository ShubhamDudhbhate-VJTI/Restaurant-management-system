import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { UserCheck, UserX } from 'lucide-react';
import { Role } from '@/contracts';

export default function StaffPage() {
  const client = useQueryClient(); const [form, setForm] = useState({ name: '', email: '', password: '', role: Role.WAITER });
  const query = useQuery({ queryKey: ['staff'], queryFn: async () => (await apiClient.get('/staff')).data });
  const create = useMutation({ mutationFn: () => apiClient.post('/staff', form), onSuccess: () => { client.invalidateQueries({ queryKey: ['staff'] }); setForm({ ...form, name: '', email: '', password: '' }); } });
  const toggleStatus = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.patch(`/staff/${id}/status`, { isActive }), onSuccess: () => client.invalidateQueries({ queryKey: ['staff'] }) });
  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const rows = gsap.utils.toArray<HTMLElement>('.staff-row');
      if (rows.length === 0) return;
      gsap.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, clearProps: 'all' });
    });
  }, [query.data?.staff?.length]);
  return <main className="min-h-[100dvh] bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl space-y-8"><header><h1 className="text-3xl font-bold">Staff</h1><p className="text-slate-600">Create and manage operational accounts.</p></header>
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-3 rounded-xl border bg-white p-6 md:grid-cols-5"><input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border p-3" /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border p-3" /><input required minLength={6} type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border p-3" /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="rounded-lg border p-3">{[Role.WAITER, Role.KITCHEN, Role.CASHIER, Role.ADMIN].map((role) => <option key={role} value={role}>{role}</option>)}</select><button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white">Add staff</button></form>
    <section className="overflow-hidden rounded-xl border bg-white">{query.isLoading ? <p className="p-5">Loading staff...</p> : query.data?.staff?.length ? query.data.staff.map((person: any) => <div key={person.id} className="staff-row flex flex-wrap items-center justify-between gap-4 border-b p-5 last:border-0"><div><p className="font-semibold">{person.name}</p><p className="text-sm text-slate-500">{person.email}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize">{person.role}</span><span className={`text-sm ${person.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>{person.isActive ? 'Active' : 'Inactive'}</span><button type="button" onClick={() => toggleStatus.mutate({ id: person.id, isActive: !person.isActive })} disabled={toggleStatus.isPending} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">{person.isActive ? <><UserX className="mr-1 inline h-4 w-4" />Deactivate</> : <><UserCheck className="mr-1 inline h-4 w-4" />Activate</>}</button></div></div>) : <p className="p-5 text-slate-500">No staff accounts yet.</p>}</section></div></main>;
}
