import { useMenu } from '../hooks/useMenu';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

gsap.registerPlugin(useGSAP);

const fallbackMenuImages: Record<string, string> = {
  'Burrata & Tomatoes': 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=900&q=82',
  'Crispy Polenta': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=82',
  'Charred Corn Ribs': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=82',
  'Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=82',
  'Wild Mushroom Pasta': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=82',
  'Grilled Paneer Bowl': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=82',
  'Lemon Herb Chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=82',
  'House Lemonade': 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=900&q=82',
  'Cold Brew': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=82',
  'Basque Cheesecake': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=82',
  'Chocolate Pot de Crème': 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=900&q=82',
};

export default function MenuPage() {
  const { data: menu, isLoading, error } = useMenu();
  const { placeOrder } = useOrders();
  const { user } = useAuth();
  const { session } = useSession();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [cart, setCart] = useState<{ menuItemId: string, quantity: number, name: string, priceCents: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const previousCartKey = useRef<string | null>(null);

  const nextCartStorageKey = user && session ? `rms-cart:${user.id}:${session.id}` : null;

  useEffect(() => {
    if (previousCartKey.current !== nextCartStorageKey) {
      previousCartKey.current = nextCartStorageKey;
      if (!nextCartStorageKey) {
        return;
      }

      try {
        const savedCart = window.localStorage.getItem(nextCartStorageKey);
        setCart(savedCart ? JSON.parse(savedCart) : []);
      } catch {
        setCart([]);
      }
      return;
    }

    if (!nextCartStorageKey) {
      return;
    }

    window.localStorage.setItem(nextCartStorageKey, JSON.stringify(cart));
  }, [cart, nextCartStorageKey]);

  const activeCart = nextCartStorageKey ? cart : [];

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>('.stagger-card', containerRef.current);
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.1, clearProps: "all" }
        );
      }
    });
  }, [menu]);

  const addToCart = (item: any) => {
    if (!session) {
      setCartNotice('Book a table before adding items to your order.');
      return;
    }
    setCartNotice(null);
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, quantity: 1, name: item.name, priceCents: item.priceCents }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0)); // Ensure items are removed if quantity is 0
  };

  const handleCheckout = () => {
    if (activeCart.length === 0 || !session) {
      setCartNotice('Book a table before placing an order.');
      return;
    }
    placeOrder.mutate({
      items: activeCart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity }))
    }, {
      onSuccess: () => {
        setCart([]);
        if (nextCartStorageKey) window.localStorage.removeItem(nextCartStorageKey);
        setIsCartOpen(false);
      }
    });
  };

  const cartTotal = activeCart.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const cartItemCount = activeCart.reduce((sum, item) => sum + item.quantity, 0);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-16">
          <section className="menu-category">
            <h2 className="mb-8 flex items-center gap-4 text-2xl font-normal tracking-wide text-[#28231f]">
              <Skeleton className="h-8 w-40" />
              <div className="h-px bg-white/10 flex-1"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-1.5 rounded-[2rem] ring-1 ring-white/5 bg-white/5">
                  <Skeleton className="h-[200px] w-full rounded-[calc(2rem-0.375rem)]" />
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center p-12 border border-red-500/20 bg-red-500/5 rounded-3xl text-red-400 font-light border-dashed">
          Failed to load menu. Please try again later.
        </div>
      );
    }

    if (!menu || menu.every(cat => cat.items.filter(i => i.isAvailable).length === 0)) {
      return (
        <div className="text-center p-12 border border-white/10 rounded-3xl text-white/40 font-light border-dashed">
          The menu is currently empty.
        </div>
      );
    }

    return (
      <div className="space-y-16">
        {menu.filter(cat => cat.items.length > 0).map(category => (
          <section key={category.id} className="menu-category">
            <h2 className="mb-8 flex items-center gap-4 text-2xl font-light tracking-wide text-[#28231f]">
              {category.name}
              <div className="h-px flex-1 bg-[#d9cbbd]"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.filter(i => i.isAvailable).map(item => (
                <div key={item.id} className="stagger-card group cursor-pointer" onClick={() => addToCart(item)}>
                    <div className="rounded-[2rem] bg-[#e8dfd5] p-1.5 ring-1 ring-[#d1c1b1] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]">
                      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#fffaf3] shadow-[0_12px_30px_rgba(88,62,42,0.06)]">
                      <div className="grid grid-cols-[112px_1fr] gap-5 p-5 sm:grid-cols-[136px_1fr] sm:p-6">
                        <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-[#e8dfd5]">
                          <img
                            src={item.imageUrl || fallbackMenuImages[item.name]}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                          />
                        </div>
                        <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-normal text-[#28231f]">{item.name}</h3>
                          <div className="ml-4 shrink-0 text-lg font-medium text-[#a3543e]">
                            ₹{(item.priceCents / 100).toFixed(2)}
                          </div>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm leading-relaxed text-[#756b63]">{item.description}</p>
                        )}
                        </div>
                      </div>
                      <div className="flex justify-end border-t border-[#eadfd4] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                        <button 
                          className="text-xs font-semibold uppercase tracking-widest text-[#356b4f] transition-colors hover:text-[#a3543e]"
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        >
                          {session ? '+ Add to order' : 'Book a table to order'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f3eadf] p-4 font-sans text-[#28231f] pb-32 md:p-12" ref={containerRef}>
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col items-start justify-between border-b border-[#d9cbbd] py-6 md:flex-row md:items-center">
          <div>
            <div className="mb-4 inline-block rounded-full border border-[#cbbbaa] bg-[#eadfd2] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#a3543e]">
              From table to kitchen
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-[#28231f] md:text-5xl">
              Our Menu
            </h1>
          </div>
        </header>

        {cartNotice && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9a79b] bg-[#f8e7e2] px-4 py-3 text-sm text-[#7e3e2f]">
            <span>{cartNotice}</span>
            <button type="button" onClick={() => navigate('/tables')} className="font-semibold underline underline-offset-4">
              Book a table
            </button>
          </div>
        )}

        <div className="space-y-16">
          {renderContent()}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 bg-[#111] border border-white/10 text-white p-4 pr-6 rounded-full shadow-2xl hover:bg-white/5 transition-all duration-300 hover:scale-105 z-40 flex items-center gap-4 group"
        >
          <div className="relative bg-emerald-500/20 p-3 rounded-full text-emerald-400">
            <ShoppingBag className="w-6 h-6 stroke-1" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          </div>
          <span className="font-light text-xl tracking-wide group-hover:text-emerald-400 transition-colors">
            ₹{(cartTotal / 100).toFixed(2)}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
              <h2 className="text-3xl font-light text-white">Your Order</h2>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {activeCart.length === 0 ? (
                <div className="text-center text-white/40 mt-12 text-lg font-light">Your cart is empty</div>
              ) : (
                <ul className="space-y-6">
                  {activeCart.map(item => (
                    <li key={item.menuItemId} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex-1">
                        <h4 className="font-light text-lg text-white">{item.name}</h4>
                        <div className="text-emerald-400/80 mt-1">₹{(item.priceCents / 100).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-4 bg-black/50 rounded-full px-3 py-1 border border-white/5">
                        <button 
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center font-medium text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-white/10 bg-black/40 backdrop-blur-md">
              <div className="flex justify-between items-center mb-8">
                <span className="text-white/50 text-sm uppercase tracking-widest font-semibold">Subtotal</span>
                <span className="text-3xl font-light text-white">₹{(cartTotal / 100).toFixed(2)}</span>
              </div>
              <button
                disabled={activeCart.length === 0 || placeOrder.isPending}
                onClick={handleCheckout}
                className="w-full bg-emerald-500 text-black py-4 rounded-full font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {placeOrder.isPending ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
