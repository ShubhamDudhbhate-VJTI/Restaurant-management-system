import { useState } from 'react';
import { useTables } from '../hooks/useTables';
import { Trash2, Utensils, ChefHat, Wallet, Settings, BarChart3, Users, CalendarDays, MessageSquare, QrCode, Printer, Download, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';

gsap.registerPlugin(useGSAP);

export default function AdminPage() {
  const { data, create, delete: deleteTable, isCreating, isDeleting, isLoading, error } = useTables();
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('');
  const [qrTable, setQrTable] = useState<{ name: string; qrToken: string } | null>(null);

  const tables = data?.tables || [];

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>('.stagger-item');
      if (items.length === 0) return;
      gsap.fromTo(items, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    });
  }, [tables.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !seats) return;
    
    await create({ name, seats: parseInt(seats, 10) });
    setName('');
    setSeats('');
  };

  const renderTableList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-1.5 rounded-[1.5rem] bg-white/5 ring-1 ring-white/10">
              <Skeleton className="h-[104px] w-full rounded-[calc(1.5rem-0.375rem)]" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-12 border border-red-500/20 bg-red-500/5 rounded-3xl text-red-400 font-light border-dashed">
          Failed to load tables. Please try again.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map(table => (
          <div key={table.id} className="stagger-item group">
            <div className="p-1.5 rounded-[1.5rem] bg-white/5 ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.02]">
              <div className="rounded-[calc(1.5rem-0.375rem)] bg-[#0A0A0A] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-light text-white flex items-center gap-2">
                    {table.name} 
                    <span className="text-white/40 text-xs font-mono bg-white/5 px-2 py-0.5 rounded-md">{table.seats} seats</span>
                  </h3>
                  <p className="text-xs font-mono text-white/50 mt-2">QR: /t/{table.qrToken}</p>
                </div>
                <button 
                  className="p-2.5 rounded-full bg-red-500/10 text-red-500/70 hover:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  onClick={() => deleteTable(table.id)}
                  disabled={isDeleting}
                  title="Delete Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-300 transition-colors hover:bg-emerald-400/20"
                  onClick={() => setQrTable({ name: table.name, qrToken: table.qrToken })}
                  title="View table QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {tables.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-white/40 font-light border border-white/5 rounded-3xl border-dashed">
            No tables configured yet.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="light-app-page min-h-[100dvh] bg-[#0b0d0c] text-white p-4 md:p-10 font-sans">
      <div className="mx-auto max-w-6xl space-y-10 pb-24">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 py-6 border-b border-white/10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              <Settings className="w-3 h-3" /> Management
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.025em] text-white md:text-5xl">
              Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/cashier" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
              <Wallet className="w-4 h-4" /> Cashier
            </Link>
            <Link to="/kitchen" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
              <ChefHat className="w-4 h-4" /> Kitchen Display
            </Link>
            <Link to="/admin/menu" className="flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20">
              <Utensils className="w-4 h-4" /> Manage Menu
            </Link>
            <Link to="/admin/reports" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"><BarChart3 className="w-4 h-4" /> Reports</Link>
            <Link to="/admin/staff" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"><Users className="w-4 h-4" /> Staff</Link>
            <Link to="/admin/reservations" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"><CalendarDays className="w-4 h-4" /> Reservations</Link>
            <Link to="/admin/feedback" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"><MessageSquare className="w-4 h-4" /> Feedback</Link>
            <Link to="/admin/audit-logs" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"><ClipboardList className="w-4 h-4" /> Audit log</Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table Management */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-light text-white/90">Manage Tables</h2>
            {renderTableList()}
          </div>
          {qrTable && (() => {
            const target = `${window.location.origin}/t/${qrTable.qrToken}`;
            const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(target)}`;
            return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111513] p-6 text-center shadow-2xl">
                <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-3"><img src={imageUrl} alt={`QR code for ${qrTable.name}`} className="h-56 w-56" /></div>
                <h2 className="text-xl font-semibold">{qrTable.name}</h2>
                <p className="mt-2 break-all text-xs text-white/50">{target}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10"><Printer className="h-4 w-4" />Print</button>
                  <a href={imageUrl} download={`${qrTable.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#07130c]"><Download className="h-4 w-4" />Download</a>
                  <button type="button" onClick={() => setQrTable(null)} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Close</button>
                </div>
              </div>
            </div>;
          })()}

          {/* Add Table Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-white/10 bg-white/[0.035]">
              <div className="p-6 md:p-7">
                <h3 className="text-xl font-light text-white mb-6">Add New Table</h3>
                
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-white/75">Name</label>
                    <input 
                      id="name" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required
                      placeholder="e.g. Table 5"
                      className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="seats" className="text-sm font-medium text-white/75">Seats</label>
                    <input 
                      id="seats" 
                      type="number" 
                      min="1" 
                      value={seats} 
                      onChange={e => setSeats(e.target.value)} 
                      required 
                      placeholder="e.g. 4"
                      className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="mt-4 w-full rounded-lg bg-emerald-400 py-3.5 font-semibold text-[#07130c] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Adding...' : 'Add Table'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
