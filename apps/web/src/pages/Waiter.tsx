import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useMenu } from '../hooks/useMenu';
import { useCashierSessions } from '../hooks/useCashierSessions';
import { useTables } from '../hooks/useTables';
import { OrderStatus, OrderWithItems, TableStatus } from '@/contracts';
import {
  Plus,
  Utensils,
  Clock,
  CheckCircle2,
  X,
  IndianRupee,
  MessageSquare,
  Search,
  Filter,
  LayoutGrid,
  ChefHat,
  ArrowRight,
  HandPlatter,
  MonitorPlay,
  History,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { cn } from '../lib/utils';
import { ScrollArea } from '../components/ui/scroll-area';

export default function WaiterPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'occupied' | 'billing'>('all');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Order Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'add'>('summary');

  const { data: tablesData, isLoading: isLoadingTables } = useTables();
  const { data: sessionsData, isLoading: isLoadingSessions, getSessionOrders, startSession, isStartingSession } = useCashierSessions();
  const { data: menu } = useMenu();

  const [activeSessionOrders, setActiveSessionOrders] = useState<OrderWithItems[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const tables = tablesData?.tables || [];
  const activeSessions = sessionsData?.sessions || [];

  const tableStates = useMemo(() => {
    return tables.map(table => {
      const session = activeSessions.find(s => s.tableName === table.name);
      return {
        ...table,
        session
      };
    });
  }, [tables, activeSessions]);

  const selectedTable = useMemo(() =>
    tableStates.find(t => t.id === selectedTableId),
    [tableStates, selectedTableId]
  );

  const filteredTables = useMemo(() => {
    let result = tableStates;
    if (filter === 'occupied') result = tableStates.filter(t => t.session);
    if (filter === 'billing') result = tableStates.filter(t => t.status === TableStatus.BILLING);
    return result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [tableStates, filter]);

  // Fetch orders when selectedTable changes or when notified (real-time handled by hook query invalidation)
  useEffect(() => {
    if (selectedTable?.session) {
      setIsLoadingOrders(true);
      getSessionOrders(selectedTable.session.id)
        .then(orders => {
          setActiveSessionOrders(orders.filter(o => o.status !== OrderStatus.CANCELLED));
        })
        .catch(err => console.error("Failed to fetch orders", err))
        .finally(() => setIsLoadingOrders(false));
    } else {
      setActiveSessionOrders([]);
    }
  }, [selectedTable?.session?.id, sessionsData]); // Re-run when sessionsData updates to catch live order changes

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!selectedTable?.session) return;
      await apiClient.post('/orders', {
        sessionId: selectedTable.session.id,
        notes,
        items: [{ menuItemId: selectedItemId, quantity }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
      setSelectedItemId('');
      setQuantity(1);
      setNotes('');
      setViewMode('summary');
    }
  });

  const menuItems = menu?.flatMap(cat => cat.items.filter(i => i.isAvailable)) || [];
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans selection:bg-emerald-100 relative">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      {/* Dynamic Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-[#d9cbbd] bg-[#f3eadf]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#356b4f] p-2 text-white shadow-lg shadow-emerald-900/10">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-normal tracking-tight text-[#28231f]">Waiter Hub</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#356b4f]">Operations Live</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center bg-[#eadfd2] rounded-lg p-1 border border-[#cbbbaa]">
                {(['all', 'occupied', 'billing'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      filter === t ? "bg-white text-[#28231f] shadow-sm" : "text-[#756b63] hover:text-[#28231f]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* Main Floor Area (Left 8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Live Tables', value: tables.length, icon: LayoutGrid, color: 'text-[#28231f]', bg: 'bg-[#fffaf3]' },
                { label: 'Active Service', value: activeSessions.length, icon: Utensils, color: 'text-[#a3543e]', bg: 'bg-[#f8f0e7]' },
                { label: 'Running Orders', value: activeSessions.reduce((acc, s) => acc + s.unservedCount, 0), icon: Clock, color: 'text-[#2b4a7d]', bg: 'bg-[#e7eff8]' },
                { label: 'Billing Requests', value: tables.filter(t => t.status === TableStatus.BILLING).length, icon: IndianRupee, color: 'text-[#356b4f]', bg: 'bg-[#dce5d7]' },
              ].map((stat, i) => (
                <Card key={i} className={cn("border-[#d9cbbd] shadow-sm", stat.bg)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#756b63]">{stat.label}</p>
                      <p className={cn("text-2xl font-black mt-0.5", stat.color)}>{stat.value}</p>
                    </div>
                    <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Floor Plan */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-normal tracking-tight text-[#28231f]">Dining Floor</h2>
                  <p className="text-[10px] font-bold text-[#756b63] uppercase tracking-widest">Select a table to manage orders</p>
                </div>
                <div className="flex sm:hidden items-center gap-2">
                   <Filter className="h-4 w-4 text-[#756b63]" />
                   <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-xs font-bold border-none bg-transparent focus:ring-0 text-[#28231f]"
                   >
                     <option value="all">All</option>
                     <option value="occupied">Occupied</option>
                     <option value="billing">Billing</option>
                   </select>
                </div>
              </div>

              {isLoadingTables || isLoadingSessions ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="aspect-square w-full rounded-2xl bg-[#fffaf3] border border-[#d9cbbd]" />)}
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="bg-[#fffaf3] border-2 border-dashed border-[#d9cbbd] rounded-3xl p-20 text-center">
                  <LayoutGrid className="mx-auto h-12 w-12 text-[#d9cbbd] mb-4" />
                  <p className="text-[#756b63] font-bold uppercase tracking-widest">No tables match your filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  {filteredTables.map((table) => {
                    const isOccupied = !!table.session;
                    const isBilling = table.status === TableStatus.BILLING;
                    const isSelected = selectedTableId === table.id;

                    return (
                      <Card
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={cn(
                          "group aspect-square cursor-pointer transition-all duration-300 relative overflow-hidden border-2",
                          isSelected
                            ? "border-[#356b4f] ring-4 ring-[#356b4f]/10 shadow-xl"
                            : isBilling
                              ? "bg-[#356b4f] border-[#356b4f] shadow-lg shadow-[#356b4f]/20"
                              : isOccupied
                                ? "bg-[#fffaf3] border-[#d9c0a9] hover:border-[#a3543e] shadow-sm"
                                : "bg-[#fffaf3] border-[#d9cbbd] opacity-60 hover:opacity-100 hover:border-[#cbbbaa] shadow-sm"
                        )}
                      >
                        <CardContent className="h-full p-4 flex flex-col justify-between items-center text-center">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-110 shadow-sm",
                            isBilling ? "bg-white/20 text-white" : isOccupied ? "bg-[#f8f0e7] text-[#a3543e]" : "bg-[#f3eadf] text-[#756b63]"
                          )}>
                            {table.name.match(/\d+/)?.[0] || table.name.charAt(0)}
                          </div>

                          <div>
                            <h3 className={cn("font-black text-sm", isBilling ? "text-white" : "text-[#28231f]")}>
                              {table.name}
                            </h3>
                            {isOccupied && !isBilling && (
                              <div className="flex items-center justify-center gap-1.5 mt-1">
                                <span className={cn(
                                  "flex h-1.5 w-1.5 rounded-full bg-[#a3543e]",
                                  table.session?.unservedCount ? "animate-pulse" : "opacity-40"
                                )} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#a3543e]">
                                  {table.session?.unservedCount || 0} Pending
                                </span>
                              </div>
                            )}
                            {isBilling && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100">
                                Billing Requested
                              </span>
                            )}
                            {!isOccupied && (
                               <span className="text-[9px] font-black uppercase tracking-widest text-[#756b63]/50">
                                Vacant
                               </span>
                            )}
                          </div>

                          {isOccupied && (
                            <div className={cn(
                              "text-sm font-black tracking-tight",
                              isBilling ? "text-white" : "text-[#356b4f]"
                            )}>
                              ₹{(table.session!.bill.totalCents / 100).toFixed(0)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Table Control Sidebar (Right 4 Columns) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              {!selectedTable ? (
                <Card className="border-none shadow-xl bg-[#28231f] text-white overflow-hidden aspect-[4/5] flex flex-col items-center justify-center p-12 text-center">
                  <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <HandPlatter className="h-10 w-10 text-[#356b4f]" />
                  </div>
                  <h3 className="text-xl font-normal mb-2">Service Terminal</h3>
                  <p className="text-[#756b63] text-sm font-medium">Please select a table from the floor to view details or add new orders.</p>
                </Card>
              ) : (
                <Card className={cn(
                  "border-[#d9cbbd] shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
                  selectedTable.session ? "bg-[#fffaf3]" : "bg-[#f8f0e7]"
                )}>
                  {/* Sidebar Header */}
                  <div className={cn(
                    "p-6 text-white flex items-center justify-between shrink-0",
                    selectedTable.status === TableStatus.BILLING ? "bg-[#356b4f]" : "bg-[#28231f]"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl">
                        {selectedTable.name.match(/\d+/)?.[0] || 'T'}
                      </div>
                      <div>
                        <h2 className="text-lg font-normal tracking-tight">{selectedTable.name}</h2>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                            {selectedTable.session ? 'Active Session' : 'Vacant Node'}
                          </p>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                            {selectedTable.qrToken}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTableId(null)}
                      className="rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Sidebar Content */}
                  {!selectedTable.session ? (
                    <div className="p-10 text-center space-y-6">
                      <div className="h-16 w-16 mx-auto rounded-full bg-[#eadfd2] flex items-center justify-center text-[#cbbbaa]">
                        <AlertCircle className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[#756b63] font-bold uppercase text-[10px] tracking-widest">No active session</p>
                        <p className="text-[#756b63]/70 text-xs px-4">This table is currently vacant. You can start a session manually for a walk-in guest.</p>
                      </div>
                      <Button
                        onClick={() => startSession(selectedTable.id)}
                        disabled={isStartingSession}
                        className="w-full h-12 bg-[#356b4f] hover:bg-[#28573f] text-white font-black rounded-xl shadow-lg uppercase tracking-widest"
                      >
                        {isStartingSession ? 'Starting...' : 'Start Session'}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-[#eadfd2]/50 flex gap-1 shrink-0">
                        <button
                          onClick={() => setViewMode('summary')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                            viewMode === 'summary' ? "bg-white text-[#28231f] shadow-sm" : "text-[#756b63] hover:bg-white/50"
                          )}
                        >
                          <MonitorPlay className="h-3 w-3" /> Summary
                        </button>
                        <button
                          onClick={() => setViewMode('add')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                            viewMode === 'add' ? "bg-white text-[#28231f] shadow-sm" : "text-[#756b63] hover:bg-white/50"
                          )}
                        >
                          <Plus className="h-3 w-3" /> Add Item
                        </button>
                      </div>

                      <div className="flex-1 min-h-[400px] max-h-[600px] overflow-hidden flex flex-col">
                        {viewMode === 'summary' ? (
                          <div className="flex-1 flex flex-col p-6 space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-black uppercase tracking-widest text-[#756b63] flex items-center gap-2">
                                <History className="h-3.5 w-3.5" /> Recent Rounds
                              </h3>
                              <span className="text-[10px] font-black text-[#356b4f] bg-[#dce5d7] px-2 py-0.5 rounded-full">
                                {activeSessionOrders.length} Orders
                              </span>
                            </div>

                            <ScrollArea className="flex-1 -mr-2 pr-2">
                              {isLoadingOrders ? (
                                <div className="space-y-3">
                                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                                </div>
                              ) : activeSessionOrders.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-[#d9cbbd] rounded-2xl">
                                  <Clock className="mx-auto h-8 w-8 text-[#d9cbbd] mb-2" />
                                  <p className="text-[#756b63] text-xs font-medium">Waiting for orders...</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {activeSessionOrders.map((order) => (
                                    <div key={order.id} className="group relative bg-white border border-[#d9cbbd] rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                      <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                            order.status === OrderStatus.SERVED ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                          )}>{order.status}</span>
                                          <span className="text-[9px] font-bold text-[#756b63]">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <span className="text-xs font-black text-[#28231f]">₹{(order.items.reduce((s, i) => s + (i.priceCents * i.quantity), 0) / 100).toFixed(0)}</span>
                                      </div>
                                      <ul className="space-y-1">
                                        {order.items.map((item, idx) => (
                                          <li key={idx} className="flex justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                              <span className="font-black text-[#356b4f]">{item.quantity}×</span>
                                              <span className="font-bold text-[#28231f]">{item.name}</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                      {order.notes && (
                                        <div className="mt-2 text-[9px] text-[#756b63] italic font-medium flex gap-1 bg-[#f3eadf]/50 p-1.5 rounded border border-[#d9cbbd]/30">
                                          <MessageSquare className="h-2.5 w-2.5 mt-0.5 shrink-0" /> "{order.notes}"
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        ) : (
                          /* Add Item Form */
                          <div className="flex-1 flex flex-col p-6 space-y-6 animate-in fade-in duration-300">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#756b63]" />
                              <Input
                                placeholder="Search menu..."
                                className="pl-10 h-11 rounded-xl border-[#d9cbbd] bg-white text-sm focus:ring-[#356b4f]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>

                            <ScrollArea className="flex-1 -mr-2 pr-2">
                              <div className="space-y-2">
                                {filteredMenuItems.length === 0 ? (
                                  <p className="text-center py-10 text-xs text-[#756b63] italic">No matching dishes</p>
                                ) : (
                                  filteredMenuItems.map(item => (
                                    <button
                                      key={item.id}
                                      onClick={() => setSelectedItemId(item.id)}
                                      className={cn(
                                        "w-full text-left p-3 rounded-xl transition-all flex justify-between items-center group/item border",
                                        selectedItemId === item.id
                                        ? 'bg-[#28231f] border-[#28231f] text-white shadow-lg'
                                        : 'bg-white border-[#d9cbbd] hover:border-[#cbbbaa] text-[#28231f]'
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        {selectedItemId === item.id && <CheckCircle2 className="h-4 w-4 text-[#356b4f]" />}
                                        <div>
                                          <span className="font-bold text-sm block leading-none">{item.name}</span>
                                          <span className={cn("text-[9px] font-black mt-1 inline-block", selectedItemId === item.id ? 'text-[#356b4f]' : 'text-[#756b63]')}>
                                            ₹{(item.priceCents / 100).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                      <Plus className={cn("h-4 w-4", selectedItemId === item.id ? "text-[#356b4f]" : "text-[#cbbbaa] opacity-0 group-hover/item:opacity-100")} />
                                    </button>
                                  ))
                                )}
                              </div>
                            </ScrollArea>

                            {selectedItemId && (
                              <div className="p-4 bg-[#28231f] rounded-2xl text-white space-y-4 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[9px] font-black uppercase tracking-widest text-[#756b63]">Qty</Label>
                                  <div className="flex items-center gap-4 bg-white/10 rounded-lg p-1">
                                    <button
                                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                      className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
                                    >
                                      <X className="h-3 w-3 rotate-45" />
                                    </button>
                                    <span className="text-sm font-black">{quantity}</span>
                                    <button
                                      onClick={() => setQuantity(quantity + 1)}
                                      className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <Input
                                  placeholder="Prep notes..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="bg-white/10 border-none text-white text-xs placeholder:text-white/20 rounded-lg h-9"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sidebar Footer */}
                      <div className="p-6 bg-white border-t border-[#d9cbbd] shrink-0">
                        {viewMode === 'add' ? (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setViewMode('summary')}
                              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              Back
                            </Button>
                            <Button
                              disabled={!selectedItemId || createOrder.isPending}
                              onClick={() => createOrder.mutate()}
                              className="flex-[2] h-12 bg-[#356b4f] hover:bg-[#28573f] text-white font-black rounded-xl shadow-lg shadow-emerald-900/10 uppercase tracking-widest transition-all active:scale-95"
                            >
                              {createOrder.isPending ? 'Sending...' : 'Send Order'}
                            </Button>
                          </div>
                        ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#756b63]">Current Total</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <IndianRupee className="h-4 w-4 text-[#356b4f]" />
                                  <span className="text-2xl font-black text-[#28231f]">
                                    {((selectedTable.session?.bill.totalCents || 0) / 100).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {selectedTable.status !== TableStatus.BILLING && (
                                  <Button
                                    variant="outline"
                                    onClick={async () => {
                                      await apiClient.post('/sessions/request-bill', { sessionId: selectedTable.session?.id });
                                      queryClient.invalidateQueries({ queryKey: ['tables'] });
                                    }}
                                    className="h-12 border-[#d9cbbd] text-[#756b63] hover:bg-[#f3eadf] font-black rounded-xl px-4 uppercase tracking-widest text-[10px]"
                                  >
                                    Bill
                                  </Button>
                                )}
                                <Button
                                  onClick={() => setViewMode('add')}
                                  className="h-12 bg-[#28231f] hover:bg-slate-800 text-white font-black rounded-xl shadow-lg px-6 uppercase tracking-widest flex items-center gap-2"
                                >
                                  Order <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                        )}
                      </div>
                    </>
                  )}
                </Card>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
