# Frontend Deployment Guide - Vercel

This guide will help you deploy your Retail POS System frontend to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Backend already deployed at https://invento-be.vercel.app/

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   cd D:\Invento\retail-pos-system
   git add .
   git commit -m "Prepare frontend for production deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your Git repository
   - Choose the `retail-pos-system` repository

3. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   In the "Environment Variables" section, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://invento-be.vercel.app/api`
   - **Environment**: Production

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Frontend Directory**
   ```bash
   cd D:\Invento\retail-pos-system\frontend
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time) or **Y** (subsequent deploys)
   - Project name? Use default or enter custom name
   - Directory? `./` (current directory)
   - Override settings? **Y**
   - Build command? `npm run build`
   - Output directory? `dist`
   - Development command? `npm run dev`

6. **Add Environment Variable** (if not already set):
   ```bash
   vercel env add VITE_API_URL production
   ```
   Enter value: `https://invento-be.vercel.app/api`

7. **Redeploy** (if you added env var):
   ```bash
   vercel --prod
   ```

## Post-Deployment Steps

### 1. Update Backend CORS Settings

Your backend needs to allow requests from your new frontend domain.

Navigate to your backend code and update CORS configuration:

**File**: `backend/src/index.ts` or `backend/src/app.ts`

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',           // Local development
    'https://your-frontend.vercel.app' // Replace with your actual Vercel URL
  ],
  credentials: true
}));
```

Then redeploy your backend:
```bash
cd D:\Invento\retail-pos-system\backend
git add .
git commit -m "Update CORS for production frontend"
git push origin main
```

### 2. Test Your Production Deployment

1. **Open your Vercel URL** in a browser
2. **Test login** with your credentials
3. **Verify all features**:
   - Dashboard loads correctly
   - Products page shows data
   - Categories work
   - POS functionality works
   - Settings are accessible

### 3. Set Up Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `pos.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update backend CORS to include your custom domain

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors
**Solution**: Run `npm run build` locally first to catch errors
```bash
cd frontend
npm run build
```

### API Requests Fail (CORS Error)

**Issue**: Frontend can't connect to backend
**Solution**:
1. Check backend CORS settings include your Vercel URL
2. Verify `VITE_API_URL` is set correctly in Vercel environment variables
3. Check browser console for specific error messages

### Environment Variables Not Working

**Issue**: App shows localhost API URL in production
**Solution**:
1. Verify environment variable is set in Vercel dashboard
2. Redeploy after adding environment variables
3. Environment variables require a new deployment to take effect

### 404 on Page Refresh

**Issue**: Direct URLs or page refresh shows 404
**Solution**: Vercel should auto-detect this for Vite, but if not, create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Continuous Deployment

Once connected to Git, Vercel will automatically:
- Deploy on every push to main branch
- Create preview deployments for pull requests
- Run builds and tests before deploying

## Monitoring and Analytics

1. **View Deployments**: https://vercel.com/dashboard
2. **Check Logs**: Click on deployment → "Logs" tab
3. **Monitor Performance**: "Analytics" tab shows page load times
4. **View Errors**: "Runtime Logs" for server errors

## Commands Reference

```bash
# Deploy to production
vercel --prod

# Deploy preview (staging)
vercel

# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove a deployment
vercel rm <deployment-url>

# View environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_URL production
```

## Next Steps

1. Share the production URL with your team
2. Set up custom domain (optional)
3. Configure analytics and monitoring
4. Set up staging environment (deploy preview builds)
5. Document any API changes for your team

## Support

- Vercel Documentation: https://vercel.com/docs
- Vite Documentation: https://vitejs.dev/guide/
- Project Issues: Create an issue in your repository

---

**Your Backend**: https://invento-be.vercel.app/api
**Your Frontend**: Will be `https://[your-project-name].vercel.app`
