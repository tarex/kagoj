const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSpellCheck() {
  console.log('🔍 Testing Spell Check Functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('spell') || text.includes('Spell') || 
        text.includes('error') || text.includes('checking')) {
      console.log('📋', msg.text());
    }
  });

  try {
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const textarea = await page.waitForSelector('textarea');
    console.log('✅ Editor ready\n');
    
    // Clear content
    await textarea.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    console.log('📝 Test 1: Type text with intentional spelling mistakes');
    // Type some correct and incorrect Bangla words
    await page.type(textarea, 'আমি বাংলা লিখতে পারি। আমাক ভালো লাগে। কোরো না।', { delay: 50 });
    await delay(1000);
    
    const textValue = await textarea.evaluate(el => el.value);
    console.log('   Typed text:', textValue);
    
    // Click the spell check button
    console.log('\n📝 Test 2: Click Spell Check button');
    const spellCheckButton = await page.$('button:has-text("Spell Check")');
    if (spellCheckButton) {
      await spellCheckButton.click();
      console.log('   ✅ Clicked spell check button');
    } else {
      // Try alternative selector
      const altButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const spellBtn = buttons.find(btn => 
          btn.textContent?.includes('Spell Check') || 
          btn.textContent?.includes('✓')
        );
        if (spellBtn) {
          spellBtn.click();
          return true;
        }
        return false;
      });
      
      if (altButton) {
        console.log('   ✅ Found and clicked spell check button');
      } else {
        console.log('   ⚠️ Spell check button not found');
      }
    }
    
    // Wait for spell check to complete
    await delay(3000);
    
    // Check for spelling errors in UI
    console.log('\n📝 Test 3: Check for spelling error indicators');
    
    const spellingStatus = await page.evaluate(() => {
      const statusEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Spelling:'));
      return statusEl ? statusEl.textContent : null;
    });
    console.log('   Spelling status:', spellingStatus);
    
    // Look for error highlights or underlines
    const hasErrorHighlights = await page.evaluate(() => {
      // Check for elements with error styling
      const errorElements = document.querySelectorAll(
        '.spelling-error, [class*="error"], [style*="underline"], [style*="red"]'
      );
      return errorElements.length > 0;
    });
    console.log('   Error highlights found:', hasErrorHighlights);
    
    // Check if there's a spelling overlay
    const hasSpellingOverlay = await page.evaluate(() => {
      return !!document.querySelector('.spelling-overlay, [class*="spelling"]');
    });
    console.log('   Spelling overlay visible:', hasSpellingOverlay);
    
    await page.screenshot({ path: 'screenshots/spell-check-test.png' });
    
    console.log('\n📝 Test 4: Test the debug spell check button');
    // Click the test spell check button in debug panel
    const testSpellCheckClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const testBtn = buttons.find(btn => 
        btn.textContent?.includes('Test Spell Check')
      );
      if (testBtn) {
        testBtn.click();
        return true;
      }
      return false;
    });
    
    if (testSpellCheckClicked) {
      console.log('   ✅ Clicked Test Spell Check button');
      await delay(2000);
      
      const newStatus = await page.evaluate(() => {
        const statusEl = Array.from(document.querySelectorAll('*'))
          .find(el => el.textContent?.includes('Spelling:'));
        return statusEl ? statusEl.textContent : null;
      });
      console.log('   New spelling status:', newStatus);
    }
    
    await page.screenshot({ path: 'screenshots/spell-check-final.png' });
    
    console.log('\n✅ Spell check test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'screenshots/spell-check-error.png' });
  }
  
  console.log('\n🔍 Browser remains open for inspection.');
}

testSpellCheck().catch(console.error);