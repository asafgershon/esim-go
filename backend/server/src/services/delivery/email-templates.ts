import type { ESIMDeliveryData } from './delivery-service';
import { generateInstallationLinks } from '../../utils/esim.utils';
import Email from 'email-templates';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: Replace this with your actual base64 logo string
// You can paste your full base64 string here
export const ESIM_GO_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwkAAAFHCAYAAADqVgC5AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAMwISURBVHgB7J0HgFxV1cf/r0yf2d53k2x6QkIqCT2ELgIKKGKhCYgKFj4FFVEMqCAqoqigIIqAiKAovUPoJaT3vpvtvUyfee/d7943u9k2m+xudjdTzk+HzE5588p9957/OeeeK+HQkLoehvjDVVBQKEm25ZIz4xTZZjtKsThKGNNz+VuWni9IPsZYixEN7tLDwQ+1SPDFkBFZg4YGf//tEcQ4IHX9y8R/nHl5JZLFdbLqyjgVkrxAcbhLmaHn8LfUXt+I8nbcogWDNYxFV2v+wKuS5n0n0NxcF2+bBDEIfdvJ2SdkY4pnCY6YcBLmlM2H2zod+Zl50I1M/q7S62sh2JR2bK1tRDCyCZsq38e+ujewmW3HypUa0q/99Rk3HNnZEyVrxumqy7NcsljnKzZ7MTMMcQ/Lvb7QaTCj2YhGtml+73tSNPSsv3H6ZiAtzx9BEERcJIyM/Z2yo7S0zJZ';

interface EmailTemplateData extends ESIMDeliveryData {
  installationLinks?: {
    universalLink: string;
    lpaScheme: string;
    manual: {
      smDpAddress: string;
      activationCode: string;
      confirmationCode: string | null;
    };
    qrCodeData: string;
  };
  name?: string;
  // Additional template variables
  destination?: string;
  dataAmountReadable: string;
  validity: string;
  subtotal?: string;
  discount?: string;
  total?: string;
  invoiceUrl?: string;
  websiteUrl?: string;
  supportUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

// Initialize email templates instance
const email = new Email({
  views: {
    root: join(__dirname, 'email-templates'),
    options: {
      extension: 'pug'
    }
  },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: join(__dirname, 'email-templates')
    }
  }
});

export async function generateESIMEmailTemplate(data: EmailTemplateData): Promise<{
  html: string;
  text: string;
  subject: string;
}> {
  // Generate installation links if we have the necessary data
  const installationLinks = data.installationLinks || 
    (data.activationCode && data.smdpAddress ? generateInstallationLinks({
      smDpAddress: data.smdpAddress,
      activationCode: data.activationCode,
      confirmationCode: null
    }) : null);

  // Prepare template data with enhanced variables
  const templateData = {
    ...data,
    name: data.customerName ? `שלום, ${data.customerName} 👋` : 'שלום 👋',
    installationLinks,
    // Logo
    logoBase64: ESIM_GO_LOGO_BASE64,
    // Map existing data to template variables
    destination: data.destination || data.planName,
    planSize: data.dataAmountReadable || `${data.planName}`,
    validity: data.validity || 'Check plan details',
    subtotal: data.subtotal || data.total,
    discount: data.discount,
    total: data.total || 'Contact support for pricing',
    // Additional URLs (can be configured via environment or passed in)
    invoiceUrl: data.invoiceUrl,
    websiteUrl: data.websiteUrl || 'https://hiilo.com',
    supportUrl: data.supportUrl || 'https://hiilo.com/support',
    termsUrl: data.termsUrl || 'https://hiilo.com/terms',
    privacyUrl: data.privacyUrl || 'https://hiilo.com/privacy'
  };

  try {
    // Render all templates using email-templates library
    const rendered = await email.renderAll('esim-delivery', templateData);
    
    return {
      html: rendered.html || '',
      text: rendered.text || '',
      subject: rendered.subject || ''
    };
  } catch (error) {
    // Fallback to basic template in case of rendering error
    console.error('Email template rendering failed:', error);
    
    return {
      html: `<h1>Your eSIM is Ready!</h1><p>Plan: ${data.planName}</p><p>Order: ${data.orderReference}</p>`,
      text: `Your eSIM is Ready!\n\nPlan: ${data.planName}\nOrder: ${data.orderReference}`,
      subject: `Your eSIM is Ready - ${data.planName}`
    };
  }
}