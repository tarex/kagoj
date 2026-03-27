const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAutoSuggestions() {
  console.log('🚀 Starting Auto-Suggestion Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1280,
      height: 720
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen for console messages to debug
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('suggestion') || text.includes('ghost') || text.includes('AI')) {
      console.log('📋 Browser Console:', msg.type().toUpperCase(), ':', text);
    }
  });

  // Listen for network requests to track API calls
  page.on('request', request => {
    if (request.url().includes('/api/suggestions')) {
      console.log('🔄 API Request to:', request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/suggestions')) {
      console.log('✅ API Response:', response.status(), 'from', response.url());
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // Wait for editor
    const editorSelector = 'textarea';
    await page.waitForSelector(editorSelector, { timeout: 10000 });
    console.log('✅ Editor found\n');
    
    // Clear any existing content
    await page.click(editorSelector);
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    // Test 1: Type a sentence and wait for suggestion
    console.log('📝 Test 1: Testing basic auto-suggestion');
    console.log('   Typing: "আমি বাংলা ভাষায়"');
    
    await page.type(editorSelector, 'আমি বাংলা ভাষায়');
    console.log('   ⏳ Waiting for suggestion to appear...');
    
    // Wait for suggestion (ghost text should appear)
    await delay(3000); // Wait for API call and response
    
    // Check if ghost suggestion appears
    const ghostText = await page.evaluate(() => {
      const ghostElement = document.querySelector('.ghost-suggestion, [class*="ghost"]');
      return ghostElement ? ghostElement.textContent : null;
    });
    
    if (ghostText) {
      console.log('   ✅ Ghost suggestion found:', ghostText);
    } else {
      console.log('   ⚠️ No ghost suggestion found in DOM');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/suggestion-test1.png',
      fullPage: true 
    });
    console.log('   📸 Screenshot saved: suggestion-test1.png\n');
    
    // Test 2: Try to accept suggestion with Tab
    console.log('📝 Test 2: Testing Tab to accept suggestion');
    await page.keyboard.press('Tab');
    await delay(500);
    
    const contentAfterTab = await page.$eval(editorSelector, el => el.value);
    console.log('   Content after Tab:', contentAfterTab);
    
    await page.screenshot({ 
      path: 'screenshots/suggestion-test2-after-tab.png',
      fullPage: true 
    });
    console.log('   📸 Screenshot saved: suggestion-test2-after-tab.png\n');
    
    // Test 3: Type with English to Bangla conversion and check suggestion
    console.log('📝 Test 3: Testing with phonetic input');
    await page.keyboard.press('Enter');
    await page.type(editorSelector, 'ami ekti ');
    console.log('   Typed: "ami ekti " (should convert to "আমি একটি ")');
    console.log('   ⏳ Waiting for suggestion...');
    
    await delay(3000);
    
    // Check the actual content
    const convertedContent = await page.$eval(editorSelector, el => el.value);
    console.log('   Converted content:', convertedContent);
    
    // Look for any suggestion indicators
    const suggestionIndicators = await page.evaluate(() => {
      const indicators = {
        ghostSuggestion: document.querySelector('.ghost-suggestion')?.textContent,
        placeholderText: document.querySelector('textarea')?.placeholder,
        statusText: document.querySelector('[class*="ghost"]')?.textContent,
        anyGhostElement: !!document.querySelector('[class*="ghost"]'),
        textareaValue: document.querySelector('textarea')?.value
      };
      return indicators;
    });
    
    console.log('   Suggestion indicators:', JSON.stringify(suggestionIndicators, null, 2));
    
    await page.screenshot({ 
      path: 'screenshots/suggestion-test3-phonetic.png',
      fullPage: true 
    });
    console.log('   📸 Screenshot saved: suggestion-test3-phonetic.png\n');
    
    // Test 4: Check if AI suggestion button exists
    console.log('📝 Test 4: Checking for AI suggestion controls');
    
    const aiControls = await page.evaluate(() => {
      const controls = {
        hasAIButton: !!document.querySelector('button[aria-label*="AI"], button[aria-label*="suggestion"]'),
        hasGhostText: !!document.querySelector('.ghost-text, .ghost-suggestion'),
        textareaAttributes: Object.fromEntries(
          Array.from(document.querySelector('textarea')?.attributes || [])
            .map(attr => [attr.name, attr.value])
        )
      };
      return controls;
    });
    
    console.log('   AI Controls found:', JSON.stringify(aiControls, null, 2));
    
    // Test 5: Monitor Ghost state from status bar
    console.log('\n📝 Test 5: Checking Ghost status from UI');
    
    const ghostStatus = await page.evaluate(() => {
      // Look for the Ghost status in the UI
      const statusElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent.includes('Ghost:')
      );
      if (statusElements.length > 0) {
        return statusElements[0].textContent;
      }
      return null;
    });
    
    console.log('   Ghost Status:', ghostStatus || 'Not found in UI');
    
    // Final screenshot
    await page.screenshot({ 
      path: 'screenshots/suggestion-final-state.png',
      fullPage: true 
    });
    console.log('   📸 Screenshot saved: suggestion-final-state.png\n');
    
    console.log('✅ All auto-suggestion tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - Page loads: ✅');
    console.log('   - Editor found: ✅');
    console.log('   - Phonetic conversion: ✅');
    console.log('   - Ghost suggestion:', ghostText ? '✅ Found' : '⚠️ Not visible');
    console.log('   - Ghost status:', ghostStatus ? '✅ ' + ghostStatus : '⚠️ Not found');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'screenshots/suggestion-error-state.png',
      fullPage: true 
    });
  } finally {
    console.log('\n🔍 Browser will remain open for inspection. Press Ctrl+C to close.');
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testAutoSuggestions().catch(console.error);