import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Loader2, Plus, Edit, Trash2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { variantsService } from '../../services/variants.service';
import { uploadService } from '../../services/upload.service';
import { storesService } from '../../services/stores.service';
import { useAuthStore } from '../../store/authStore';
import type { ProductVariant } from '../../types';

export default function ProductFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = !!id;

  // Check if user can modify inventory (OWNER and MANAGER only)
  const canModify = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    storeId: user?.storeId || '',
    brand: '',
    imageUrl: '',
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Variant management
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantData, setVariantData] = useState({
    sku: '',
    size: '',
    color: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    lowStockThreshold: '10',
  });

  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id!),
    enabled: isEditing,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: storesService.getAll,
  });

  // Fetch variants if editing
  const { data: variants = [], isLoading: isLoadingVariants } = useQuery({
    queryKey: ['variants', id],
    queryFn: () => variantsService.getByProductId(id!),
    enabled: isEditing,
  });

  // Update form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        storeId: product.storeId,
        brand: product.brand || '',
        imageUrl: product.imageUrl || '',
        isActive: product.isActive,
      });
      if (product.imageUrl) {
        setImagePreview(uploadService.getImageUrl(product.imageUrl));
      }
    }
  }, [product]);

  // Create/Update product mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Upload image if selected
      let imageUrl = data.imageUrl;
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await uploadService.uploadImage(imageFile);
          imageUrl = uploadResult.url;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const productData = { ...data, imageUrl };

      if (isEditing) {
        return productsService.update(id!, productData);
      } else {
        return productsService.create(productData);
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (!isEditing) {
        // Navigate to the new product's edit page to add variants
        navigate(`/inventory/products/${data.id}/edit`);
      }
    },
  });

  // Variant mutations
  const createVariantMutation = useMutation({
    mutationFn: (data: any) => variantsService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants', id] });
      closeVariantModal();
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: any }) =>
      variantsService.update(variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants', id] });
      closeVariantModal();
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: variantsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants', id] });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const openVariantModal = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant);
      setVariantData({
        sku: variant.sku,
        size: variant.size || '',
        color: variant.color || '',
        barcode: variant.barcode || '',
        costPrice: variant.costPrice.toString(),
        sellingPrice: variant.sellingPrice.toString(),
        stockQuantity: variant.stockQuantity.toString(),
        lowStockThreshold: variant.lowStockThreshold.toString(),
      });
    } else {
      setEditingVariant(null);
      setVariantData({
        sku: '',
        size: '',
        color: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '0',
        lowStockThreshold: '10',
      });
    }
    setShowVariantModal(true);
  };

  const closeVariantModal = () => {
    setShowVariantModal(false);
    setEditingVariant(null);
  };

  const handleVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      sku: variantData.sku,
      size: variantData.size || undefined,
      color: variantData.color || undefined,
      barcode: variantData.barcode || undefined,
      costPrice: parseFloat(variantData.costPrice),
      sellingPrice: parseFloat(variantData.sellingPrice),
      stockQuantity: parseInt(variantData.stockQuantity),
      lowStockThreshold: parseInt(variantData.lowStockThreshold),
    };

    if (editingVariant) {
      updateVariantMutation.mutate({ variantId: editingVariant.id, data });
    } else {
      createVariantMutation.mutate(data);
    }
  };

  const handleDeleteVariant = (variantId: string) => {
    if (window.confirm(t('products.deleteConfirm'))) {
      deleteVariantMutation.mutate(variantId);
    }
  };

  if (isEditing && (isLoadingProduct || isLoadingVariants)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/inventory')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('common.back')}
      </button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {isEditing ? t('products.editProduct') : t('products.addProduct')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('products.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('products.productName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.category')} *
              </label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="input"
                required
                disabled={categories.length === 0}
              >
                <option value="">
                  {categories.length === 0 ? t('products.noProducts') : t('common.select')}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  {t('products.deleteConfirm')}{' '}
                  <Link
                    to="/inventory?tab=categories"
                    className="underline font-medium hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    {t('categories.addCategory')}
                  </Link>{' '}
                  {t('products.createFirst')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.store')} *
              </label>
              <select
                value={formData.storeId}
                onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                className="input"
                required
                disabled={stores.length === 0}
              >
                <option value="">
                  {stores.length === 0 ? t('errors.resourceNotFound') : t('common.select')}
                </option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
              {stores.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  {t('errors.resourceNotFound')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('products.productImage')}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400" />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.active')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="btn btn-secondary flex-1"
            disabled={saveMutation.isPending || isUploadingImage}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={saveMutation.isPending || isUploadingImage}
          >
            {saveMutation.isPending || isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isUploadingImage ? t('common.upload') : t('common.processing')}
              </>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      </form>

      {/* Variants Section (only show when editing) */}
      {isEditing && (
        <div className="card mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Variants
            </h2>
            {canModify ? (
              <button
                onClick={() => openVariantModal()}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lock className="w-4 h-4" />
                <span>{t('auth.noPermission')}</span>
              </div>
            )}
          </div>

          {variants.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('products.noProducts')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {t('products.productSku')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Size/Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {t('products.productCost')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {t('common.price')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {t('products.productStock')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {variants.map(variant => (
                    <tr key={variant.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {variant.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {[variant.size, variant.color].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        ${variant.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        ${variant.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            variant.stockQuantity <= variant.lowStockThreshold
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : 'text-gray-900 dark:text-white'
                          }
                        >
                          {variant.stockQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {canModify ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openVariantModal(variant)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteVariant(variant.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              disabled={deleteVariantMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{t('common.select')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editingVariant ? t('common.edit') : t('common.add')}
            </h2>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('products.productSku')} *
                </label>
                <input
                  type="text"
                  value={variantData.sku}
                  onChange={e => setVariantData({ ...variantData, sku: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <input
                    type="text"
                    value={variantData.size}
                    onChange={e => setVariantData({ ...variantData, size: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={variantData.color}
                    onChange={e => setVariantData({ ...variantData, color: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('products.productBarcode')}
                </label>
                <input
                  type="text"
                  value={variantData.barcode}
                  onChange={e => setVariantData({ ...variantData, barcode: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('products.productCost')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantData.costPrice}
                    onChange={e => setVariantData({ ...variantData, costPrice: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.price')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantData.sellingPrice}
                    onChange={e =>
                      setVariantData({ ...variantData, sellingPrice: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.quantity')} *
                  </label>
                  <input
                    type="number"
                    value={variantData.stockQuantity}
                    onChange={e =>
                      setVariantData({ ...variantData, stockQuantity: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('products.productMinStock')}
                  </label>
                  <input
                    type="number"
                    value={variantData.lowStockThreshold}
                    onChange={e =>
                      setVariantData({ ...variantData, lowStockThreshold: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeVariantModal}
                  className="btn btn-secondary flex-1"
                  disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
                >
                  {createVariantMutation.isPending || updateVariantMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.processing')}
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
