import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  QrCode,
  Download,
  Printer,
  Search,
  Loader2,
  Package,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import { productsService } from '../../services/products.service';
import { qrcodeService } from '../../services/qrcode.service';
import { useSettings } from '../../hooks/useSettings';
import type { Product } from '../../types';

export default function QRCodePage() {
  const { t } = useTranslation();
  const { formatPrice } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // Bulk selection
  const [generatedQRCodes, setGeneratedQRCodes] = useState<any[]>([]);
  const [codeType, setCodeType] = useState<'qrcode' | 'barcode'>('qrcode');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [printQuantities, setPrintQuantities] = useState<Record<string, number>>({});
  const [labelFormat, setLabelFormat] = useState<'2x1' | '4x2' | '4x6'>('2x1');
  const [labelInfo, setLabelInfo] = useState({
    productName: true,
    sku: true,
    price: true,
    size: true,
    color: true,
  });

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
  });

  // Generate QR codes for product mutation
  const generateQRMutation = useMutation({
    mutationFn: ({ productId, codeType }: { productId: string; codeType: 'qrcode' | 'barcode' }) =>
      qrcodeService.generateForProduct(productId, codeType),
    onSuccess: (data) => {
      setGeneratedQRCodes(data);
      setErrorMessage('');

      // Initialize print quantities for each variant
      const quantities: Record<string, number> = {};
      data.forEach(code => {
        quantities[code.variantId] = 1;
      });
      setPrintQuantities(quantities);
    },
    onError: (error: any) => {
      setGeneratedQRCodes([]);
      setErrorMessage(error?.response?.data?.message || error.message || 'Failed to generate codes');
    },
  });

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle product selection for bulk mode
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products
  const selectAllProducts = () => {
    const productsWithVariants = filteredProducts.filter(p => p.variants && p.variants.length > 0);
    setSelectedProducts(productsWithVariants.map(p => p.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedProducts([]);
  };

  // Generate codes for bulk selection
  const handleBulkGenerate = async () => {
    setGeneratedQRCodes([]);
    setErrorMessage('');

    const allCodes: any[] = [];

    for (const productId of selectedProducts) {
      try {
        const codes = await qrcodeService.generateForProduct(productId, codeType);
        allCodes.push(...codes);
      } catch (error) {
        console.error(`Failed to generate codes for product ${productId}:`, error);
      }
    }

    setGeneratedQRCodes(allCodes);

    // Initialize print quantities
    const quantities: Record<string, number> = {};
    allCodes.forEach(code => {
      quantities[code.variantId] = 1;
    });
    setPrintQuantities(quantities);
  };

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setGeneratedQRCodes([]); // Clear old codes immediately
    setErrorMessage(''); // Clear old errors

    // Check if product has variants
    if (!product.variants || product.variants.length === 0) {
      setErrorMessage(t('qrcode.noVariants'));
      return;
    }

    generateQRMutation.mutate({ productId: product.id, codeType });
  };

  // Regenerate codes when code type changes
  const handleCodeTypeChange = (newCodeType: 'qrcode' | 'barcode') => {
    setCodeType(newCodeType);
    setGeneratedQRCodes([]); // Clear old codes
    setErrorMessage(''); // Clear old errors

    if (selectedProduct) {
      // Check if product has variants
      if (!selectedProduct.variants || selectedProduct.variants.length === 0) {
        setErrorMessage(t('qrcode.noVariants'));
        return;
      }

      generateQRMutation.mutate({ productId: selectedProduct.id, codeType: newCodeType });
    }
  };

  // Download code
  const downloadQRCode = (qrCodeDataURL: string, sku: string) => {
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `${codeType === 'barcode' ? 'Barcode' : 'QR'}_${sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print individual code with quantity
  const printQRCode = (qr: any) => {
    const quantity = printQuantities[qr.variantId] || 1;
    const dims = getLabelDimensions();
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      const labelsHTML = generateLabelHTML(qr, quantity);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ${codeType === 'barcode' ? 'Barcode' : 'QR Code'} - ${qr.sku}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: Arial, sans-serif;
                padding: 0.25in;
              }

              .label {
                width: ${dims.width};
                height: ${dims.height};
                border: 1px dashed #ccc;
                display: inline-flex;
                flex-direction: ${labelFormat === '4x6' ? 'column' : 'row'};
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
                padding: 0.1in;
                margin: 0.05in;
                overflow: hidden;
              }

              .code-image {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .code-image img {
                max-width: ${dims.imageSize};
                max-height: ${dims.imageSize};
                width: auto;
                height: auto;
              }

              .label-info {
                flex: 1;
                padding: 0 0.1in;
                font-size: ${dims.fontSize};
                overflow: hidden;
                text-align: ${labelFormat === '4x6' ? 'center' : 'left'};
              }

              .product-name {
                font-weight: bold;
                margin-bottom: 0.05in;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .sku, .size, .color {
                font-size: calc(${dims.fontSize} - 1pt);
                color: #333;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .price {
                font-weight: bold;
                font-size: calc(${dims.fontSize} + 1pt);
                margin-top: 0.05in;
                color: #059669;
              }

              @media print {
                body {
                  padding: 0;
                }

                .label {
                  border: none;
                  margin: 0;
                }

                @page {
                  margin: 0.25in;
                  size: letter;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Get label dimensions based on format
  const getLabelDimensions = () => {
    switch (labelFormat) {
      case '2x1':
        return { width: '2in', height: '1in', imageSize: '0.7in', fontSize: '7pt' };
      case '4x2':
        return { width: '4in', height: '2in', imageSize: '1.5in', fontSize: '10pt' };
      case '4x6':
        return { width: '4in', height: '6in', imageSize: '3in', fontSize: '12pt' };
      default:
        return { width: '2in', height: '1in', imageSize: '0.7in', fontSize: '7pt' };
    }
  };

  // Generate label HTML
  const generateLabelHTML = (qr: any, quantity: number) => {
    // const dims = getLabelDimensions();
    const labels = [];

    for (let i = 0; i < quantity; i++) {
      labels.push(`
        <div class="label">
          <div class="code-image">
            <img src="${qr.qrCodeDataURL}" alt="${codeType === 'barcode' ? 'Barcode' : 'QR Code'}" />
          </div>
          <div class="label-info">
            ${labelInfo.productName ? `<div class="product-name">${qr.productName}</div>` : ''}
            ${labelInfo.sku ? `<div class="sku">${t('products.productSku')}: ${qr.sku}</div>` : ''}
            ${labelInfo.size && qr.size ? `<div class="size">${t('common.size')}: ${qr.size}</div>` : ''}
            ${labelInfo.color && qr.color ? `<div class="color">${t('common.color')}: ${qr.color}</div>` : ''}
            ${labelInfo.price && qr.price ? `<div class="price">${formatPrice(qr.price)}</div>` : ''}
          </div>
        </div>
      `);
    }

    return labels.join('');
  };

  // Print all codes with quantities
  const printAllQRCodes = () => {
    if (generatedQRCodes.length === 0) return;

    const dims = getLabelDimensions();
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      const labelsHTML = generatedQRCodes
        .map(qr => generateLabelHTML(qr, printQuantities[qr.variantId] || 1))
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ${codeType === 'barcode' ? 'Barcodes' : 'QR Codes'} - Labels</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: Arial, sans-serif;
                padding: 0.25in;
              }

              .label {
                width: ${dims.width};
                height: ${dims.height};
                border: 1px dashed #ccc;
                display: inline-flex;
                flex-direction: ${labelFormat === '4x6' ? 'column' : 'row'};
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
                padding: 0.1in;
                margin: 0.05in;
                overflow: hidden;
              }

              .code-image {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .code-image img {
                max-width: ${dims.imageSize};
                max-height: ${dims.imageSize};
                width: auto;
                height: auto;
              }

              .label-info {
                flex: 1;
                padding: 0 0.1in;
                font-size: ${dims.fontSize};
                overflow: hidden;
                text-align: ${labelFormat === '4x6' ? 'center' : 'left'};
              }

              .product-name {
                font-weight: bold;
                margin-bottom: 0.05in;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .sku, .size, .color {
                font-size: calc(${dims.fontSize} - 1pt);
                color: #333;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .price {
                font-weight: bold;
                font-size: calc(${dims.fontSize} + 1pt);
                margin-top: 0.05in;
                color: #059669;
              }

              @media print {
                body {
                  padding: 0;
                }

                .label {
                  border: none;
                  margin: 0;
                }

                @page {
                  margin: 0.25in;
                  size: letter;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('qrcode.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('qrcode.subtitle')}
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="mb-6 space-y-4">
        {/* Code Type Selector */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('qrcode.codeType')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCodeTypeChange('qrcode')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  codeType === 'qrcode'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <QrCode className="w-5 h-5" />
                {t('qrcode.generateQR')}
              </button>
              <button
                onClick={() => handleCodeTypeChange('barcode')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  codeType === 'barcode'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Barcode className="w-5 h-5" />
                {t('qrcode.generateBarcode')}
              </button>
            </div>
          </div>
        </div>

        {/* Label Settings */}
        <div className="card">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('qrcode.labelSettings')}
            </h3>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <AlertCircle className="w-3 h-3" />
              <span>{t('qrcode.previewUpdates')}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label Format */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('qrcode.labelSize')}
              </label>
              <select
                value={labelFormat}
                onChange={(e) => setLabelFormat(e.target.value as any)}
                className="input"
              >
                <option value="2x1">{t('qrcode.labelSizeSmall')}</option>
                <option value="4x2">{t('qrcode.labelSizeMedium')}</option>
                <option value="4x6">{t('qrcode.labelSizeLarge')}</option>
              </select>
            </div>

            {/* Label Information */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('qrcode.labelInfo')}
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={labelInfo.productName}
                    onChange={(e) => setLabelInfo({ ...labelInfo, productName: e.target.checked })}
                    className="mr-1"
                  />
                  {t('common.name')}
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={labelInfo.sku}
                    onChange={(e) => setLabelInfo({ ...labelInfo, sku: e.target.checked })}
                    className="mr-1"
                  />
                  {t('products.productSku')}
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={labelInfo.price}
                    onChange={(e) => setLabelInfo({ ...labelInfo, price: e.target.checked })}
                    className="mr-1"
                  />
                  {t('common.price')}
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={labelInfo.size}
                    onChange={(e) => setLabelInfo({ ...labelInfo, size: e.target.checked })}
                    className="mr-1"
                  />
                  {t('common.size')}
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={labelInfo.color}
                    onChange={(e) => setLabelInfo({ ...labelInfo, color: e.target.checked })}
                    className="mr-1"
                  />
                  {t('common.color')}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('products.title')}
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('products.searchProducts')}
                className="input pl-10"
              />
            </div>

            {/* Mode Selection */}
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('qrcode.selectionMode')}
                </span>
                {selectedProducts.length > 0 && (
                  <span className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                    {selectedProducts.length} {t('qrcode.productsSelected')}
                  </span>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>{t('qrcode.selectionModeTip')}</strong><br/>
                  • {t('qrcode.selectionModeSingle')}<br/>
                  • {t('qrcode.selectionModeBulk')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={selectAllProducts}
                  className="btn btn-secondary text-xs py-2 px-2"
                  disabled={filteredProducts.filter(p => p.variants && p.variants.length > 0).length === 0}
                >
                  {t('qrcode.selectAll')}
                </button>
                <button
                  onClick={clearAllSelections}
                  className="btn btn-secondary text-xs py-2 px-2"
                  disabled={selectedProducts.length === 0}
                >
                  {t('common.clear')} ({selectedProducts.length})
                </button>
                <button
                  onClick={handleBulkGenerate}
                  className="btn btn-primary text-xs py-2 px-2 col-span-2"
                  disabled={selectedProducts.length === 0}
                >
                  {t('qrcode.generateSelected')}
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{t('products.noProducts')}</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const hasVariants = product.variants && product.variants.length > 0;
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : hasVariants
                          ? 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                          : 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox for bulk selection */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product.id)}
                          disabled={!hasVariants}
                          className="mt-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Product Info - Clickable */}
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </h3>
                              <p className={`text-sm ${
                                hasVariants
                                  ? 'text-gray-600 dark:text-gray-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {product.variants?.length || 0} variant(s)
                              </p>
                            </div>
                            {!hasVariants && (
                              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* QR Codes Display */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('qrcode.generated')} {codeType === 'barcode' ? t('qrcode.barcodes') : t('qrcode.qrcodes')}
                </h2>
                {generatedQRCodes.length > 0 && (
                  <button
                    onClick={printAllQRCodes}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    {t('qrcode.printAll')} ({Object.values(printQuantities).reduce((sum, qty) => sum + qty, 0)} {t('qrcode.labels')})
                  </button>
                )}
              </div>
              {generatedQRCodes.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {generatedQRCodes.length} label{generatedQRCodes.length !== 1 ? 's' : ''} from {
                    new Set(generatedQRCodes.map(qr => qr.productName)).size
                  } product{new Set(generatedQRCodes.map(qr => qr.productName)).size !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {generateQRMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t('qrcode.generating')} {codeType === 'barcode' ? t('qrcode.barcodes') : t('qrcode.qrcodes')}...
                </p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-12">
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 dark:text-red-400 font-medium mb-2">
                    {t('qrcode.unableGenerate')}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
                {selectedProduct && (!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                  <button
                    onClick={() => window.location.href = `/inventory/products/${selectedProduct.id}/edit`}
                    className="btn btn-primary"
                  >
                    {t('qrcode.addVariants')}
                  </button>
                )}
              </div>
            ) : generatedQRCodes.length === 0 ? (
              <div className="text-center py-12">
                {codeType === 'barcode' ? (
                  <Barcode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                ) : (
                  <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                )}
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {t('qrcode.noGenerated')} {codeType === 'barcode' ? t('qrcode.barcodes') : t('qrcode.qrcodes')}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('qrcode.selectProduct')} {codeType === 'barcode' ? t('qrcode.barcodes') : t('qrcode.qrcodes')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generatedQRCodes.map((qr) => (
                  <div
                    key={qr.variantId}
                    className="card"
                  >
                    {/* Product Header - Compact */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {qr.productName}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {qr.sku} {qr.size && `• ${qr.size}`} {qr.color && `• ${qr.color}`}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {labelFormat.replace('x', '" × "')}
                      </span>
                    </div>

                    {/* Large Label Preview - Main Focus */}
                    <div className="mb-6">
                      {/* Label Preview Container - Unified Label */}
                      <div
                        className={`bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex ${
                          labelFormat === '4x6' ? 'flex-col' : 'flex-row'
                        } items-center justify-center p-6 mx-auto shadow-lg`}
                        style={{
                          maxWidth: '100%',
                          width: labelFormat === '2x1' ? '100%' : labelFormat === '4x2' ? '100%' : '60%',
                          minHeight: labelFormat === '2x1' ? '180px' : labelFormat === '4x2' ? '240px' : '400px',
                        }}
                      >
                        {/* Code Image - No separate background */}
                        <div className="flex-shrink-0">
                          <img
                            src={qr.qrCodeDataURL}
                            alt="Label Preview"
                            className="object-contain"
                            style={{
                              width: labelFormat === '2x1' ? '140px' : labelFormat === '4x2' ? '180px' : '200px',
                              height: labelFormat === '2x1' ? '140px' : labelFormat === '4x2' ? '180px' : '200px',
                            }}
                          />
                        </div>

                        {/* Label Info - Together with code */}
                        <div
                          className={`flex-1 ${
                            labelFormat === '4x6' ? 'text-center mt-4' : 'ml-6'
                          } overflow-hidden min-w-0`}
                          style={{
                            fontSize: labelFormat === '2x1' ? '11px' : labelFormat === '4x2' ? '14px' : '16px',
                            lineHeight: '1.4',
                          }}
                        >
                          {labelInfo.productName && (
                            <div className="font-bold text-gray-900 dark:text-white truncate mb-2">
                              {qr.productName}
                            </div>
                          )}
                          {labelInfo.sku && (
                            <div className="text-gray-600 dark:text-gray-400 truncate mb-1">
                              {t('products.productSku')}: {qr.sku}
                            </div>
                          )}
                          {labelInfo.size && qr.size && (
                            <div className="text-gray-600 dark:text-gray-400 truncate mb-1">
                              {t('common.size')}: {qr.size}
                            </div>
                          )}
                          {labelInfo.color && qr.color && (
                            <div className="text-gray-600 dark:text-gray-400 truncate mb-1">
                              {t('common.color')}: {qr.color}
                            </div>
                          )}
                          {labelInfo.price && qr.price && (
                            <div className="font-bold text-green-600 dark:text-green-400 truncate mt-2 text-lg">
                              {formatPrice(qr.price)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Print Quantity & Actions */}
                    <div className="space-y-3">
                      {/* Print Quantity */}
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('qrcode.printQuantity')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={printQuantities[qr.variantId] || 1}
                          onChange={(e) =>
                            setPrintQuantities({
                              ...printQuantities,
                              [qr.variantId]: parseInt(e.target.value) || 1,
                            })
                          }
                          className="input text-center w-full"
                        />
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => downloadQRCode(qr.qrCodeDataURL, qr.sku)}
                          className="btn btn-secondary text-sm flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {t('common.download')}
                        </button>
                        <button
                          onClick={() => printQRCode(qr)}
                          className="btn btn-primary text-sm flex items-center justify-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          {t('common.print')} ({printQuantities[qr.variantId] || 1})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
