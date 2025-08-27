# eSIM Delivery Email Template

This email template has been broken down into modular partials for better maintainability and reusability.

## File Structure

```
esim-delivery/
├── html.pug                    # Original complete template (kept for reference)
├── html-main.pug              # Main template that includes all partials
├── partials/                   # Directory containing all template sections
│   ├── head.pug               # HTML head with meta tags, styles, and fonts
│   ├── header.pug             # Logo and hero image section
│   ├── main-content.pug       # Greeting, order info, eSIM details, and QR code
│   ├── order-summary.pug      # Order details grid and CTA button
│   ├── installation-help.pug  # Installation instructions and help
│   ├── tips.pug               # Usage tips section with three tip cards
│   ├── support.pug            # Support section with contact buttons
│   └── footer.pug             # Footer with logo, links, and copyright
└── README.md                  # This file
```

## Usage

### Using the Main Template
To use the complete email template, use `html-main.pug`:

```pug
//- This will render the complete email template
include html-main.pug
```

### Using Individual Partials
You can include individual sections as needed:

```pug
//- Include just the header section
include partials/header.pug

//- Include just the main content
include partials/main-content.pug

//- Include just the footer
include partials/footer.pug
```

## Template Variables

The template expects the following variables to be passed:

- `name` - Customer's name
- `orderReference` - Order reference number
- `destination` - Travel destination
- `planSize` - Data plan size (e.g., "5GB")
- `validity` - Plan validity in days
- `subtotal` - Order subtotal
- `discount` - Discount amount (optional, defaults to "15%")
- `qrCode` - QR code image URL (optional)

## Customization

### Adding New Sections
1. Create a new partial in the `partials/` directory
2. Include it in `html-main.pug` where needed

### Modifying Existing Sections
1. Edit the appropriate partial file
2. The changes will automatically apply to the main template

### Styling
- All styles are defined in `partials/head.pug`
- The template uses the Rubik font family throughout
- Responsive design is included for mobile devices
- RTL (Right-to-Left) support is built-in for Hebrew text

## Benefits of This Structure

1. **Maintainability** - Each section is in its own file, making it easier to find and modify specific parts
2. **Reusability** - Individual sections can be reused in other email templates
3. **Collaboration** - Multiple developers can work on different sections simultaneously
4. **Testing** - Individual sections can be tested in isolation
5. **Version Control** - Changes to specific sections are easier to track and review

## Notes

- The original `html.pug` file is kept for reference and fallback
- All partials maintain the same styling and structure as the original
- The template is fully responsive and supports both Hebrew and English text
- Email client compatibility is maintained with proper table-based layout
