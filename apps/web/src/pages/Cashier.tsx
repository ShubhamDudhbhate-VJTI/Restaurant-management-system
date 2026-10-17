import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCashierSessions, CashierSession } from '../hooks/useCashierSessions';
import { PaymentMethod, OrderWithItems, OrderStatus } from '@/contracts';
import { Button } from '../components/ui/button';
import { AlertCircle, IndianRupee, CreditCard, Smartphone, CheckCircle2, AlertTriangle, ChefHat, X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";

gsap.registerPlugin(useGSAP);

export default function CashierPage() {
  const { data, pay, isPaying, isLoading, error, getSessionOrders } = useCashierSessions();
  const sessions = data?.sessions || [];
  
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [printingSession, setPrintingSession] = useState<{session: CashierSession, orders: OrderWithItems[]} | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [notice, setNotice] = useState<string | null>(null);
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

  const handlePrint = async (session: CashierSession) => {
    try {
      setNotice('Preparing bill for print...');
      const orders = await getSessionOrders(session.id);
      setPrintingSession({ session, orders });

      // Give React time to mount the Portal content
      setTimeout(() => {
        window.print();
        setNotice(null);
        // Note: We don't clear printingSession immediately because
        // Chrome print is non-blocking. It will clear on the next action.
      }, 700);
    } catch (err) {
      setNotice('Failed to fetch order details for printing');
    }
  };

  const aggregateItems = (orders: OrderWithItems[]) => {
    const items: Record<string, { name: string; priceCents: number; quantity: number }> = {};
    orders.forEach(order => {
      if (order.status === OrderStatus.CANCELLED) return;
      order.items.forEach(item => {
        if (items[item.menuItemId]) {
          items[item.menuItemId].quantity += item.quantity;
        } else {
          items[item.menuItemId] = {
            name: item.name,
            priceCents: item.priceCents,
            quantity: item.quantity
          };
        }
      });
    });
    return Object.values(items);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sessions.map((session: CashierSession) => (
          <div key={session.id} className="stagger-card group">
            <div className="p-1.5 rounded-[2rem] bg-[#fffaf3] ring-1 ring-[#d9cbbd] transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#fffaf3] p-7 flex flex-col justify-between min-h-[360px]">
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-[#a3543e] uppercase tracking-[0.2em] font-bold mb-2">Active Session</p>
                      <h2 className="text-4xl font-normal text-[#28231f]">{session.tableName}</h2>
                      <p className="text-[9px] font-mono text-[#a3543e] opacity-60 bg-[#f3eadf] px-2 py-0.5 rounded border border-[#d9cbbd]/30 inline-block mt-1">
                        Token: {session.qrToken}
                      </p>
                    </div>
                    {session.unservedCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f0e7] text-[#a3543e] border border-[#d9c0a9]">
                        <ChefHat className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{session.unservedCount} Left</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-[#d9cbbd]">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-[#756b63]">
                        <span>Subtotal</span>
                        <span className="font-medium text-[#28231f]">₹{(session.bill.subtotalCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#756b63]">
                        <span>Taxes</span>
                        <span className="font-medium text-[#28231f]">₹{((session.bill.cgstCents + session.bill.sgstCents) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-normal text-[#28231f] pt-4 border-t border-[#d9cbbd]/50">
                        <span>Total Due</span>
                        <span className="font-semibold text-[#356b4f]">₹{(session.bill.totalCents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <Button 
                    className="w-full bg-[#356b4f] hover:bg-[#28573f] text-white rounded-xl py-6"
                    onClick={() => {
                      setSelectedSession(session);
                      setIsPayModalOpen(true);
                    }}
                  >
                    Settle & Close
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-[#d9cbbd] text-[#28231f] hover:bg-[#f3eadf]"
                    onClick={() => handlePrint(session)}
                  >
                    Print Bill
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
    <div className="min-h-[100dvh] bg-[#f3eadf] text-[#28231f] p-4 md:p-12 font-sans relative">
       {/* Mesh Gradient Background */}
       <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      {notice && <div role="status" className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#28231f] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
        <span className="text-sm font-medium">{notice}</span>
        <button className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100" onClick={() => setNotice(null)}>Close</button>
      </div>}

      <div className="relative z-10 mx-auto max-w-6xl space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-[#d9cbbd]">
          <div>
            <div className="mb-4 inline-block rounded-full border border-[#cbbbaa] bg-[#eadfd2] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#a3543e]">
              Front of House
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-[#28231f] md:text-5xl">
              Cashier Hub
            </h1>
          </div>
        </header>

        {renderContent()}
      </div>

      {/* Print Template */}
      {printingSession && createPortal(
        <div className="print-only font-mono text-[11px] leading-relaxed text-black bg-white p-4">
          <div className="text-center mb-6 border-b border-dashed border-black pb-6">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-[#356b4f] rounded-lg flex items-center justify-center text-white font-bold text-xl print:bg-[#356b4f] print:text-white">R</div>
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-[#356b4f] mb-1">RMS GASTRONOMY</h1>
            <p className="text-[9px] uppercase tracking-widest opacity-80">Premium Dining & Bar</p>
            <p className="text-[8px] mt-2 opacity-60 italic">123 Gastronomy Blvd, Food District, MH 400001</p>
            <p className="text-[8px] opacity-60 italic">GSTIN: 27AAAAA0000A1Z5 | Ph: +91 98765 43210</p>
          </div>

          <div className="flex justify-between mb-6 text-[9px] border-b border-dashed border-black/20 pb-4">
            <div className="space-y-1">
              <p><span className="opacity-60">TABLE:</span> <span className="font-bold">{printingSession.session.tableName}</span></p>
              <p><span className="opacity-60">DATE:</span> {new Date().toLocaleDateString()}</p>
              <p><span className="opacity-60">TIME:</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-right space-y-1">
              <p><span className="opacity-60">BILL:</span> #{printingSession.session.id.slice(-6).toUpperCase()}</p>
              <p><span className="opacity-60">STAFF:</span> {localStorage.getItem('user_name') || 'CASHIER 01'}</p>
              <p className="font-bold text-[#a3543e] mt-1">PRO-FORMA</p>
            </div>
          </div>

          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="border-y border-black text-[9px] uppercase tracking-wider">
                <th className="text-left py-2 font-bold w-1/2">Item Description</th>
                <th className="text-center py-2 font-bold">Qty</th>
                <th className="text-right py-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-black/10">
              {aggregateItems(printingSession.orders).map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-3 pr-2 font-bold uppercase text-[10px]">
                    {item.name}
                    <div className="text-[8px] font-normal opacity-60">@ ₹{(item.priceCents / 100).toFixed(2)}</div>
                  </td>
                  <td className="text-center py-3">{item.quantity}</td>
                  <td className="text-right py-3 font-bold">{(item.priceCents * item.quantity / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 border-t border-black pt-4">
            <div className="flex justify-between text-[10px]">
              <span className="opacity-70">SUBTOTAL</span>
              <span>₹{(printingSession.session.bill.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px] italic opacity-60">
              <span>CGST (2.5%)</span>
              <span>₹{(printingSession.session.bill.cgstCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px] italic opacity-60">
              <span>SGST (2.5%)</span>
              <span>₹{(printingSession.session.bill.sgstCents / 100).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-y-2 border-double border-black mt-2">
              <span className="font-bold text-[14px] tracking-tighter">NET PAYABLE</span>
              <span className="font-bold text-[18px] text-[#356b4f]">₹{(printingSession.session.bill.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="inline-block border border-black p-1">
               <div className="w-16 h-16 bg-gray-50 flex flex-col items-center justify-center text-[7px] text-center leading-tight">
                  <span className="font-bold mb-1">SCAN TO PAY</span>
                  <div className="w-8 h-8 border border-black/20 flex items-center justify-center text-[5px]">QR CODE</div>
                  <span className="mt-1 opacity-60">FEEDBACK TOO</span>
               </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Thank you for dining!</p>
              <p className="text-[8px] opacity-60 mt-1 italic leading-normal">Taxes applied as per GST norms. Service charge not included.<br/>This is a computer generated bill.</p>
            </div>
            <div className="pt-4 border-t border-dashed border-black/20 text-[6px] opacity-40 uppercase tracking-[0.2em]">
              RMS Hub System | {new Date().toISOString()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pay Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#fffaf3] text-[#28231f] border-[#d9cbbd] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="p-10">
            <div className="mb-8 relative">
              <DialogHeader>
                <DialogTitle className="text-3xl font-normal text-[#28231f]">Settle Bill</DialogTitle>
              </DialogHeader>
              <p className="text-[#756b63] mt-2">Finalizing table <strong>{selectedSession?.tableName}</strong></p>

              {selectedSession?.unservedCount ? (
                 <div className="mt-6 p-4 rounded-2xl bg-[#f8f0e7] border border-[#d9c0a9] flex gap-4 text-[#7d4a2b]">
                   <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                   <p className="text-sm leading-relaxed">
                     <span className="font-bold">Attention:</span> There are {selectedSession.unservedCount} items not yet served. Settling now will force-complete the session.
                   </p>
                 </div>
              ) : null}
              <DialogClose className="absolute right-0 top-0 opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-[#f3eadf]/50 border border-[#d9cbbd] text-center">
                <p className="text-[10px] text-[#756b63] uppercase tracking-[0.2em] font-bold mb-3">Total Payable</p>
                <p className="text-6xl font-normal text-[#356b4f] tracking-tighter">
                  ₹{((billPreview?.total || 0) / 100).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#756b63] ml-1">Discount (%)</label>
                  <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full rounded-xl border border-[#d9cbbd] bg-white px-4 py-3 text-[#28231f] focus:ring-2 focus:ring-[#356b4f] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#756b63] ml-1">Payment Type</label>
                  <div className="flex gap-2">
                    {[
                      { id: PaymentMethod.CASH, icon: IndianRupee },
                      { id: PaymentMethod.CARD, icon: CreditCard },
                      { id: PaymentMethod.UPI, icon: Smartphone }
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex-1 flex items-center justify-center p-3 rounded-xl border transition-all ${
                          paymentMethod === method.id
                            ? 'bg-[#356b4f] border-[#356b4f] text-white shadow-md'
                            : 'bg-white border-[#d9cbbd] text-[#756b63] hover:bg-[#f3eadf]'
                        }`}
                      >
                        <method.icon className="w-5 h-5 stroke-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {billPreview && (
                <div className="space-y-3 rounded-2xl bg-[#fffaf3] border border-[#d9cbbd]/50 p-6 text-sm">
                  <div className="flex justify-between text-[#756b63]"><span>Subtotal</span><span>₹{(selectedSession!.bill.subtotalCents / 100).toFixed(2)}</span></div>
                  {billPreview.discountCents > 0 && (
                    <div className="flex justify-between text-[#a3543e]"><span>Discount Applied</span><span>-₹{(billPreview.discountCents / 100).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between text-[#756b63]"><span>Taxes (GST)</span><span>₹{((billPreview.cgst + billPreview.sgst) / 100).toFixed(2)}</span></div>
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-4">
              <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} className="flex-1 rounded-xl text-[#756b63]" disabled={isPaying}>
                Go Back
              </Button>
              <Button onClick={handlePay} disabled={isPaying} className="flex-[2] rounded-xl bg-[#356b4f] hover:bg-[#28573f] text-white py-6">
                {isPaying ? 'Processing...' : `Confirm ₹${((billPreview?.total || 0) / 100).toFixed(2)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
  );
}
