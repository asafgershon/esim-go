# Font System - Simple Hebrew (Rubik) & English (Agency)

## Overview

This is a simple, manual font system with:
- **Hebrew Text**: Rubik (רוביק) font family  
- **English Text**: Agency font family
- **Dashboard**: Always uses Rubik font consistently

## Usage

### Manual Font Classes

Apply font classes manually where needed:

```tsx
// Hebrew text
<h1 className="font-hebrew">שלום עולם</h1>

// English text  
<h1 className="font-english">Hello World</h1>

// Default (Rubik for dashboard, auto for web-app)
<h1>Default font</h1>
```

## CSS Classes

### Available Font Classes

```css
.font-hebrew    /* Rubik font for Hebrew text */
.font-english   /* Agency font for English text */
.font-fallback  /* System fallback fonts */
```

### Tailwind Configuration

Both apps have these font utilities available:

```tsx
// Use in Tailwind classes
<div className="font-hebrew text-2xl">טקסט עברי</div>
<div className="font-english text-lg">English Text</div>
```

## App-Specific Behavior

### 🌐 Web App (`client/apps/web-app`)
- **Smart CSS**: Hebrew text automatically gets Rubik, English gets Agency
- **Manual Override**: Can use `font-hebrew` or `font-english` classes for specific control
- **RTL Support**: Proper direction handling with `dir="rtl"`

### ⚙️ Dashboard (`client/apps/dashboard`)  
- **Consistent Rubik**: Always uses Rubik font by default
- **Clean Interface**: Unified typography across all admin content
- **No Auto-switching**: Simple, predictable font behavior

## Implementation Details

### Font Configuration

```css
:root {
  --font-hebrew: 'Rubik', system-ui, -apple-system, sans-serif;
  --font-english: 'Agency FB', 'Agency', Arial, sans-serif;
  --font-fallback: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Font Loading

**Web App (Next.js)**:
- Rubik loaded via `next/font/google` with Hebrew subset
- Agency loaded via CDN link

**Dashboard (Vite)**:
- Both fonts loaded via CDN links in `index.html`
- Rubik set as default in CSS

## Examples

### Web App Usage

```tsx
// Hebrew content - automatically styled in CSS
<div dir="rtl">
  <h1 className="font-hebrew">ברוכים הבאים ל-eSIM Go</h1>
  <p>טקסט בעברית יקבל אוטומטית את פונט רוביק</p>
</div>

// English content - use font-english class
<div>
  <h1 className="font-english">Welcome to eSIM Go</h1>
  <p className="font-english">English text with Agency font</p>
</div>

// Mixed content - manual control
<div>
  <span className="font-hebrew">שלום</span>
  <span className="font-english"> Hello</span>
</div>
```

### Dashboard Usage

```tsx
// Everything uses Rubik by default
<div>
  <h1>Dashboard Title</h1>
  <p>All content uses Rubik consistently</p>
  
  // Only override if specifically needed
  <span className="font-english">Special English Text</span>
</div>
```

## Browser Support

- **Rubik**: Supports Hebrew, Latin, and Cyrillic scripts
- **Agency**: Modern browsers with web font support  
- **Fallbacks**: System fonts ensure compatibility

## Performance

- **Font Loading**: Optimized with `font-display: swap`
- **No JavaScript**: Pure CSS implementation
- **Caching**: Fonts cached by browser after first load

## Migration from Auto-Detection

If migrating from the previous auto-detection system:

```tsx
// Before (auto-detection)
<AutoFontText>שלום עולם</AutoFontText>
<HebrewText>זה היה עם פונט עברי</HebrewText>
<EnglishText>This was English font</EnglishText>

// After (manual)
<span className="font-hebrew">שלום עולם</span>
<span className="font-hebrew">זה עם פונט עברי</span>  
<span className="font-english">This is English font</span>
```

The new system is simpler and more predictable! 