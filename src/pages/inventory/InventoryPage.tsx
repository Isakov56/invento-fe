import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductsPage from './ProductsPage';
import CategoriesPage from './CategoriesPage';

export default function InventoryPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Set active tab from URL parameter on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'categories') {
      setActiveTab('categories');
    }
  }, [searchParams]);

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('products')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'products'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Package className="w-5 h-5" />
            {t('products.title')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <FolderOpen className="w-5 h-5" />
            {t('categories.title')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'products' ? <ProductsPage /> : <CategoriesPage />}
      </div>
    </div>
  );
}
