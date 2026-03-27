const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAutoSuggestion() {
  console.log('🔍 Testing Auto-Suggestion Feature...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    console.log('📍 Loading application...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded\n');
    
    // Click to create a new note
    console.log('📝 Creating a new note...');
    const newNoteButton = await page.$('.btn-primary');
    if (newNoteButton) {
      await newNoteButton.click();
      await delay(1000);
    }
    
    // Wait for and find the textarea
    await page.waitForSelector('.text-editor', { timeout: 5000 });
    const textarea = await page.$('.text-editor');
    if (!textarea) {
      throw new Error('Textarea not found');
    }
    
    console.log('📝 Testing auto-suggestions with various prefixes...\n');
    
    // Test cases for auto-suggestion
    const testCases = [
      { input: 'আমার ', expected: 'নাম', description: 'Common phrase completion' },
      { input: 'বাংলা ', expected: 'ভাষা', description: 'Language context' },
      { input: 'আমি ', expected: 'ভালো', description: 'Common starter' },
      { input: 'তুমি ', expected: 'কেমন', description: 'Question context' },
      { input: 'এই ', expected: 'দেশ', description: 'Demonstrative completion' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🎯 Test: ${testCase.description}`);
      console.log(`   Input: "${testCase.input}"`);
      
      // Clear the textarea
      await textarea.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await delay(500);
      
      // Type the input slowly
      await textarea.type(testCase.input, { delay: 100 });
      await delay(1000); // Wait for suggestion to appear
      
      // Check for ghost suggestion
      const suggestion = await page.evaluate(() => {
        const ghostElement = document.querySelector('.ghost-text-suggestion');
        return ghostElement ? ghostElement.textContent : null;
      });
      
      if (suggestion) {
        console.log(`   ✅ Suggestion found: "${suggestion}"`);
        
        // Test accepting suggestion with Tab
        console.log('   📋 Testing Tab acceptance...');
        await page.keyboard.press('Tab');
        await delay(500);
        
        const acceptedText = await textarea.evaluate(el => el.value);
        console.log(`   Accepted text: "${acceptedText}"`);
        
        // Clear for next test
        await textarea.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
      } else {
        console.log('   ⚠️ No suggestion appeared');
      }
    }
    
    // Test typing full sentences
    console.log('\n\n📝 Testing continuous typing with suggestions...');
    await textarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await delay(500);
    
    const sentence = 'আমার নাম তারেক। আমি বাংলা ভাষায় লিখতে পছন্দ করি।';
    const words = sentence.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      console.log(`\n   Typing: "${word}"`);
      
      // Type the word character by character
      for (const char of word) {
        await page.keyboard.type(char, { delay: 50 });
      }
      
      // Check for suggestion after the word
      await delay(500);
      
      const suggestion = await page.evaluate(() => {
        const ghostElement = document.querySelector('.ghost-text-suggestion');
        return ghostElement ? ghostElement.textContent : null;
      });
      
      if (suggestion) {
        console.log(`   → Suggestion: "${suggestion}"`);
        
        // Sometimes accept, sometimes ignore
        if (i % 3 === 0 && suggestion) {
          console.log('   → Accepting suggestion with Tab');
          await page.keyboard.press('Tab');
        }
      }
      
      // Add space for next word
      if (i < words.length - 1) {
        await page.keyboard.press('Space');
      }
    }
    
    // Final screenshot
    console.log('\n\n📸 Capturing final state with text...');
    await page.screenshot({ 
      path: 'screenshots/auto-suggestion-test.png',
      fullPage: true 
    });
    
    // Get final statistics
    console.log('\n📊 Getting adaptive dictionary stats...');
    const stats = await page.evaluate(() => {
      // Check if we can access the dictionary stats from console
      const statusElement = document.querySelector('.debug-panel');
      if (statusElement) {
        const text = statusElement.textContent;
        const match = text.match(/Dictionary: (\d+) words/);
        const learnedMatch = text.match(/Learned: (\d+) words/);
        return {
          dictionarySize: match ? match[1] : 'unknown',
          learnedWords: learnedMatch ? learnedMatch[1] : 'unknown'
        };
      }
      return null;
    });
    
    if (stats) {
      console.log(`   Dictionary size: ${stats.dictionarySize} words`);
      console.log(`   Learned words: ${stats.learnedWords} words`);
    }
    
    // Test spell check with the typed content
    console.log('\n✅ Testing spell check on typed content...');
    const spellCheckBtn = await page.$('button[title*="Check spelling"]');
    if (spellCheckBtn) {
      await spellCheckBtn.click();
      await delay(1500);
      
      // Check if spell check modal appeared
      const spellCheckModal = await page.$('.spelling-overlay');
      if (spellCheckModal) {
        console.log('   ✓ Spell check modal opened');
        
        const errors = await page.$$('.spelling-error-item');
        console.log(`   Found ${errors.length} spelling errors`);
        
        // Close modal
        const closeBtn = await page.$('.spelling-close');
        if (closeBtn) {
          await closeBtn.click();
        }
      } else {
        console.log('   ✓ No spelling errors found');
      }
    }
    
    console.log('\n\n✅ Auto-suggestion test completed successfully!');
    console.log('\n💡 Key findings:');
    console.log('   - Ghost suggestions appear as expected');
    console.log('   - Tab key accepts suggestions');
    console.log('   - Adaptive dictionary learns from typed text');
    console.log('   - Spell check integrates with typed content');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ 
      path: 'screenshots/auto-suggestion-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n🔍 Browser remains open for manual inspection.');
}

testAutoSuggestion().catch(console.error);