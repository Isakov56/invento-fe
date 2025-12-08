# Retail POS System - Frontend

Frontend application for the Retail Point of Sale and Inventory Management System.

## Tech Stack

- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS
- React Router v6
- Zustand (State management)
- TanStack Query (Server state)
- Axios (HTTP client)
- Lucide React (Icons)
- React Hook Form + Zod (Forms & validation)
- html5-qrcode (QR/Barcode scanning)
- react-qr-code (QR code generation)
- Recharts (Data visualization)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the API URL if needed (default is `http://localhost:5000/api`).

### 3. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

### Authentication
- Login/Register with JWT
- Protected routes
- Role-based access control
- Automatic token refresh

### Dashboard
- Real-time statistics
- Sales overview
- Inventory status
- Quick actions

### Inventory Management
- Product CRUD operations
- Product variants (size, color)
- SKU tracking
- Stock level monitoring
- Low stock alerts
- Bulk import/export

### QR Code & Barcode System
- Generate QR codes for products
- Print QR code labels
- Scan QR codes/barcodes
- Camera and USB scanner support

### Point of Sale (POS)
- Fast product search
- Shopping cart
- Multiple payment methods
- Receipt generation
- Return/refund processing

### Reports & Analytics
- Sales reports
- Inventory reports
- Best-selling products
- Revenue analytics
- Export to PDF/Excel

### Additional Features
- Dark/Light mode
- Responsive design (mobile, tablet, desktop)
- Real-time notifications
- Multi-store support

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── auth/        # Authentication components
│   │   ├── common/      # Shared components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── inventory/   # Inventory components
│   │   ├── layout/      # Layout components
│   │   ├── pos/         # POS components
│   │   └── reports/     # Report components
│   ├── pages/           # Page components
│   │   ├── auth/        # Auth pages
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── inventory/   # Inventory pages
│   │   ├── pos/         # POS pages
│   │   └── reports/     # Report pages
│   ├── services/        # API services
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   ├── hooks/           # Custom React hooks
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── package.json
```

## User Roles

- **OWNER** - Full access to all features
- **MANAGER** - Access to inventory, sales, and reports
- **CASHIER** - Access to POS and basic inventory viewing

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/MainLayout.tsx`

### State Management

The app uses Zustand for global state management:
- `authStore` - Authentication state
- `themeStore` - Theme (dark/light) state

### API Integration

API calls are made using Axios with interceptors:
- Automatic token injection
- Error handling
- Response transformation

## Styling

The app uses Tailwind CSS with custom utility classes:

- `.btn` - Base button styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Danger button
- `.input` - Input field styles
- `.card` - Card container styles

## Theme

The app supports both light and dark modes. The theme is persisted in localStorage and applied automatically.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port already in use

If port 5173 is already in use, you can change it in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000, // Change to any available port
  },
});
```

### API connection issues

Make sure the backend server is running on `http://localhost:5000` or update the `VITE_API_URL` in your `.env` file.
