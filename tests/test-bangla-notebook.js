const puppeteer = require('puppeteer');

async function testBanglaNotebook() {
  console.log('Starting Bangla Notebook tests...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: {
      width: 1280,
      height: 720
    }
  });

  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser Console:', msg.type(), msg.text());
  });

  // Listen for errors
  page.on('error', err => {
    console.error('Page error:', err);
  });

  page.on('pageerror', err => {
    console.error('Page error:', err);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Page loaded successfully');
    
    // Wait for the editor to be ready
    await page.waitForSelector('textarea, div[contenteditable="true"], input[type="text"]', {
      timeout: 10000
    });
    
    console.log('Editor found');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/initial-load.png',
      fullPage: true 
    });
    console.log('Screenshot saved: initial-load.png');
    
    // Find the input element
    const inputSelector = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      const contentEditable = document.querySelector('div[contenteditable="true"]');
      const textInput = document.querySelector('input[type="text"]');
      
      if (textarea) return 'textarea';
      if (contentEditable) return 'div[contenteditable="true"]';
      if (textInput) return 'input[type="text"]';
      return null;
    });
    
    if (!inputSelector) {
      throw new Error('No input element found');
    }
    
    console.log(`Found input element: ${inputSelector}`);
    
    // Test 1: Simple Bangla word "ami" (আমি)
    console.log('\nTest 1: Testing phonetic input "ami" -> "আমি"');
    await page.click(inputSelector);
    await page.type(inputSelector, 'ami ');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    const test1Value = await page.$eval(inputSelector, el => el.value || el.textContent);
    console.log('Result:', test1Value);
    
    await page.screenshot({ 
      path: 'screenshots/test1-ami.png',
      fullPage: true 
    });
    
    // Test 2: "bangladesh" -> "বাংলাদেশ"
    console.log('\nTest 2: Testing "bangladesh" -> "বাংলাদেশ"');
    await page.keyboard.press('Enter');
    await page.type(inputSelector, 'bangladesh ');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    const test2Value = await page.$eval(inputSelector, el => el.value || el.textContent);
    console.log('Current content:', test2Value);
    
    await page.screenshot({ 
      path: 'screenshots/test2-bangladesh.png',
      fullPage: true 
    });
    
    // Test 3: Complex sentence
    console.log('\nTest 3: Testing complex sentence');
    await page.keyboard.press('Enter');
    await page.type(inputSelector, 'amar nam tareq. ami bangla likhte pari. ');
    await new Promise(r => setTimeout(r, 1000));
    
    const test3Value = await page.$eval(inputSelector, el => el.value || el.textContent);
    console.log('Current content:', test3Value);
    
    await page.screenshot({ 
      path: 'screenshots/test3-complex.png',
      fullPage: true 
    });
    
    // Test 4: Check for language toggle
    console.log('\nTest 4: Checking language toggle functionality');
    await page.keyboard.press('Enter');
    
    // Try Ctrl+B (or Cmd+B on Mac)
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    // Type in English mode
    await page.type(inputSelector, 'This should be in English ');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    // Toggle back to Bangla
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    await page.type(inputSelector, 'ebar banglay ');
    await page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    
    const test4Value = await page.$eval(inputSelector, el => el.value || el.textContent);
    console.log('After toggle test:', test4Value);
    
    await page.screenshot({ 
      path: 'screenshots/test4-toggle.png',
      fullPage: true 
    });
    
    // Test 5: Check UI elements
    console.log('\nTest 5: Checking UI elements');
    const uiElements = await page.evaluate(() => {
      const elements = {
        hasTitle: !!document.querySelector('h1, h2, [class*="title"]'),
        hasEditor: !!document.querySelector('textarea, div[contenteditable="true"], input[type="text"]'),
        hasFontControls: !!document.querySelector('[class*="font"], button[aria-label*="font"]'),
        hasLanguageIndicator: !!document.querySelector('[class*="language"], [class*="lang"]'),
      };
      return elements;
    });
    
    console.log('UI Elements found:', uiElements);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'screenshots/final-state.png',
      fullPage: true 
    });
    console.log('Screenshot saved: final-state.png');
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: 'screenshots/error-state.png',
      fullPage: true 
    });
  } finally {
    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for inspection. Press Ctrl+C to close.');
    // await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run tests
testBanglaNotebook().catch(console.error);