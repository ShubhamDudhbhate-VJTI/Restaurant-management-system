import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import {
  Plus,
  Trash2,
  Utensils,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  PackagePlus,
  LayoutGrid
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../../components/ui/dialog";
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

export default function AdminMenuPage() {
  const { data: menu, isLoading, error, createCategory, deleteCategory, createItem, deleteItem, updateItem } = useMenu();
  const [newCatName, setNewCatName] = useState('');
  const [itemForm, setItemForm] = useState<{ categoryId: string; name: string; price: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'category' | 'item'; id: string; name: string } | null>(null);
  
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createCategory.mutate({ name: newCatName.trim(), sortOrder: 0 }, {
      onSuccess: () => setNewCatName('')
    });
  };

  const handleAddItem = (categoryId: string) => {
    setItemForm({ categoryId, name: '', price: '' });
  };

  const submitItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemForm?.name.trim() || Number(itemForm.price) <= 0) return;
    createItem.mutate({
      categoryId: itemForm.categoryId,
      name: itemForm.name.trim(),
      priceCents: Math.round(Number(itemForm.price) * 100),
      description: '',
      imageUrl: null,
      isAvailable: true,
      sortOrder: 0
    }, { onSuccess: () => setItemForm(null) });
  };

  const handleToggleAvailable = (itemId: string, current: boolean) => {
    updateItem.mutate({ id: itemId, data: { isAvailable: !current } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3eadf] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-[#356b4f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#756b63] font-bold uppercase tracking-widest text-xs">Synchronizing Menu Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3eadf] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#fffaf3] border border-red-200 rounded-3xl p-12 text-center shadow-xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#28231f] mb-2">Sync Error</h2>
          <p className="text-[#756b63] mb-6">{(error as Error).message}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#28231f] text-white rounded-xl">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans pb-32">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-12 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#d9cbbd] pb-8">
          <div>
            <div className="mb-4 inline-block rounded-full border border-[#cbbbaa] bg-[#eadfd2] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#a3543e]">
              Culinary Inventory
            </div>
            <h1 className="text-4xl font-normal tracking-tight">Menu Architecture</h1>
            <p className="mt-2 text-[#756b63] font-medium">Design categories and dish listings for the digital menu.</p>
          </div>
        </header>

        <Card className="mb-12 border-[#d9cbbd] bg-[#fffaf3] shadow-lg shadow-[#28231f]/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63] mb-6">New Category Protocol</h2>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Signature Mains)"
                className="flex-1 border-[#d9cbbd] bg-white h-12 rounded-xl font-bold focus:ring-[#356b4f]"
              />
              <Button
                type="submit"
                disabled={!newCatName.trim() || createCategory.isPending}
                className="bg-[#356b4f] hover:bg-[#28573f] text-white px-8 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-12">
          {menu?.map(category => (
            <section key={category.id} className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#28231f] flex items-center justify-center text-white shadow-lg">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-normal tracking-tight">{category.name}</h2>
                  <span className="text-[10px] font-black bg-[#eadfd2] text-[#756b63] px-3 py-1 rounded-full uppercase border border-[#d9cbbd]">
                    {category.items.length} Items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleAddItem(category.id)}
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-[#356b4f] hover:bg-[#dce5d7] rounded-lg"
                  >
                    <PackagePlus className="mr-2 h-4 w-4" /> Add Dish
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPendingDelete({ kind: 'category', id: category.id, name: category.name });
                    }}
                    className="h-9 w-9 p-0 text-[#756b63] hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.length === 0 && (
                  <div className="md:col-span-2 rounded-[2rem] border-2 border-dashed border-[#d9cbbd] p-12 text-center bg-[#fffaf3]/50">
                    <Utensils className="mx-auto h-8 w-8 text-[#d9cbbd] mb-3" />
                    <p className="text-[#756b63] text-xs font-bold uppercase tracking-widest">No dishes in this category</p>
                  </div>
                )}
                {category.items.map(item => (
                  <Card key={item.id} className="border-[#d9cbbd] bg-[#fffaf3] hover:border-[#356b4f] transition-all group/card rounded-2xl overflow-hidden shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-[#f3eadf] flex items-center justify-center text-[#a3543e] font-black overflow-hidden border border-[#d9cbbd]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            item.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-[#28231f]">{item.name}</h3>
                          <p className="text-lg font-black text-[#356b4f]">₹{(item.priceCents / 100).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-[#d9cbbd] text-[#356b4f] focus:ring-[#356b4f]"
                              checked={item.isAvailable}
                              onChange={() => handleToggleAvailable(item.id, item.isAvailable)}
                            />
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest",
                              item.isAvailable ? "text-[#356b4f]" : "text-[#a3543e]"
                            )}>
                              {item.isAvailable ? 'Live' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPendingDelete({ kind: 'item', id: item.id, name: item.name });
                          }}
                          className="h-10 w-10 text-[#756b63] hover:text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={!!itemForm} onOpenChange={(open) => !open && setItemForm(null)}>
        <DialogContent className="bg-[#fffaf3] border-[#d9cbbd] rounded-[2.5rem] p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-normal tracking-tight flex items-center gap-3">
              <PackagePlus className="h-6 w-6 text-[#356b4f]" />
              New Menu Item
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitItem} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Dish Name</Label>
              <Input
                required
                value={itemForm?.name || ''}
                onChange={(e) => setItemForm(f => f ? { ...f, name: e.target.value } : null)}
                className="border-[#d9cbbd] bg-white h-12 rounded-xl font-bold"
                placeholder="e.g. Truffle Mushroom Risotto"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Price (₹)</Label>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={itemForm?.price || ''}
                onChange={(e) => setItemForm(f => f ? { ...f, price: e.target.value } : null)}
                className="border-[#d9cbbd] bg-white h-12 rounded-xl font-bold"
                placeholder="0.00"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setItemForm(null)} className="rounded-xl font-bold text-[#756b63]">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#356b4f] hover:bg-[#28573f] text-white rounded-xl font-black uppercase tracking-widest px-8 shadow-lg">
                Add to Menu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="bg-[#fffaf3] border-[#d9cbbd] rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#28231f] font-normal flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove {pendingDelete?.kind === 'category' ? 'Category' : 'Menu Item'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#756b63]">
              Are you sure you want to delete <span className="font-bold text-[#28231f]">{pendingDelete?.name}</span>?
              {pendingDelete?.kind === 'category' && " All items within this category will also be removed."} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#d9cbbd] text-[#756b63] font-black uppercase tracking-widest text-[10px] rounded-xl">Abort</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg"
              onClick={() => {
                if (pendingDelete) {
                  if (pendingDelete.kind === 'category') deleteCategory.mutate(pendingDelete.id);
                  else deleteItem.mutate(pendingDelete.id);
                  setPendingDelete(null);
                }
              }}
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
