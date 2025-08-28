# CDN Assets

This directory contains static assets that are served via CloudFront CDN.

## Structure

```
cdn/
├── email-templates/    # Email template assets (images, logos, etc.)
├── images/            # General images (logos, icons, illustrations)
├── fonts/             # Custom fonts if needed
└── README.md          # This file
```

## Deployment

Assets in this directory are automatically synced to S3 and served via CloudFront when:
- A PR is merged to `main` (production)
- A PR is merged to `development` (development environment)

## URLs

- **Development CDN**: Will be available after first deployment
- **Production CDN**: Will be available after first deployment

## Usage

### In Email Templates
```html
<img src="https://cdn-dev.hiiloworld.com/email-templates/logo.png" alt="Hiilo Logo">
```

### In Application
```javascript
const CDN_URL = process.env.CDN_URL || 'https://cdn.hiiloworld.com';
const logoUrl = `${CDN_URL}/images/logo.png`;
```

## Adding Assets

1. Add your asset to the appropriate subdirectory
2. Commit and push your changes
3. Create a PR
4. Once merged, assets will be automatically deployed to CDN

## File Naming Conventions

- Use lowercase letters and hyphens (e.g., `email-header.png`)
- Include version in filename if needed (e.g., `logo-v2.png`)
- Use descriptive names that indicate usage

## Supported File Types

- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.otf`
- Documents: `.pdf`
- Other: `.json`, `.css`, `.js` (for email templates)

## Cache Control

Files are cached with the following TTLs:
- Default: 1 day
- Maximum: 1 year

To force cache refresh, CloudFront invalidation is triggered automatically on deployment.

## Security

- All files are served over HTTPS
- CORS is configured to allow all origins (for public assets)
- CloudFront Origin Access Identity ensures S3 bucket is not directly accessible