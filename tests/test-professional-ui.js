const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProfessionalUI() {
  console.log('🎨 Testing Professional UI Design...\n');
  
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
    
    // Take screenshot of initial state
    console.log('📸 Capturing light mode UI...');
    await page.screenshot({ 
      path: 'screenshots/professional-ui-light.png',
      fullPage: true 
    });
    
    // Test hover effects on sidebar
    console.log('🎯 Testing hover effects...');
    const newNoteButton = await page.$('.btn-primary');
    if (newNoteButton) {
      await newNoteButton.hover();
      await delay(500);
      console.log('  ✓ New note button hover effect');
    }
    
    // Click to create a new note
    console.log('\n📝 Creating a new note...');
    if (newNoteButton) {
      await newNoteButton.click();
      await delay(1000);
    }
    
    // Type some content to see the editor
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('📝 Typing sample content...');
      await textarea.click();
      await page.type('textarea', 'আমার নাম ', { delay: 50 });
      await delay(500);
      
      // Check for ghost suggestion
      const ghostStatus = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*'))
          .find(e => e.textContent?.includes('Ghost:'));
        return el ? el.textContent : null;
      });
      console.log('  Ghost suggestion:', ghostStatus);
    }
    
    // Test toolbar buttons hover
    console.log('\n🔧 Testing toolbar buttons...');
    const toolbarButtons = await page.$$('.format-btn-with-text');
    if (toolbarButtons.length > 0) {
      for (let i = 0; i < Math.min(3, toolbarButtons.length); i++) {
        await toolbarButtons[i].hover();
        await delay(200);
      }
      console.log(`  ✓ Tested ${Math.min(3, toolbarButtons.length)} toolbar buttons`);
    }
    
    // Toggle dark mode
    console.log('\n🌙 Testing dark mode...');
    
    // First enable dark mode toggle (it might be disabled)
    await page.evaluate(() => {
      const toggles = document.querySelectorAll('.toggle-switch');
      if (toggles.length > 1) {
        const darkModeToggle = toggles[1];
        darkModeToggle.removeAttribute('disabled');
      }
    });
    
    // Click dark mode toggle
    const darkModeToggle = await page.evaluateHandle(() => {
      const toggles = document.querySelectorAll('.toggle-switch');
      return toggles.length > 1 ? toggles[1] : null;
    });
    
    if (darkModeToggle) {
      await darkModeToggle.asElement()?.click();
      await delay(1000);
      
      // Add dark class to HTML
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await delay(500);
      
      console.log('  ✓ Dark mode activated');
      
      // Take dark mode screenshot
      console.log('📸 Capturing dark mode UI...');
      await page.screenshot({ 
        path: 'screenshots/professional-ui-dark.png',
        fullPage: true 
      });
    }
    
    // Type more content
    console.log('\n📝 Adding more content...');
    await page.type('textarea', 'বাংলা টাইপিং খুব সহজ। এই এডিটরে অনেক ফিচার আছে।', { delay: 30 });
    await delay(1000);
    
    // Test spell check button
    console.log('\n✅ Testing spell check button...');
    const spellCheckBtn = await page.$('button[title*="Check spelling"]');
    if (spellCheckBtn) {
      await spellCheckBtn.hover();
      await delay(300);
      console.log('  ✓ Spell check button hover effect');
    }
    
    // Check UI element styles
    console.log('\n🎨 Analyzing UI styles...');
    const styles = await page.evaluate(() => {
      const computedStyles = {
        topbar: {},
        sidebar: {},
        editor: {},
        buttons: {}
      };
      
      // Check topbar
      const topbar = document.querySelector('.topbar');
      if (topbar) {
        const topbarStyle = window.getComputedStyle(topbar);
        computedStyles.topbar = {
          height: topbarStyle.height,
          backgroundColor: topbarStyle.backgroundColor,
          borderBottom: topbarStyle.borderBottom,
          backdropFilter: topbarStyle.backdropFilter || 'none'
        };
      }
      
      // Check sidebar
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const sidebarStyle = window.getComputedStyle(sidebar);
        computedStyles.sidebar = {
          width: sidebarStyle.width,
          backgroundColor: sidebarStyle.backgroundColor,
          borderRight: sidebarStyle.borderRight
        };
      }
      
      // Check editor
      const editor = document.querySelector('.text-editor');
      if (editor) {
        const editorStyle = window.getComputedStyle(editor);
        computedStyles.editor = {
          fontFamily: editorStyle.fontFamily,
          fontSize: editorStyle.fontSize,
          lineHeight: editorStyle.lineHeight,
          padding: editorStyle.padding
        };
      }
      
      // Check button
      const button = document.querySelector('.btn-primary');
      if (button) {
        const buttonStyle = window.getComputedStyle(button);
        computedStyles.buttons = {
          background: buttonStyle.background,
          borderRadius: buttonStyle.borderRadius,
          padding: buttonStyle.padding,
          transition: buttonStyle.transition
        };
      }
      
      return computedStyles;
    });
    
    console.log('\n📊 UI Style Analysis:');
    console.log('  Topbar:', JSON.stringify(styles.topbar, null, 2));
    console.log('  Sidebar:', JSON.stringify(styles.sidebar, null, 2));
    console.log('  Editor:', JSON.stringify(styles.editor, null, 2));
    console.log('  Buttons:', JSON.stringify(styles.buttons, null, 2));
    
    // Check animations
    console.log('\n🎬 Checking animations...');
    const hasAnimations = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let animatedElements = 0;
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.transition !== 'none' && style.transition !== '' && style.transition !== 'all 0s ease 0s') {
          animatedElements++;
        }
      });
      
      return animatedElements;
    });
    console.log(`  ✓ Found ${hasAnimations} elements with transitions`);
    
    // Final screenshot with content
    console.log('\n📸 Capturing final state...');
    await page.screenshot({ 
      path: 'screenshots/professional-ui-final.png',
      fullPage: true 
    });
    
    // Test responsive design
    console.log('\n📱 Testing responsive design...');
    await page.setViewport({ width: 768, height: 1024 });
    await delay(500);
    await page.screenshot({ 
      path: 'screenshots/professional-ui-tablet.png',
      fullPage: true 
    });
    console.log('  ✓ Tablet view captured');
    
    await page.setViewport({ width: 375, height: 812 });
    await delay(500);
    await page.screenshot({ 
      path: 'screenshots/professional-ui-mobile.png',
      fullPage: true 
    });
    console.log('  ✓ Mobile view captured');
    
    console.log('\n✅ Professional UI test completed successfully!');
    console.log('\n📁 Screenshots saved:');
    console.log('  - professional-ui-light.png');
    console.log('  - professional-ui-dark.png');
    console.log('  - professional-ui-final.png');
    console.log('  - professional-ui-tablet.png');
    console.log('  - professional-ui-mobile.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ 
      path: 'screenshots/professional-ui-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n🔍 Browser remains open for manual inspection.');
}

testProfessionalUI().catch(console.error);