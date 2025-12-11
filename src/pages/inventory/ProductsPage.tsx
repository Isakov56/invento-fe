import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Package, Edit, Eye, Download, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { uploadService } from '../../services/upload.service';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import type { Product, ProductVariant } from '../../types';

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Export products to CSV
  const exportToCSV = () => {
    if (products.length === 0) {
      alert(t('common.download'));
      return;
    }

    // Prepare CSV data
    const headers = [
      t('products.productName'),
      t('common.category'),
      'Brand',
      t('common.active'),
      'Variants',
      t('common.quantity'),
      t('common.price'),
    ];

    const rows = products.map((product) => [
      product.name,
      product.category?.name || '',
      product.brand || '',
      product.isActive ? 'Yes' : 'No',
      product.variants?.length || 0,
      getTotalStock(product),
      getMinPrice(product).toFixed(2),
    ]);

    const csvContent =
      [headers.join(',')]
        .concat(rows.map((row) => row.map((cell) => `"${cell}"`).join(',')))
        .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${t('products.title')}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fetch products
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, showActiveOnly],
    queryFn: () =>
      productsService.getAll({
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        isActive: showActiveOnly ? true : undefined,
      }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change infrequently
  });

  const getTotalStock = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((sum: number, v: ProductVariant) => sum + v.stockQuantity, 0);
  };

  const getMinPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v: ProductVariant) => v.sellingPrice));
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('products.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('products.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('products.exportCSV')}
          </button>
          <button
            onClick={() => navigate('/inventory/products/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('products.addProduct')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('products.searchProducts')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-9 sm:pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="input pl-9 sm:pl-10"
            >
              <option value="">{t('products.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={e => setShowActiveOnly(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('products.showActiveOnly')}
              </span>
            </label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-2 sm:p-4">
              {/* Product Image Skeleton */}
              <SkeletonLoader className="mb-2 sm:mb-3 aspect-square rounded-lg" />

              {/* Product Info Skeleton */}
              <SkeletonLoader className="h-4 mb-2 rounded" />
              <SkeletonLoader className="h-3 w-2/3 mb-3 rounded" />

              {/* Action Buttons Skeleton */}
              <div className="flex gap-1 sm:gap-2">
                <SkeletonLoader className="flex-1 h-9 rounded" />
                <SkeletonLoader className="flex-1 h-9 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{t('common.error')}</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('errors.networkError')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            {t('common.back')}
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory
              ? t('products.noProducts')
              : t('products.noProducts')}
          </p>
          <button
            onClick={() => navigate('/inventory/products/new')}
            className="btn btn-primary"
          >
            {t('products.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {products.map(product => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow p-2 sm:p-4">
              {/* Product Image */}
              <div className="mb-2 sm:mb-4 aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={uploadService.getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-lg font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
                  {product.category?.name}
                </p>
                {product.description && (
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('products.productStock')}</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center">
                    {getTotalStock(product)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Variants</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center">
                    {product.variants?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Price</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center">
                    ${getMinPrice(product).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-0">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="btn btn-secondary flex-1 flex items-center justify-center p-2 sm:p-4"
                  title={t('common.view')}
                >
                  <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                </button>
                <button
                  onClick={() => navigate(`/inventory/products/${product.id}/edit`)}
                  className="btn btn-primary flex-1 flex items-center justify-center p-2 sm:p-4"
                  title={t('common.edit')}
                >
                  <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                </button>
              </div>

              {/* Status Badge */}
              {!product.isActive && (
                <div className="mt-2 sm:mt-3 px-2 py-0.5 sm:py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded text-center">
                  {t('common.inactive')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Image */}
              {selectedProduct.imageUrl && (
                <div className="aspect-square max-h-96 mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={uploadService.getImageUrl(selectedProduct.imageUrl)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.category')}</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedProduct.category?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Brand</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedProduct.brand || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.status')}</p>
                  <p className={`text-base sm:text-lg font-semibold ${selectedProduct.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selectedProduct.isActive ? t('common.active') : t('common.inactive')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variants</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedProduct.variants?.length || 0}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.description')}</p>
                  <p className="text-gray-900 dark:text-gray-200">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Variants Section */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variants</h3>
                  <div className="space-y-3">
                    {selectedProduct.variants.map(variant => (
                      <div key={variant.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">SKU</p>
                            <p className="font-medium text-gray-900 dark:text-white">{variant.sku}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Stock</p>
                            <p className="font-medium text-gray-900 dark:text-white">{variant.stockQuantity}</p>
                          </div>
                          {variant.size && (
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Size</p>
                              <p className="font-medium text-gray-900 dark:text-white">{variant.size}</p>
                            </div>
                          )}
                          {variant.color && (
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Color</p>
                              <p className="font-medium text-gray-900 dark:text-white">{variant.color}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Cost Price</p>
                            <p className="font-medium text-gray-900 dark:text-white">${(variant.costPrice || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Selling Price</p>
                            <p className="font-medium text-gray-900 dark:text-white">${(variant.sellingPrice || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    navigate(`/inventory/products/${selectedProduct.id}/edit`);
                    setSelectedProduct(null);
                  }}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t('common.edit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
