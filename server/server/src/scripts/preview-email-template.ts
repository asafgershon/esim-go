#!/usr/bin/env bun

import { generateESIMEmailTemplate } from '../services/delivery/email-templates.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function previewEmailTemplate() {
  // Sample data in Hebrew
  const testData = {
    customerName: 'יוחנן דו',
    planName: 'תוכנית נתונים לאירופה - 7 ימים',
    orderReference: 'ORD-12345-TEST',
    iccid: '8944538123456789012',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    activationCode: 'LPA:1$smdp.io$123-abc-456',
    smdpAddress: 'smdp.io',
    destination: 'אירופה',
    planSize: '5GB',
    validity: '7 ימים',
    subtotal: '$25.00',
    discount: '-$5.00',
    total: '$20.00',
    invoiceUrl: 'https://hiilo.com/invoice/12345',
  };

  try {
    console.log('🎨 Generating email template preview...');
    
    const result = await generateESIMEmailTemplate(testData);
    
    // Save HTML to a temporary file
    const previewPath = join(process.cwd(), 'email-preview.html');
    writeFileSync(previewPath, result.html);
    
    console.log('✅ Template generated successfully!');
    console.log('📧 Subject:', result.subject);
    console.log('💾 HTML saved to:', previewPath);
    
    // Try to open in browser (macOS)
    try {
      const { spawn } = await import('child_process');
      spawn('open', [previewPath], { stdio: 'ignore', detached: true });
      console.log('🌐 Opening in your default browser...');
    } catch (error) {
      console.log('📂 Please open the file manually:', previewPath);
    }
    
    return { previewPath, ...result };
  } catch (error) {
    console.error('❌ Template generation failed:', error);
    throw error;
  }
}

// Run the preview
if (import.meta.main) {
  previewEmailTemplate()
    .then((result) => {
      console.log('\n🎉 Email template preview ready!');
      console.log('👀 Check your browser or open:', result.previewPath);
    })
    .catch((error) => {
      console.error('\n💥 Preview failed:', error);
      process.exit(1);
    });
}