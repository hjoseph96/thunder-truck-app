# ThunderTruck Web Deployment Guide

This guide will help you deploy the ThunderTruck web version to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have an account
2. **Vercel CLI** (optional): Install globally with `npm install -g vercel`
3. **Git Repository**: Your code should be pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended for First Deployment)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your Git provider and authorize Vercel
   - Select the `thunder-truck-app` repository

3. **Configure the Project**
   - **Framework Preset**: Select "Other" (we're using custom Expo configuration)
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: `npm run build` (auto-detected from vercel.json)
   - **Output Directory**: `dist` (auto-detected from vercel.json)
   - **Install Command**: `npm install` (auto-detected from vercel.json)

4. **Environment Variables** (if needed)
   Add any environment variables your app needs:
   - API endpoints
   - Stripe publishable keys
   - Google Maps API keys
   - Any other configuration

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (typically 2-5 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   vercel
   ```
   Follow the prompts to link your project.

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Local Testing Before Deployment

Before deploying, test the production build locally:

```bash
# Build the web version
npm run build

# Serve the built files locally
npm run serve:web
```

Visit `http://localhost:3000` to test your production build.

## Configuration Files

### vercel.json
The `vercel.json` file configures:
- Build command and output directory
- URL rewrites for client-side routing
- Cache headers for optimal performance
- Security headers

### .vercelignore
Excludes unnecessary files from deployment:
- Native build directories (android/, ios/)
- Node modules
- Development files
- Documentation

## Post-Deployment

### Custom Domain Setup
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Environment Variables
To add or update environment variables:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add/update variables
4. Redeploy for changes to take effect

### Automatic Deployments
Once connected to Git:
- **Production**: Automatically deploys from your main/master branch
- **Preview**: Automatically creates preview deployments for pull requests
- **Rollback**: Easy rollback to previous deployments via the dashboard

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json` (not just devDependencies)
- Test the build locally first: `npm run build`

### App Shows Blank Page
- Check browser console for errors
- Verify API endpoints are correct for production
- Check that environment variables are set correctly

### Routing Issues
- The `vercel.json` rewrites configuration handles client-side routing
- All routes should redirect to `/index.html`

### Performance Issues
- Enable caching (already configured in `vercel.json`)
- Use Vercel Analytics to identify bottlenecks
- Consider enabling Edge Functions for better global performance

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [React Native Web](https://necolas.github.io/react-native-web/)

## Support

If you encounter issues:
1. Check the Vercel deployment logs
2. Test the build locally
3. Review the Expo web documentation
4. Check the browser console for errors

## Continuous Deployment

Once set up, every push to your main branch will:
1. Trigger a new build on Vercel
2. Run the build command
3. Deploy the new version
4. Keep previous deployments for easy rollback

Preview deployments are created for:
- Pull requests
- Other branches (if configured)

This allows you to test changes before merging to production.

