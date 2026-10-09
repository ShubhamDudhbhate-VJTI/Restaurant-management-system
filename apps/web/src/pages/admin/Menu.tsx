import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';

export default function AdminMenuPage() {
  const { data: menu, isLoading, error, createCategory, deleteCategory, createItem, deleteItem, updateItem } = useMenu();
  const [newCatName, setNewCatName] = useState('');
  const [itemForm, setItemForm] = useState<{ categoryId: string; name: string; price: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'category' | 'item'; id: string } | null>(null);
  
  // Very basic forms for milestone 5
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-light tracking-tight mb-8">Menu Management</h1>
      
      <form onSubmit={handleAddCategory} className="mb-8 flex gap-4">
        <input 
          type="text" 
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New Category Name"
          className="border border-zinc-200 px-4 py-2 rounded focus:outline-none focus:border-zinc-400"
        />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded font-medium">Add Category</button>
      </form>

      <div className="space-y-8">
        {menu?.map(category => (
          <div key={category.id} className="border border-zinc-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-zinc-50 p-4 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-xl font-medium">{category.name}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAddItem(category.id)}
                  className="text-sm bg-white border border-zinc-200 px-3 py-1 rounded hover:bg-zinc-50"
                >
                  + Add Item
                </button>
                <button 
                  onClick={() => {
                    setPendingDelete({ kind: 'category', id: category.id });
                  }}
                  className="text-sm text-red-600 border border-transparent px-3 py-1 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <ul className="divide-y divide-zinc-100">
              {category.items.length === 0 && (
                <li className="p-4 text-zinc-500 text-center">No items in this category</li>
              )}
              {category.items.map(item => (
                <li key={item.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-zinc-500">${(item.priceCents / 100).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.isAvailable} 
                        onChange={() => handleToggleAvailable(item.id, item.isAvailable)} 
                      />
                      Available
                    </label>
                    <button 
                      onClick={() => {
                        setPendingDelete({ kind: 'item', id: item.id });
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {itemForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <form onSubmit={submitItem} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold">Add menu item</h2>
            <label className="block text-sm font-medium">Name<input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1 w-full border p-2 rounded" /></label>
            <label className="block text-sm font-medium">Price<input required type="number" min="0.01" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="mt-1 w-full border p-2 rounded" /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setItemForm(null)} className="border px-3 py-2 rounded">Cancel</button><button type="submit" className="bg-black text-white px-3 py-2 rounded">Add item</button></div>
          </form>
        </div>
      )}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4"><h2 className="text-xl font-semibold">Delete this {pendingDelete.kind}?</h2><p className="text-zinc-600">This action cannot be undone.</p><div className="flex justify-end gap-2"><button onClick={() => setPendingDelete(null)} className="border px-3 py-2 rounded">Cancel</button><button onClick={() => { if (pendingDelete.kind === 'category') deleteCategory.mutate(pendingDelete.id); else deleteItem.mutate(pendingDelete.id); setPendingDelete(null); }} className="bg-red-600 text-white px-3 py-2 rounded">Delete</button></div></div>
        </div>
      )}
    </div>
  );
}
