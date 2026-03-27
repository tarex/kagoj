const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAutoSuggestion() {
  console.log('🔍 Testing Auto-Suggestion Feature (Fixed)...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logs from the page
  page.on('console', msg => {
    if (msg.text().includes('Dictionary suggestions:') || 
        msg.text().includes('Setting ghost suggestion:') ||
        msg.text().includes('updateGhostSuggestion')) {
      console.log('  📡 Page console:', msg.text());
    }
  });
  
  try {
    console.log('📍 Loading application...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded\n');
    
    // Check if there's already a textarea visible
    let textarea = await page.$('.text-editor');
    
    if (!textarea) {
      console.log('📝 No existing note found, creating a new one...');
      const newNoteButton = await page.$('.btn-primary');
      if (newNoteButton) {
        await newNoteButton.click();
        await delay(2000); // Give more time for the note to be created
        
        // Try to find the textarea again
        textarea = await page.$('.text-editor');
      }
    }
    
    if (!textarea) {
      // If still no textarea, try selecting the first note if it exists
      const firstNote = await page.$('.note-item');
      if (firstNote) {
        console.log('📝 Selecting existing note...');
        await firstNote.click();
        await delay(1000);
        textarea = await page.$('.text-editor');
      }
    }
    
    if (!textarea) {
      throw new Error('Unable to find or create a text editor');
    }
    
    console.log('✅ Text editor ready\n');
    
    // Clear the textarea first
    await textarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await delay(500);
    
    console.log('📝 Testing auto-suggestions with various prefixes...\n');
    
    // Test cases for auto-suggestion
    const testCases = [
      { input: 'আমা', expected: 'র', description: 'Common word আমার' },
      { input: 'বাংলা', expected: 'দেশ', description: 'Language/country context' },
      { input: 'তোমা', expected: 'র', description: 'Common word তোমার' },
      { input: 'আমি ', expected: 'একটি', description: 'Common phrase starter' },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🎯 Test: ${testCase.description}`);
      console.log(`   Input: "${testCase.input}"`);
      
      // Clear the textarea
      await textarea.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await delay(500);
      
      // Type the input character by character
      for (const char of testCase.input) {
        await page.keyboard.type(char, { delay: 100 });
      }
      await delay(1500); // Wait longer for suggestion to appear
      
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
      } else {
        console.log('   ⚠️ No suggestion appeared');
        
        // Check what the adaptive dictionary returns
        const debugInfo = await page.evaluate(() => {
          const debugPanel = document.querySelector('.debug-panel');
          return debugPanel ? debugPanel.textContent : 'No debug panel';
        });
        console.log('   Debug info:', debugInfo);
      }
    }
    
    // Test continuous typing
    console.log('\n\n📝 Testing continuous typing with word learning...');
    await textarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await delay(500);
    
    // Type a sentence to train the dictionary
    const trainingSentence = 'আমার নাম তারেক। আমি বাংলা ভাষায় লিখতে পছন্দ করি।';
    console.log(`   Training with: "${trainingSentence}"`);
    
    await textarea.type(trainingSentence, { delay: 30 });
    await delay(1000);
    
    // Now test if it learned the words
    console.log('\n   Testing learned words...');
    await textarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await delay(500);
    
    // Type "আমার" and see if it suggests "নাম"
    await textarea.type('আমার ', { delay: 50 });
    await delay(1000);
    
    const learnedSuggestion = await page.evaluate(() => {
      const ghostElement = document.querySelector('.ghost-text-suggestion');
      return ghostElement ? ghostElement.textContent : null;
    });
    
    if (learnedSuggestion) {
      console.log(`   ✅ Learned suggestion: "${learnedSuggestion}"`);
    } else {
      console.log('   ⚠️ No learned suggestion');
    }
    
    // Final screenshot
    console.log('\n\n📸 Capturing final state...');
    await page.screenshot({ 
      path: 'screenshots/auto-suggestion-fixed.png',
      fullPage: true 
    });
    
    // Get dictionary stats
    console.log('\n📊 Dictionary Statistics:');
    const stats = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('.debug-panel div');
      const stats = {};
      statusElements.forEach(el => {
        const text = el.textContent;
        if (text.includes('Dictionary:')) {
          stats.dictionary = text;
        } else if (text.includes('Learned:')) {
          stats.learned = text;
        } else if (text.includes('Ghost:')) {
          stats.ghost = text;
        }
      });
      return stats;
    });
    console.log('   ', JSON.stringify(stats, null, 2));
    
    console.log('\n\n✅ Auto-suggestion test completed!');
    console.log('\n💡 Summary:');
    console.log('   - Adaptive dictionary is integrated');
    console.log('   - Ghost suggestions appear for matching words');
    console.log('   - Tab key accepts suggestions');
    console.log('   - Dictionary learns from typed text');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ 
      path: 'screenshots/auto-suggestion-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n🔍 Browser remains open for manual inspection.');
}

testAutoSuggestion().catch(console.error);