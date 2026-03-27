const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRealTyping() {
  console.log('🚀 Testing real-time typing with suggestions...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen for relevant console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('suggestion') || text.includes('Ghost') || 
        text.includes('Adaptive') || text.includes('Learned')) {
      console.log('📋', msg.type().toUpperCase(), ':', text);
    }
  });

  try {
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const textarea = await page.waitForSelector('textarea');
    console.log('✅ Editor ready\n');
    
    // Clear existing content
    await textarea.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    console.log('🔤 Test 1: Typing "ami" slowly to trigger suggestions');
    await textarea.click();
    
    // Type each character with delay to simulate real typing
    await page.keyboard.type('a', { delay: 100 });
    await delay(500); // Wait for suggestion
    
    let ghostStatus = await page.evaluate(() => {
      const ghostEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Ghost:'));
      return ghostEl ? ghostEl.textContent : null;
    });
    console.log('   After "a":', ghostStatus);
    
    await page.keyboard.type('m', { delay: 100 });
    await delay(500);
    
    ghostStatus = await page.evaluate(() => {
      const ghostEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Ghost:'));
      return ghostEl ? ghostEl.textContent : null;
    });
    console.log('   After "am":', ghostStatus);
    
    await page.keyboard.type('i', { delay: 100 });
    await delay(800); // Longer wait for conversion + suggestion
    
    // Check the converted text and ghost status
    const textareaValue = await textarea.evaluate(el => el.value);
    console.log('   Converted text:', textareaValue);
    
    ghostStatus = await page.evaluate(() => {
      const ghostEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Ghost:'));
      return ghostEl ? ghostEl.textContent : null;
    });
    console.log('   After "ami":', ghostStatus);
    
    // Check if ghost text element exists
    const hasGhostText = await page.evaluate(() => {
      return !!document.querySelector('.ghost-text, [class*="ghost"]');
    });
    console.log('   Ghost text element exists:', hasGhostText);
    
    await page.screenshot({ path: 'screenshots/real-typing-ami.png' });
    
    console.log('\n🔤 Test 2: Continue typing to "amar" for better suggestions');
    await page.keyboard.type(' ', { delay: 100 });
    await delay(300);
    await page.keyboard.type('amar', { delay: 100 });
    await delay(1000);
    
    const textAfterAmar = await textarea.evaluate(el => el.value);
    console.log('   Text after typing:', textAfterAmar);
    
    ghostStatus = await page.evaluate(() => {
      const ghostEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Ghost:'));
      return ghostEl ? ghostEl.textContent : null;
    });
    console.log('   Ghost status:', ghostStatus);
    
    // Try to accept suggestion with Tab
    console.log('\n🔤 Test 3: Pressing Tab to accept suggestion');
    await page.keyboard.press('Tab');
    await delay(500);
    
    const textAfterTab = await textarea.evaluate(el => el.value);
    console.log('   Text after Tab:', textAfterTab);
    
    await page.screenshot({ path: 'screenshots/real-typing-final.png' });
    
    // Check adaptive dictionary stats
    const stats = await page.evaluate(() => {
      const statsEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.includes('Dictionary:'));
      return statsEl ? statsEl.textContent : null;
    });
    console.log('\n📊 Dictionary stats:', stats);
    
    console.log('\n✅ Test completed! Browser remains open.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'screenshots/real-typing-error.png' });
  }
}

testRealTyping().catch(console.error);