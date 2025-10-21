# Vercel Deployment Checklist

## ✅ Pre-Deployment Setup Complete

The following files have been configured for Vercel deployment:

- ✅ `vercel.json` - Vercel configuration with build settings and routing
- ✅ `.vercelignore` - Excludes unnecessary files from deployment
- ✅ `package.json` - Updated with modern Expo web export scripts
- ✅ `dist/` - Build directory created and tested successfully

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your repository
   - Vercel will auto-detect settings from `vercel.json`

3. **Add Environment Variables** (see below)

4. **Click Deploy**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔑 Required Environment Variables

Add these to your Vercel project settings under "Environment Variables":

### Google Maps API Key
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCyPj7XRPG-53Q9C4QFdFXgtgTE7ODidGM
```
**Where to use:** Production, Preview, Development

### Node Environment
```
NODE_ENV=production
```
**Where to use:** Production only

### Optional: API Configuration Override
If you want to use different API endpoints per environment:
```
EXPO_PUBLIC_API_URL=https://api.thundertruck.app
```

## 📋 Build Configuration Summary

The build process is configured in `vercel.json`:

- **Build Command:** `npm run build` (runs `expo export -p web`)
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Dev Command:** `npm run web`

## 🔍 Build Verification

The build has been tested locally and produces:
- ✅ Static HTML entry point (`index.html`)
- ✅ JavaScript bundle (~2.4 MB)
- ✅ 38 assets (images, fonts, icons)
- ✅ Proper directory structure in `dist/`

## ⚙️ Current Configuration Details

### API Endpoints
- **Production:** `https://api.thundertruck.app`
- **GraphQL:** `/graphql`
- **WebSocket:** `wss://api.thundertruck.app/cable`

### Stripe Configuration
- Uses test publishable key in `config/stripe-config.js`
- Consider moving to environment variables for production:
  ```
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
  ```

### Map Configuration
- Default center: Williamsburg, Brooklyn (40.7081, -73.9571)
- Zoom level: 14

## 🎯 Post-Deployment Checklist

After deployment:
- [ ] Verify the app loads at your Vercel URL
- [ ] Test navigation between pages
- [ ] Verify API connectivity
- [ ] Test map functionality
- [ ] Check Stripe payment integration
- [ ] Test on mobile browsers
- [ ] Add custom domain (optional)
- [ ] Set up production Stripe keys
- [ ] Configure analytics (optional)

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Review build logs in Vercel dashboard

### Blank Page After Deploy
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure environment variables are set for the correct environments

### Routing Issues
The `vercel.json` rewrites configuration handles client-side routing. All routes redirect to `/index.html` for SPA behavior.

## 📚 Additional Resources

- Full deployment guide: See `DEPLOYMENT.md`
- Vercel docs: https://vercel.com/docs
- Expo web docs: https://docs.expo.dev/workflow/web/

## 🔄 Continuous Deployment

Once connected to Git:
- Pushes to `main` branch → Production deployment
- Pull requests → Preview deployments
- Other branches → Preview deployments (if configured)

## 📊 Performance Tips

Already configured in `vercel.json`:
- ✅ Asset caching (1 year for static assets)
- ✅ Security headers (X-Frame-Options, XSS Protection, etc.)
- ✅ Optimized build output

## 🎉 Ready to Deploy!

Your app is ready for deployment. Choose one of the deployment options above and follow the steps.

**Current API Configuration:**
- Development/Production API: `https://api.thundertruck.app`
- This is already configured in your code

**Important Notes:**
1. The app currently uses a test Stripe key - update for production
2. Google Maps API key is configured and ready
3. WebSocket connections use `wss://api.thundertruck.app/cable`
4. All assets are properly bundled in the `dist` directory

