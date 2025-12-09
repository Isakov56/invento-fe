import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Check,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Store as StoreIcon,
} from 'lucide-react';
import { variantsService } from '../../services/variants.service';
import { transactionsService } from '../../services/transactions.service';
import { storesService } from '../../services/stores.service';
import { useAuthStore } from '../../store/authStore';
import { useSettings } from '../../hooks/useSettings';
import { usePOSSearchStore } from '../../store/posSearchStore';
import { usePOSVariantsCache } from '../../hooks/usePOSVariantsCache';
import { calculateTotalScore } from '../../utils/search';
import { PaymentMethod } from '../../types';
import type { ProductVariant, CartItem } from '../../types';

export default function POSPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { formatPrice, calculateTax, taxRate, receiptHeader, receiptFooter } = useSettings();

  // Zustand store for POS search
  const { searchQuery, searchResults, allVariants, setSearchQuery, setSearchResults } = usePOSSearchStore();

  // Load and cache all variants for fuzzy search
  usePOSVariantsCache();

  // Local state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountPaid, setAmountPaid] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(user?.storeId || '');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: storesService.getAll,
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const change = parseFloat(amountPaid || '0') - total;

  // Client-side fuzzy search with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    // Debounce search - wait 300ms before searching
    const timeout = setTimeout(async () => {
      try {
        // Try exact match by SKU first
        if (query.length >= 2) {
          try {
            const variant = await variantsService.getBySku(query);
            setSearchResults([variant]);
            return;
          } catch {
            // Continue to next search method
          }

          // Try exact barcode match
          try {
            const variant = await variantsService.getByBarcode(query);
            setSearchResults([variant]);
            return;
          } catch {
            // Continue to fuzzy search
          }
        }

        // Fall back to client-side fuzzy search from all variants
        const results = (allVariants || [])
          .map((variant) => ({
            variant,
            score: calculateTotalScore(
              query,
              variant.sku,
              variant.barcode,
              variant.product?.name || ''
            ),
          }))
          .filter((result) => result.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((result) => result.variant);

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  // Add item to cart
  const addToCart = (variant: ProductVariant) => {
    const existingItem = cart.find((item) => item.variantId === variant.id);

    if (existingItem) {
      // Increase quantity
      setCart(
        cart.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        variantId: variant.id,
        variant,
        quantity: 1,
        unitPrice: variant.sellingPrice,
        discount: 0,
        subtotal: variant.sellingPrice,
      };
      setCart([...cart, newItem]);
    }

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update item quantity
  const updateQuantity = (variantId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.variantId === variantId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.unitPrice - item.discount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove item from cart
  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((item) => item.variantId !== variantId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Print receipt
  const printReceipt = (transaction: any, cartItems: CartItem[], storeId: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const store = stores.find((s) => s.id === storeId);
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transaction.transactionNo}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 300px;
              margin: 20px auto;
              padding: 0;
            }
            .receipt {
              border: 1px solid #000;
              padding: 10px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-info {
              font-size: 11px;
              margin: 2px 0;
            }
            .items {
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
            }
            .item-name {
              flex: 1;
            }
            .item-qty {
              width: 40px;
              text-align: center;
            }
            .item-price {
              width: 60px;
              text-align: right;
            }
            .totals {
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
            }
            .total-line.grand {
              font-size: 14px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              margin-top: 10px;
            }
            @media print {
              body {
                margin: 0;
              }
              .receipt {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptHeader ? `<div class="header"><p>${receiptHeader}</p></div>` : ''}
            <div class="header">
              <div class="store-name">${store?.name || 'Retail POS'}</div>
              <div class="store-info">${store?.address || ''}</div>
              <div class="store-info">${store?.city || ''}, ${store?.state || ''} ${store?.zipCode || ''}</div>
              <div class="store-info">${store?.phone || ''}</div>
              <div class="store-info">Transaction: ${transaction.transactionNo}</div>
              <div class="store-info">${new Date(transaction.createdAt || new Date()).toLocaleString()}</div>
            </div>

            <div class="items">
              ${cartItems
                .map(
                  (item) => `
                <div class="item">
                  <div class="item-name">${item.variant.product?.name}</div>
                  <div class="item-qty">x${item.quantity}</div>
                  <div class="item-price">${formatPrice(item.subtotal)}</div>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="totals">
              <div class="total-line">
                <span>${t('common.subtotal')}:</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div class="total-line">
                <span>${t('common.tax')} (${taxRate}%):</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div class="total-line grand">
                <span>${t('pos.totalAmount')}:</span>
                <span>${formatPrice(total)}</span>
              </div>
              <div class="total-line">
                <span>${transaction.paymentMethod}:</span>
                <span>${formatPrice(transaction.amountPaid || total)}</span>
              </div>
              ${
                transaction.paymentMethod === 'CASH' && change > 0
                  ? `<div class="total-line">
                <span>${t('pos.change')}:</span>
                <span>${formatPrice(change)}</span>
              </div>`
                  : ''
              }
            </div>

            <div class="footer">
              ${receiptFooter ? `<p>${receiptFooter}</p>` : ''}
              <p>${t('pos.thankYou')}</p>
              <p>${t('pos.comeAgain')}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: transactionsService.create,
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['today-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });

      // Print receipt
      printReceipt(transaction, cart, selectedStoreId);

      // Reset
      clearCart();
      setShowPaymentModal(false);
      setAmountPaid('');
      alert(t('pos.saleCompleted'));
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to complete sale');
    },
  });

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(t('pos.cartEmpty'));
      return;
    }

    if (!selectedStoreId) {
      alert(t('pos.selectStoreFirst'));
      return;
    }

    setShowPaymentModal(true);
  };

  // Complete sale
  const completeSale = () => {
    if (paymentMethod === 'CASH' && parseFloat(amountPaid) < total) {
      alert(t('pos.insufficientAmount'));
      return;
    }

    const transactionData = {
      storeId: selectedStoreId,
      cashierId: user!.id,
      items: cart.map((item) => ({
        productVariantId: item.variantId,
        quantity: item.quantity,
        discount: item.discount,
      })),
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? parseFloat(amountPaid) : total,
      tax,
      discount: 0,
    };

    createTransactionMutation.mutate(transactionData);
  };

  // Quick amount buttons for cash payment
  const quickAmounts = [10, 20, 50, 100, 200];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Products Search */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{t('pos.title')}</h1>

          {/* Store Selector */}
          {!user?.storeId && stores.length > 0 && (
            <div className="flex items-center gap-3">
              <StoreIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="input w-full lg:w-64"
                required
              >
                <option value="">{t('pos.selectStore')}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('pos.scanBarcode')}
              className="input pl-10 text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results / Suggestions */}
        {searchResults.length > 0 && (
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {searchResults.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  addToCart(variant);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full card hover:shadow-md transition-shadow text-left group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {variant.product?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      SKU: <span className="font-medium">{variant.sku}</span>
                      {variant.size && ` • Size: ${variant.size}`}
                      {variant.color && ` • Color: ${variant.color}`}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        Stock: {variant.stockQuantity}
                      </span>
                      {variant.stockQuantity <= 0 && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-red-700 dark:text-red-400">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {formatPrice(variant.sellingPrice)}
                    </p>
                    <Plus className="w-5 h-5 text-gray-400 ml-auto mt-2 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Items or Categories could go here */}
        {searchQuery === '' && searchResults.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('pos.scanToBegin')}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-[400px] bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('pos.cart')}</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                {t('pos.clearAll')}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('pos.items_count', { count: cart.length })}
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('pos.cartEmpty')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variantId}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.variant.product?.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.variant.size && `${item.variant.size} • `}
                      {item.variant.sku}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.variantId, -1)}
                      className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, 1)}
                      className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPrice(item.unitPrice)} {t('pos.each')}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6 space-y-3">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>{t('common.subtotal')}</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>{t('common.tax')} ({taxRate}%)</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
            <span>{t('pos.totalAmount')}</span>
            <span>{formatPrice(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pos.checkout')}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pos.payment')}</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Total */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('pos.totalAmount')}</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(total)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('pos.paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === PaymentMethod.CASH
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('pos.cash')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === PaymentMethod.CARD
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('pos.card')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.MOBILE_PAYMENT)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === PaymentMethod.MOBILE_PAYMENT
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('pos.mobile')}</span>
                </button>
              </div>
            </div>

            {/* Cash Payment Input */}
            {paymentMethod === 'CASH' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('pos.amountReceived')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="input text-2xl text-center font-bold"
                  placeholder="0.00"
                  autoFocus
                />
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountPaid(amount.toString())}
                      className="btn btn-secondary py-2 text-sm"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                {/* Change */}
                {amountPaid && change >= 0 && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pos.change')}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(change)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Complete Button */}
            <button
              onClick={completeSale}
              disabled={
                createTransactionMutation.isPending ||
                (paymentMethod === 'CASH' && parseFloat(amountPaid || '0') < total)
              }
              className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTransactionMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {t('pos.completeSale')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
