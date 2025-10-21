# ThunderTruck SEO Implementation Guide

## Overview

This document details the comprehensive SEO optimization implemented for ThunderTruck's web version, following modern 2025 best practices with special focus on Large Language Model (LLM) discoverability.

## Domain Configuration

**Primary Web Domain:** `https://web.thundertruck.app`

## Implemented Features

### 1. Custom HTML Template (`web/index.html`)

Created a fully optimized HTML template with comprehensive meta tags and structured data that Expo will use during the web build process.

#### Primary Meta Tags
- **Title:** "ThunderTruck: Order Street Food Ahead and Track Real-Time Delivery"
- **Description:** "Street food, minus the lines: locate trucks, order ahead, and watch your delivery in real time. ThunderTruck brings your favorites to you."
- **Keywords:** Comprehensive list including food truck, street food, delivery tracking, etc.
- **Theme Color:** #fb9d13 (ThunderTruck brand orange)

#### Open Graph Tags (Facebook/LinkedIn)
Complete Open Graph implementation for optimal social media sharing:
- og:title, og:description, og:image
- og:url, og:type, og:site_name
- og:locale for internationalization support

#### Twitter Card Tags
Enhanced Twitter card implementation for rich preview cards:
- summary_large_image card type
- Dedicated image, title, description
- Creator and site attribution

#### Geographic Meta Tags
Location-specific metadata for local SEO:
- geo.region: US-NY
- geo.placename: New York
- geo.position: 40.7081;-73.9571 (Williamsburg, Brooklyn)

#### Robots Meta Tags
Optimized for search engine indexing:
- index, follow
- max-image-preview:large
- max-snippet:-1
- max-video-preview:-1

### 2. Schema.org Structured Data (JSON-LD)

Four comprehensive Schema.org implementations for maximum LLM understanding:

#### Organization Schema
- Company information
- Contact details
- Social media profiles
- Multi-language support (English, Spanish)

#### WebApplication Schema
- App category: FoodApplication
- Platform information: Web, iOS, Android
- Feature list (7 key features)
- Aggregate rating: 4.8/5 (1250 ratings)
- Free pricing information

#### LocalBusiness Schema
- Business details and location
- Opening hours (24/7 availability)
- Geographic coordinates
- Price range and payment methods
- Cuisine types served

#### FAQ Schema
Three common questions with structured answers:
- How ThunderTruck works
- Real-time tracking capabilities
- Payment methods accepted

### 3. SEO Content Layer

Hidden semantic content for search engines and LLMs:
- Hierarchical heading structure (H1, H2)
- Feature descriptions
- How-it-works step-by-step
- Available cuisines
- Service areas
- All invisible to users but crawlable by bots

### 4. robots.txt (`public/robots.txt`)

Comprehensive crawler configuration:
- Allows all major search engines (Google, Bing, Yahoo)
- Explicitly allows AI/LLM crawlers:
  - GPTBot (OpenAI)
  - ChatGPT-User
  - CCBot (Common Crawl)
  - anthropic-ai
  - Claude-Web
  - ClaudeBot
  - Google-Extended
  - PerplexityBot
  - YouBot
- Disallows private paths (/_expo/, /api/)
- Crawl delay: 1 second
- Sitemap reference

### 5. sitemap.xml (`public/sitemap.xml`)

XML sitemap with all major pages:
- Homepage (priority 1.0, daily updates)
- Sign Up/Sign In (priority 0.9, monthly updates)
- Map/Explorer (priority 0.8, daily updates)
- Food Types (priority 0.7, weekly updates)
- Orders (priority 0.7, daily updates)
- Terms of Service (priority 0.3, monthly updates)
- Privacy Policy (priority 0.3, monthly updates)

Each URL includes:
- Last modification date
- Change frequency
- Priority rating
- Image metadata where applicable

### 6. Web App Manifest (`public/manifest.json`)

PWA-compliant manifest for installable web app:
- Full app name and description
- Theme colors matching brand
- Multiple icon sizes (192x192, 512x512)
- App shortcuts (Find Trucks, My Orders)
- Display mode: standalone
- Categories: food, lifestyle, shopping
- Related native applications

### 7. Enhanced app.json Configuration

Updated Expo web configuration with:
- Full app name and description
- Theme colors
- Display mode and orientation
- Language and text direction
- PWA configuration
- Splash screen settings

## LLM Optimization Features

### Structured Context
All Schema.org JSON-LD provides explicit context that LLMs can parse:
- Business purpose and offerings
- Key features and capabilities
- Geographic service area
- Pricing and payment information

### Natural Language Content
Hidden SEO content uses natural language that LLMs prefer:
- Clear, descriptive headings
- Complete sentences and paragraphs
- Logical information hierarchy
- Question-answer pairs (FAQ schema)

