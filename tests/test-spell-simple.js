const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSpellCheck() {
  console.log('🔍 Testing Spell Check...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('spell') || text.includes('Spell') || 
        text.includes('Local') || text.includes('errors')) {
      console.log('📋', text);
    }
  });

  try {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('textarea');
    
    // Type text with spelling mistakes
    console.log('Typing text with mistakes: "আমাক কোরো"');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      textarea.value = 'আমাক কোরো';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    await delay(1000);
    
    // Click Test Spell Check button
    console.log('\nClicking Test Spell Check button...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Test Spell Check'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    console.log('Button clicked:', clicked);
    await delay(3000);
    
    // Check status
    const status = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*'))
        .find(e => e.textContent?.includes('Spelling:'));
      return el?.textContent || 'Not found';
    });
    
    console.log('\nSpelling status:', status);
    
    // Check for spelling overlay
    const hasOverlay = await page.evaluate(() => {
      return !!document.querySelector('.spelling-overlay');
    });
    
    console.log('Spelling overlay visible:', hasOverlay);
    
    await page.screenshot({ path: 'screenshots/spell-simple.png' });
    console.log('\n✅ Test complete! Check screenshot.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSpellCheck();