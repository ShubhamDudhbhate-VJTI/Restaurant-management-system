import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { UserCheck, UserX, Plus } from 'lucide-react';
import { Role } from '@/contracts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function StaffPage() {
  const client = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: Role.WAITER });

  const query = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await apiClient.get('/staff')).data
  });

  const create = useMutation({
    mutationFn: () => apiClient.post('/staff', form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['staff'] });
      setForm({ ...form, name: '', email: '', password: '' });
    }
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/staff/${id}/status`, { isActive }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['staff'] })
  });

  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const rows = gsap.utils.toArray<HTMLElement>('.staff-row');
      if (rows.length === 0) return;
      gsap.fromTo(rows,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    });
  }, [query.data?.staff?.length]);

  return (
    <div className="min-h-[100dvh] bg-[#f3eadf] p-4 md:p-12 font-sans text-[#28231f]">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col gap-5 border-b border-[#d9cbbd] py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 inline-block rounded-full border border-[#cbbbaa] bg-[#eadfd2] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#a3543e]">
              Human Resources
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-[#28231f] md:text-5xl">
              Staff Management
            </h1>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#d9cbbd] bg-[#fffaf3] p-8 shadow-[0_12px_30px_rgba(88,62,42,0.06)]">
          <h2 className="text-xl font-normal mb-6">Add New Staff Member</h2>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
          >
            <Input
              required
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#f3eadf]/30"
            />
            <Input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-[#f3eadf]/30"
            />
            <Input
              required
              minLength={6}
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-[#f3eadf]/30"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="flex h-12 w-full rounded-xl border border-input bg-[#f3eadf]/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {[Role.WAITER, Role.KITCHEN, Role.CASHIER, Role.ADMIN].map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button disabled={create.isPending} className="w-full">
              <Plus className="w-4 h-4" /> Add staff
            </Button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#d9cbbd] bg-[#fffaf3] shadow-[0_12px_30px_rgba(88,62,42,0.06)]">
          {query.isLoading ? (
            <div className="p-12 text-center text-[#756b63]">Loading staff directory...</div>
          ) : query.data?.staff?.length ? (
            <div className="divide-y divide-[#d9cbbd]">
              {query.data.staff.map((person: any) => (
                <div key={person.id} className="staff-row group flex flex-wrap items-center justify-between gap-6 p-6 transition-colors hover:bg-[#f3eadf]/20">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#eadfd2] flex items-center justify-center text-[#a3543e] font-semibold text-lg">
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-lg text-[#28231f]">{person.name}</p>
                      <p className="text-sm text-[#756b63]">{person.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="rounded-full bg-[#eadfd2] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#a3543e]">
                      {person.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${person.isActive ? 'bg-[#356b4f]' : 'bg-[#a3543e]'}`} />
                      <span className={`text-xs font-semibold uppercase tracking-widest ${person.isActive ? 'text-[#356b4f]' : 'text-[#a3543e]'}`}>
                        {person.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus.mutate({ id: person.id, isActive: !person.isActive })}
                      disabled={toggleStatus.isPending}
                      className="min-h-10 px-4"
                    >
                      {person.isActive ? (
                        <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                      ) : (
                        <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-[#756b63] italic">No staff accounts found.</div>
          )}
        </section>
      </div>
    </div>
  );
}
