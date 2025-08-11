import puppeteer from 'puppeteer';

async function testLoadStrategyButton() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('error', err => {
      console.error('PAGE ERROR:', err);
    });
    
    page.on('pageerror', err => {
      console.error('PAGE ERROR:', err);
    });
    
    // Navigate to the pricing strategy page
    console.log('Navigating to pricing strategy page...');
    await page.goto('http://localhost:5173/pricing/strategy', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Look for the Load Strategy button
    console.log('Looking for Load Strategy button...');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for the Load Strategy button with different approaches
    console.log('Looking for Load Strategy button with multiple selectors...');
    
    // Method 1: Look for all buttons and analyze them
    const allButtons = await page.$$eval('button', buttons => 
      buttons.map((btn, index) => ({
        index,
        text: btn.textContent.trim(),
        outerHTML: btn.outerHTML.slice(0, 400),
        disabled: btn.disabled,
        classes: btn.className
      }))
    );
    
    console.log('All buttons found:', allButtons.length);
    
    // Method 2: Look for relevant buttons
    const relevantButtons = allButtons.filter(btn => 
      btn.text.toLowerCase().includes('load') || 
      btn.text.toLowerCase().includes('strategy') ||
      btn.outerHTML.toLowerCase().includes('folderopen') ||
      btn.outerHTML.toLowerCase().includes('folder-open')
    );
    console.log('Relevant buttons:', relevantButtons);
    
    // Method 3: Try to find Load Strategy button with exact text
    try {
      const loadStrategyButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.trim() === 'Load Strategy' ||
          btn.textContent.trim().includes('Load Strategy') ||
          btn.innerHTML.includes('Load Strategy')
        );
      });
      
      if (loadStrategyButton) {
        console.log('Found Load Strategy button via evaluate!');
        
        // Try to click it
        console.log('Attempting to click Load Strategy button...');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const targetButton = buttons.find(btn => 
            btn.textContent.trim() === 'Load Strategy' ||
            btn.textContent.trim().includes('Load Strategy')
          );
          if (targetButton) {
            targetButton.click();
            return true;
          }
          return false;
        });
        
        console.log('Button clicked! Waiting for modal...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if modal appeared
        const modalPresent = await page.evaluate(() => {
          return document.querySelector('[role="dialog"]') !== null;
        });
        console.log('Modal present after click:', modalPresent);
        
      } else {
        console.log('No Load Strategy button found');
      }
    } catch (error) {
      console.log('Error finding/clicking button:', error.message);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/dashboard-screenshot.png', fullPage: true });
    console.log('Screenshot saved to /tmp/dashboard-screenshot.png');
    
    // Check if we're on a login page
    const isLoginPage = await page.$('input[type="password"]') !== null;
    console.log('Is login page:', isLoginPage);
    
    if (isLoginPage) {
      console.log('Detected login page - strategy buttons would not be visible');
    }
    
    // Check current URL
    console.log('Current URL:', page.url());
    
  } catch (error) {
    console.error('Error testing Load Strategy button:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testLoadStrategyButton().catch(console.error);