import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { apiClient } from '../api/client';
import { useRef } from 'react';

export default function AuditLogsPage() {
  const listRef = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => (await apiClient.get('/audit-logs?limit=100')).data,
  });

  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const rows = gsap.utils.toArray<HTMLElement>('.audit-row');
      if (rows.length === 0) return;
      gsap.fromTo(rows, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.025, clearProps: 'all' });
    });
  }, [query.data?.auditLogs?.length]);

  return (
    <main ref={listRef} className="light-app-page min-h-[100dvh] bg-[#0b0d0c] p-4 text-white md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-white/10 pb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Admin activity</p>
          <h1 className="text-4xl font-bold tracking-tight">Audit log</h1>
          <p className="mt-2 max-w-xl text-white/55">A trace of important reservations, orders, payments, and staff changes.</p>
        </header>
        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
          {query.isLoading && <p className="p-6 text-white/55">Loading activity...</p>}
          {query.isError && <p className="p-6 text-red-300">Unable to load audit activity.</p>}
          {!query.isLoading && !query.isError && !query.data?.auditLogs?.length && <p className="p-6 text-white/55">No activity recorded yet.</p>}
          {query.data?.auditLogs?.map((entry: { id: string; action: string; entityType: string; entityId: string; createdAt: number; actor: { name: string }; metadata: string | null }) => (
            <div key={entry.id} className="audit-row flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 last:border-0">
              <div>
                <p className="font-semibold text-white">{entry.action.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-sm text-white/50">{entry.actor.name} · {entry.entityType} {entry.entityId}</p>
              </div>
              <time className="text-sm text-white/45">{new Date(entry.createdAt).toLocaleString()}</time>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
