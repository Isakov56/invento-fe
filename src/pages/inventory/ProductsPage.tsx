import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Loader2, Package, Edit, Eye, Download, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { uploadService } from '../../services/upload.service';

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

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
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    retry: 1,
  });

  const getTotalStock = (product: any) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((sum: number, v: any) => sum + v.stockQuantity, 0);
  };

  const getMinPrice = (product: any) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v: any) => v.sellingPrice));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('products.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('products.subtitle')}</p>
        </div>
        <div className="flex gap-3">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('products.searchProducts')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="input pl-10"
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
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="mb-4 aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {product.category?.name}
                </p>
                {product.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('products.productStock')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getTotalStock(product)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Variants</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.variants?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Price from</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${getMinPrice(product).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/inventory/products/${product.id}`)}
                  className="btn btn-secondary flex-1 flex items-center justify-center"
                  title={t('common.select')}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/inventory/products/${product.id}/edit`)}
                  className="btn btn-primary flex-1 flex items-center justify-center"
                  title={t('common.edit')}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge */}
              {!product.isActive && (
                <div className="mt-3 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded text-center">
                  {t('common.inactive')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
