// src/features/admin/components/ProductModal.js
export default function ProductModal({ isOpen, editingProduct, handleSubmit, handleCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">ID товара</label>
              <input type="text" name="id" defaultValue={editingProduct?.id || ''} readOnly={!!editingProduct} className={`w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 ${editingProduct ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Название</label>
              <input type="text" name="name" defaultValue={editingProduct?.name || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Категория</label>
              <input type="text" name="category" defaultValue={editingProduct?.category || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Мин. запас</label>
              <input type="number" name="min_stock" defaultValue={editingProduct?.min_stock || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Опт. запас</label>
              <input type="number" name="optimal_stock" defaultValue={editingProduct?.optimal_stock || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" onClick={handleCancel} className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600">Отмена</button>
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}