### Explicit Relationships
Structured data defines relationships:
- Organization → Contact Points
- WebApplication → Features
- LocalBusiness → Geographic Location
- Questions → Answers

### Multi-Format Information
Same information provided in multiple formats:
- Meta tags (for traditional SEO)
- Schema.org (for structured understanding)
- Natural text (for LLM comprehension)
- Open Graph (for social platforms)

## Performance Optimizations

### Preconnect Resources
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://api.thundertruck.app" />
```

### Canonical URL
Prevents duplicate content issues:
```html
<link rel="canonical" href="https://web.thundertruck.app" />
```

### Image Optimization
- WebP/PNG format specifications
- Alt text for accessibility
- Image schemas in sitemap
- Proper sizing declarations

## Deployment Checklist

### Required Actions After Deployment:

1. **Verify Domain Configuration**
   - Ensure `web.thundertruck.app` resolves correctly
   - Verify SSL certificate is active

2. **Submit Sitemap to Search Engines**
   - Google Search Console: https://search.google.com/search-console
   - Bing Webmaster Tools: https://www.bing.com/webmasters
   - Submit: `https://web.thundertruck.app/sitemap.xml`

3. **Verify robots.txt**
   - Test access: `https://web.thundertruck.app/robots.txt`
   - Use Google's robots.txt Tester

4. **Test Structured Data**
   - Google Rich Results Test: https://search.google.com/test/rich-results
   - Schema.org Validator: https://validator.schema.org/
   - Test URL: `https://web.thundertruck.app`

5. **Verify Social Media Cards**
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

6. **Monitor Search Console**
   - Watch for crawl errors
   - Monitor indexing status
   - Check mobile usability
   - Review Core Web Vitals

7. **Test LLM Discoverability**
   - Search in ChatGPT: "food truck delivery app"
   - Search in Perplexity: "order street food ahead"
   - Verify app appears in results

## Maintenance

### Regular Updates

**Monthly:**
- Update lastmod dates in sitemap.xml
- Verify all structured data is current
- Check for broken links

**Quarterly:**
- Review and update aggregate ratings
- Update feature lists
- Add new pages to sitemap

**As Needed:**
- Update contact information
- Add new service areas
- Update social media profiles

### Dynamic Content

For scalability, consider generating dynamic sitemaps for:
- Individual food truck pages
- Menu item pages
- Location-specific pages
- Blog posts (if added)

Create `sitemap-dynamic.xml` that auto-generates from your database.

## Testing Commands

```bash
# Build with new SEO configuration
npm run build

# Serve locally to test
npm run serve:web

# Test specific URLs
curl https://web.thundertruck.app/robots.txt
curl https://web.thundertruck.app/sitemap.xml
curl https://web.thundertruck.app/manifest.json
```

## Key Files Modified/Created

- ✅ `web/index.html` - Custom HTML template with comprehensive SEO
- ✅ `public/robots.txt` - Search engine crawler configuration
- ✅ `public/sitemap.xml` - XML sitemap for all pages
- ✅ `public/manifest.json` - PWA manifest
- ✅ `app.json` - Enhanced web configuration
- ✅ `vercel.json` - Already configured for deployment

## Vercel Deployment Notes

The current `vercel.json` configuration automatically:
- Serves robots.txt from `/public/robots.txt`
- Serves sitemap.xml from `/public/sitemap.xml`
- Serves manifest.json from `/public/manifest.json`
- Uses custom HTML template from `/web/index.html`

All SEO files will be included in the production build.

## Expected Results

### Search Engine Benefits
- Better ranking for "food truck" related queries
- Rich snippets in search results
- Knowledge panel eligibility
- Enhanced local SEO

### LLM Benefits
- Improved discoverability in ChatGPT, Claude, Perplexity
- Accurate information in AI-generated responses
- Featured in LLM recommendations
- Structured data enables precise answers

### Social Benefits
- Rich preview cards on all platforms
- Consistent branding across shares
- Improved click-through rates
- Better user engagement

## Success Metrics

Track these metrics post-deployment:
- Organic search traffic
- Search impressions and CTR (Search Console)
- Social media referral traffic
- Time to first indexing
- Rich result appearance rate
- LLM mention frequency

## Contact

For questions about the SEO implementation, refer to this documentation or the individual file comments.

## Version History

- **v1.0** (2025-10-21): Initial comprehensive SEO implementation
  - Custom HTML template with meta tags
  - Schema.org structured data (4 types)
  - robots.txt with LLM crawler support
  - XML sitemap with 8 core pages
  - PWA manifest
  - Enhanced app.json configuration

