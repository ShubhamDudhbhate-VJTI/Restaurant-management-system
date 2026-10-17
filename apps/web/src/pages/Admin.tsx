import { useState } from 'react';
import { useTables } from '../hooks/useTables';
import {
  Trash2,
  Utensils,
  ChefHat,
  Wallet,
  Settings,
  BarChart3,
  Users,
  CalendarDays,
  MessageSquare,
  QrCode,
  Printer,
  Download,
  ClipboardList,
  Plus,
  AlertTriangle,
  History,
  X,
  Clock,
  CheckCircle2,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useCashierSessions } from '../hooks/useCashierSessions';
import { OrderWithItems, OrderStatus } from '@/contracts';
import { cn } from '../lib/utils';
import { ScrollArea } from '../components/ui/scroll-area';

gsap.registerPlugin(useGSAP);

export default function AdminPage() {
  const { data, create, delete: deleteTable, isCreating, isDeleting, isLoading, error } = useTables();
  const { data: sessionsData, forceClose, isForceClosing, getSessionOrders } = useCashierSessions();
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('');
  const [qrTable, setQrTable] = useState<{ name: string; qrToken: string } | null>(null);
  const [selectedSessionOrders, setSelectedSessionOrders] = useState<{
    tableName: string,
    orders: OrderWithItems[],
    bill?: { totalCents: number }
  } | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // AlertDialog states
  const [confirmDeleteTable, setConfirmDeleteTable] = useState<{ id: string, name: string } | null>(null);
  const [confirmForceClose, setConfirmForceClose] = useState<{ id: string, name: string } | null>(null);

  const tables = data?.tables || [];
  const activeSessions = sessionsData?.sessions || [];

  const handleTableClick = async (tableName: string, sessionId: string) => {
    setIsLoadingOrders(true);
    try {
      const orders = await getSessionOrders(sessionId);
      const session = activeSessions.find(s => s.id === sessionId);
      setSelectedSessionOrders({
        tableName,
        orders: orders.filter(o => o.status !== OrderStatus.CANCELLED),
        bill: session?.bill
      });
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>('.stagger-item');
      if (items.length === 0) return;
      gsap.fromTo(items, 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out', clearProps: 'all' }
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

  const navLinks = [
    { to: '/admin/menu', icon: Utensils, label: 'Menu Management', color: 'text-[#a3543e]', bg: 'bg-[#f8f0e7]' },
    { to: '/admin/staff', icon: Users, label: 'Staff Roster', color: 'text-[#2b4a7d]', bg: 'bg-[#e7eff8]' },
    { to: '/admin/reports', icon: BarChart3, label: 'Analytics', color: 'text-[#356b4f]', bg: 'bg-[#dce5d7]' },
    { to: '/admin/reservations', icon: CalendarDays, label: 'Bookings', color: 'text-[#8c6d1f]', bg: 'bg-[#fcf3d7]' },
    { to: '/admin/feedback', icon: MessageSquare, label: 'Customer Voice', color: 'text-[#a3543e]', bg: 'bg-[#f8f0e7]' },
    { to: '/admin/audit-logs', icon: ClipboardList, label: 'Security Logs', color: 'text-[#756b63]', bg: 'bg-[#fffaf3]' },
  ];

  return (
    <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans selection:bg-emerald-100 relative">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full border-b border-[#d9cbbd] bg-[#f3eadf]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#356b4f] p-2 text-white shadow-lg shadow-emerald-900/10">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-normal tracking-tight text-[#28231f]">Operations Control</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#356b4f]">System Operational</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/cashier">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 font-black uppercase tracking-widest text-[#756b63] hover:text-[#28231f]">
                  <Wallet className="h-4 w-4" /> Cashier
                </Button>
              </Link>
              <Link to="/kitchen">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 font-black uppercase tracking-widest text-[#756b63] hover:text-[#28231f]">
                  <ChefHat className="h-4 w-4" /> Kitchen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-end justify-between border-b border-[#d9cbbd] pb-8">
          <div>
            <h1 className="text-4xl font-normal tracking-tight text-[#28231f]">Infrastructure Terminal</h1>
            <p className="mt-2 text-[#756b63] font-medium">Real-time control over restaurant nodes and staff departments.</p>
          </div>
          <div className="hidden lg:block text-right">
            <div className="text-2xl font-black text-[#28231f]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
            <div className="text-[10px] text-[#756b63] font-bold uppercase tracking-[0.2em]">Management Protocol Active</div>
          </div>
        </header>

        {/* Quick Access Grid */}
        <section className="mb-12">
          <h2 className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Department Control Units</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="stagger-item group">
                <Card className="h-full border-[#d9cbbd] bg-[#fffaf3] transition-all hover:border-[#356b4f] hover:shadow-xl hover:shadow-[#356b4f]/5 active:scale-95">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className={`mb-3 rounded-xl ${link.bg} p-3 ${link.color} transition-transform group-hover:scale-110 shadow-sm`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#756b63] group-hover:text-[#28231f] transition-colors">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Table Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal tracking-tight text-[#28231f]">Table Nodes</h2>
              <span className="rounded-full bg-[#eadfd2] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#756b63] border border-[#d9cbbd]">
                {tables.length} Total Nodes
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl bg-[#fffaf3] border border-[#d9cbbd]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 font-bold uppercase tracking-widest text-xs">
                Infrastructure synchronization failed. Reconnect required.
              </div>
            ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {tables.map(table => {
                  const activeSession = activeSessions.find(s => s.tableName === table.name);
                  return (
                    <Card
                      key={table.id}
                      className={cn(
                        "stagger-item border-[#d9cbbd] bg-[#fffaf3] hover:border-[#356b4f] transition-all cursor-pointer group/card",
                        activeSession ? 'ring-2 ring-[#a3543e]/20 shadow-lg shadow-[#a3543e]/5' : ''
                      )}
                      onClick={() => activeSession && handleTableClick(table.name, activeSession.id)}
                    >
                      <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover/card:scale-110",
                            activeSession ? 'bg-[#a3543e] shadow-[#a3543e]/20' : 'bg-[#28231f] shadow-black/10'
                          )}>
                            <span className="text-lg font-black">{table.name.match(/\d+/)?.[0] || 'T'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-[#28231f]">{table.name}</h3>
                              {activeSession && (
                                <span className="flex h-2 w-2 rounded-full bg-[#a3543e] animate-pulse" />
                              )}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#756b63]">
                              {table.seats} Capacity • {activeSession ? 'In Service' : 'Vacant'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {activeSession && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-[#a3543e] hover:text-[#a3543e] hover:bg-[#a3543e]/10 transition-colors"
                              title="Force Close Session"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmForceClose({ id: activeSession.id, name: table.name });
                              }}
                              disabled={isForceClosing}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-[#756b63] hover:text-[#356b4f] hover:bg-[#356b4f]/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrTable({ name: table.name, qrToken: table.qrToken });
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          {!activeSession && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-[#756b63] hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteTable({ id: table.id, name: table.name });
                              }}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {tables.length === 0 && (
                  <div className="col-span-full rounded-3xl border-2 border-dashed border-[#d9cbbd] p-16 text-center">
                    <Plus className="mx-auto h-12 w-12 text-[#d9cbbd] mb-4" />
                    <p className="font-black text-[#756b63] uppercase tracking-[0.2em] text-[10px]">No infrastructure detected</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Table Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-[#d9cbbd] bg-[#fffaf3] shadow-2xl shadow-[#28231f]/5">
              <CardHeader className="border-b border-[#d9cbbd]/50 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Deploy New Node</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-[#756b63]">Node Identifier</Label>
                    <Input
                      id="name" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required
                      placeholder="e.g. Table 01"
                      className="border-[#d9cbbd] bg-white focus:border-[#356b4f] focus:ring-0 h-11 font-bold text-[#28231f]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seats" className="text-[9px] font-black uppercase tracking-widest text-[#756b63]">Seat Capacity</Label>
                    <Input
                      id="seats" 
                      type="number" 
                      min="1" 
                      value={seats} 
                      onChange={e => setSeats(e.target.value)} 
                      required 
                      placeholder="e.g. 4"
                      className="border-[#d9cbbd] bg-white focus:border-[#356b4f] focus:ring-0 h-11 font-bold text-[#28231f]"
                    />
                  </div>
                  <Button
                    type="submit" 
                    className="w-full bg-[#28231f] hover:bg-[#356b4f] text-white h-12 font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Deploying...' : 'Deploy Table'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedSessionOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28231f]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl border-[#d9cbbd] shadow-2xl overflow-hidden bg-[#fffaf3] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#28231f] text-white flex items-center justify-between p-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl">
                  {selectedSessionOrders.tableName.match(/\d+/)?.[0] || 'T'}
                </div>
                <div>
                  <h2 className="text-lg font-normal tracking-tight">{selectedSessionOrders.tableName}</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Current Session Orders</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                onClick={() => setSelectedSessionOrders(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <CardContent className="p-6 space-y-6">
                {selectedSessionOrders.orders.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-[#d9cbbd] rounded-3xl">
                    <Clock className="mx-auto h-12 w-12 text-[#d9cbbd] mb-4" />
                    <p className="text-[#756b63] font-bold uppercase tracking-widest text-[10px]">No active orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedSessionOrders.orders.map((order) => (
                      <div key={order.id} className="bg-white border border-[#d9cbbd] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[8px] font-mono font-black text-[#756b63] uppercase tracking-tighter">NODE-ORD-{order.id.slice(0, 6)}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border",
                                order.status === OrderStatus.SERVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                'bg-[#fcf3d7] text-[#8c6d1f] border-[#f5e6b3]'
                              )}>
                                {order.status}
                              </span>
                              <span className="text-[9px] text-[#756b63] font-black uppercase tracking-widest">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-[#28231f]">
                              ₹{(order.items.reduce((sum, i) => sum + (i.priceCents * i.quantity), 0) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 flex items-center justify-center rounded bg-[#f3eadf] text-[10px] font-black text-[#356b4f]">{item.quantity}</span>
                                <span className="font-bold text-[#28231f]">{item.name}</span>
                              </div>
                              <span className="text-[#756b63] text-xs font-medium">₹{(item.priceCents / 100).toFixed(2)} ea</span>
                            </li>
                          ))}
                        </ul>
                        {order.notes && (
                          <div className="mt-4 p-3 rounded-xl bg-[#f8f0e7] border border-[#d9c0a9] flex gap-2">
                            <MessageSquare className="h-4 w-4 text-[#a3543e] flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-[#a3543e] font-medium italic">"{order.notes}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>

            <div className="p-6 bg-white border-t border-[#d9cbbd] flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#756b63]">Running Session Total</span>
                <span className="text-2xl font-black text-[#356b4f]">
                  ₹{((selectedSessionOrders.bill?.totalCents || 0) / 100).toFixed(2)}
                </span>
              </div>
              <Button onClick={() => setSelectedSessionOrders(null)} className="bg-[#28231f] hover:bg-[#356b4f] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg">
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* QR Code Dialog */}
      {qrTable && (() => {
        const target = `${window.location.origin}/t/${qrTable.qrToken}`;
        const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(target)}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28231f]/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <Card className="w-full max-w-sm border-[#d9cbbd] shadow-2xl overflow-hidden bg-[#fffaf3] animate-in zoom-in-95 duration-200">
              <div className="bg-[#356b4f] p-6 text-white text-center">
                <h2 className="text-xl font-normal">{qrTable.name}</h2>
                <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mt-1">Digital Menu Access Node</p>
              </div>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 w-fit rounded-3xl border-2 border-[#d9cbbd] p-4 bg-white shadow-inner">
                  <img src={imageUrl} alt={`QR code for ${qrTable.name}`} className="h-48 w-48" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#f3eadf] p-3 text-left border border-[#d9cbbd]/50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#756b63]">Access Link</p>
                    <p className="truncate text-xs font-bold text-[#28231f]">{target}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-2 border-[#d9cbbd] text-[#756b63] font-black uppercase tracking-widest text-[10px] h-11 rounded-xl">
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <a
                      href={imageUrl}
                      download={`${qrTable.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                      className="flex-1"
                    >
                      <Button className="w-full gap-2 bg-[#356b4f] hover:bg-[#28573f] text-white font-black uppercase tracking-widest text-[10px] h-11 rounded-xl shadow-lg">
                        <Download className="h-4 w-4" /> Save
                      </Button>
                    </a>
                  </div>
                  <Button variant="ghost" onClick={() => setQrTable(null)} className="w-full text-[#756b63] hover:text-[#28231f] font-black uppercase tracking-widest text-[10px]">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* AlertDialogs for confirmations */}
      <AlertDialog open={!!confirmDeleteTable} onOpenChange={(open) => !open && setConfirmDeleteTable(null)}>
        <AlertDialogContent className="bg-[#fffaf3] border-[#d9cbbd]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#28231f] font-normal">Decommission Table Node?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#756b63]">
              Are you sure you want to decommission <span className="font-bold text-[#28231f]">{confirmDeleteTable?.name}</span>? This action will remove the table from the digital floor plan permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#d9cbbd] text-[#756b63] font-black uppercase tracking-widest text-[10px] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg"
              onClick={() => {
                if (confirmDeleteTable) {
                  deleteTable(confirmDeleteTable.id);
                  setConfirmDeleteTable(null);
                }
              }}
            >
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmForceClose} onOpenChange={(open) => !open && setConfirmForceClose(null)}>
        <AlertDialogContent className="bg-[#fffaf3] border-[#d9cbbd]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#28231f] font-normal">Emergency Session Closure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#756b63]">
              This will FORCE CLOSE the session for <span className="font-bold text-[#28231f]">{confirmForceClose?.name}</span>. This protocol bypasses standard payment verification and should only be used in administrative emergencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#d9cbbd] text-[#756b63] font-black uppercase tracking-widest text-[10px] rounded-xl">Abort</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#a3543e] hover:bg-[#8e4936] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg"
              onClick={() => {
                if (confirmForceClose) {
                  forceClose(confirmForceClose.id);
                  setConfirmForceClose(null);
                }
              }}
            >
              Force Close Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print only component */}
      <div className="print-only">
        {qrTable && (
          <div className="flex flex-col items-center justify-center h-screen text-center p-20 bg-white">
            <h1 className="text-6xl font-normal mb-8 text-[#28231f]">{qrTable.name}</h1>
            <div className="border-[12px] border-[#356b4f] p-8 rounded-[40px] mb-8">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/t/${qrTable.qrToken}`)}`}
                alt="QR Code"
                className="w-96 h-96"
              />
            </div>
            <p className="text-3xl font-black uppercase tracking-[0.3em] text-[#356b4f]">Scan to Order</p>
            <p className="mt-4 text-xl text-[#756b63] font-medium italic">Powered by Artisan RMS</p>
          </div>
        )}
      </div>
    </div>
  );
}
