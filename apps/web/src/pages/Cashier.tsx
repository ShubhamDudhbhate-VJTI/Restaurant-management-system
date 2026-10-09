import { useState } from 'react';
import { useCashierSessions, CashierSession } from '../hooks/useCashierSessions';
import { PaymentMethod } from '@/contracts';
import { Button } from '../components/ui/button';
import { AlertCircle, IndianRupee, CreditCard, Smartphone, CheckCircle2, AlertTriangle, ChefHat } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';

gsap.registerPlugin(useGSAP);

export default function CashierPage() {
  const { data, pay, isPaying, forceClose, isForceClosing, isLoading, error } = useCashierSessions();
  const sessions = data?.sessions || [];
  
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isForceCloseModalOpen, setIsForceCloseModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [notice, setNotice] = useState<string | null>(null);
  const [printTimestamp, setPrintTimestamp] = useState<number | null>(null);
  const billPreview = selectedSession ? (() => {
    const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    const subtotal = selectedSession.bill.subtotalCents;
    const discountCents = Math.round(subtotal * discount / 100);
    const taxable = subtotal - discountCents;
    const configuredTaxRate = selectedSession.bill.subtotalCents > 0
      ? (selectedSession.bill.cgstCents + selectedSession.bill.sgstCents) / selectedSession.bill.subtotalCents
      : 0;
    const cgst = Math.round(taxable * configuredTaxRate / 2);
    const sgst = Math.round(taxable * configuredTaxRate / 2);
    return { discountCents, cgst, sgst, total: taxable + cgst + sgst };
  })() : null;

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>('.stagger-card');
      if (cards.length === 0) return;
      gsap.fromTo(cards, 
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 }
      );
    });
  }, [sessions.length]);

  const handlePay = async () => {
    if (!selectedSession) return;
    try {
      await pay({ sessionId: selectedSession.id, method: paymentMethod, discountPercent: Number(discountPercent) });
      setNotice('Payment processed successfully');
      setIsPayModalOpen(false);
      setSelectedSession(null);
      setDiscountPercent('0');
    } catch {
      setNotice('Payment failed. Please try again.');
    }
  };

  const handleForceClose = async () => {
    if (!selectedSession) return;
    try {
      await forceClose(selectedSession.id);
      setNotice('Session force-closed');
      setIsForceCloseModalOpen(false);
      setSelectedSession(null);
    } catch {
      setNotice('Force close failed. Please try again.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10">
              <Skeleton className="h-[320px] w-full rounded-[calc(2rem-0.375rem)]" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 px-4 border border-red-500/20 bg-red-500/5 rounded-[2rem] text-red-400 font-light border-dashed">
          Failed to load active sessions. Please try again.
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <CheckCircle2 className="w-16 h-16 mb-6 stroke-1" />
          <p className="text-xl tracking-wide">All tables are clear.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session: CashierSession) => (
          <div key={session.id} className="stagger-card group">
            {/* Double Bezel Outer Shell */}
            <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]">
              {/* Inner Core */}
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0A0A0A] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Table</p>
                      <h2 className="text-3xl font-light text-white">{session.tableName}</h2>
                    </div>
                    {session.unservedCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ChefHat className="w-4 h-4" />
                        <span className="text-xs font-semibold">{session.unservedCount} Pending</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-white/60">
                        <span>Subtotal</span>
                        <span>₹{(session.bill.subtotalCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>Tax (CGST & SGST)</span>
                        <span>₹{((session.bill.cgstCents + session.bill.sgstCents) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-medium text-white pt-2 border-t border-white/5">
                        <span>Total</span>
                        <span>₹{(session.bill.totalCents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <Button 
                    variant="outline"
                    className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
                    onClick={() => {
                      setSelectedSession(session);
                      setIsPayModalOpen(true);
                    }}
                  >
                    Settle Bill
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
                    onClick={() => {
                      setSelectedSession(session);
                      setPrintTimestamp(Date.now());
                      window.setTimeout(() => window.print(), 0);
                    }}
                  >
                    Print
                  </Button>
                  <Button 
                    variant="destructive"
                    className="rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                    onClick={() => {
                      setSelectedSession(session);
                      setIsForceCloseModalOpen(true);
                    }}
                  >
                    Force Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="light-app-page min-h-[100dvh] bg-[#0b0d0c] text-white p-4 md:p-10 font-sans">
      {notice && <div role="status" className="fixed top-4 right-4 z-20 bg-white text-black px-4 py-3 rounded-lg shadow-lg">{notice}<button className="ml-4 font-semibold" onClick={() => setNotice(null)}>Dismiss</button></div>}
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10">
          <div>
            <div className="mb-4 inline-block rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Cashier Hub
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.025em] text-white md:text-5xl">
              Active Sessions
            </h1>
          </div>
        </header>

        {renderContent()}
      </div>
      {selectedSession && (
        <article className="print-only">
          <h1>Restaurant Management System</h1>
          <p>Table: {selectedSession.tableName}</p>
          <p>Session: {selectedSession.id}</p>
          <p>Printed: {printTimestamp ? new Date(printTimestamp).toLocaleString() : ''}</p>
          <hr />
          <p>Subtotal: ₹{(selectedSession.bill.subtotalCents / 100).toFixed(2)}</p>
          <p>Discount: -₹{((billPreview?.discountCents || 0) / 100).toFixed(2)}</p>
          <p>Tax: ₹{(((billPreview?.cgst || 0) + (billPreview?.sgst || 0)) / 100).toFixed(2)}</p>
          <h2>Total: ₹{((billPreview?.total || selectedSession.bill.totalCents) / 100).toFixed(2)}</h2>
        </article>
      )}

      {/* Pay Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] text-white border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-light">Settle Bill - {selectedSession?.tableName}</h2>
              {selectedSession?.unservedCount ? (
                 <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-400">
                   <AlertTriangle className="w-5 h-5 shrink-0" />
                   <p className="text-sm">There are {selectedSession.unservedCount} unserved items. Settling now will close the table.</p>
                 </div>
              ) : null}
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-sm text-white/50 uppercase tracking-widest mb-2">Total Amount</p>
                <p className="text-5xl font-light text-emerald-400">
                  ₹{((billPreview?.total || 0) / 100).toFixed(2)}
                </p>
              </div>
              <label className="block text-sm text-white/60">Discount percentage
                <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white" />
              </label>
              {billPreview && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                  <div className="flex justify-between text-white/60"><span>Subtotal</span><span>₹{(selectedSession!.bill.subtotalCents / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between text-white/60"><span>Discount</span><span>-₹{(billPreview.discountCents / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between text-white/60"><span>CGST + SGST</span><span>₹{((billPreview.cgst + billPreview.sgst) / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white"><span>Payable</span><span>₹{(billPreview.total / 100).toFixed(2)}</span></div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: PaymentMethod.CASH, label: 'Cash', icon: IndianRupee },
                  { id: PaymentMethod.CARD, label: 'Card', icon: CreditCard },
                  { id: PaymentMethod.UPI, label: 'UPI', icon: Smartphone }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                      paymentMethod === method.id 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <method.icon className="w-6 h-6 stroke-1" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)} className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white" disabled={isPaying}>
                Cancel
              </Button>
              <Button onClick={handlePay} disabled={isPaying} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                {isPaying ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force Close Modal */}
      {isForceCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] text-white border border-red-500/20 rounded-[2rem] p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-light text-red-500 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" /> Force Close
              </h2>
              <p className="text-white/60 mt-4 text-base">
                Are you sure you want to force close <strong>{selectedSession?.tableName}</strong>? This will clear the table without recording payment.
              </p>
            </div>
            
            <div className="mt-8 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsForceCloseModalOpen(false)} className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white" disabled={isForceClosing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleForceClose} disabled={isForceClosing} className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                {isForceClosing ? 'Closing...' : 'Force Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
