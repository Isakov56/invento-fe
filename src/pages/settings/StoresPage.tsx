import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Loader2, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { storesService } from '../../services/stores.service';
import type { Store } from '../../types';

export default function StoresPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
  });
  const queryClient = useQueryClient();

  // Fetch stores
  const { data: stores = [], isLoading, isError } = useQuery({
    queryKey: ['stores'],
    queryFn: storesService.getAll,
    retry: 1,
  });

  // Create store mutation
  const createMutation = useMutation({
    mutationFn: storesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      closeModal();
    },
  });

  // Update store mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => storesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      closeModal();
    },
  });

  // Delete store mutation
  const deleteMutation = useMutation({
    mutationFn: storesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const openModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        address: store.address,
        city: store.city,
        state: store.state,
        zipCode: store.zipCode,
        phone: store.phone,
        email: store.email || '',
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('stores.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('stores.subtitle')}</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center justify-center gap-2 w-full lg:w-auto">
          <Plus className="w-5 h-5" />
          {t('stores.addStore')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{t('errors.connectionError')}</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('errors.retryConnection')}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      ) : stores.length === 0 ? (
        <div className="card text-center py-12">
          <StoreIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('stores.noStores')}</p>
          <button onClick={() => openModal()} className="btn btn-primary">
            {t('stores.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <div key={store.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {store.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(store)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{store.address}</p>
                <p>
                  {store.city}, {store.state} {store.zipCode}
                </p>
                <p className="font-medium">{store.phone}</p>
                {store.email && <p>{store.email}</p>}
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    store.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {store.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editingStore ? t('stores.editStore') : t('stores.addStore')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('stores.storeName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="Main Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('stores.storeAddress')} *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  required
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.city')} *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    required
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.state')} *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                    required
                    placeholder="NY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.zipCode')} *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                  className="input"
                  required
                  placeholder="10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.phone')} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  required
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="store@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
