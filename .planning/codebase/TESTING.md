# Testing Patterns

**Analysis Date:** 2025-03-27

## Test Framework

**Runner:**
- Puppeteer `^24.40.0` for browser automation and E2E testing
- No unit test framework (Jest, Vitest) currently configured
- Tests are manual/E2E focused, run via Node.js scripts

**Assertion Library:**
- Native JavaScript assertions and browser API checks
- Manual screenshot verification
- Console log inspection for validation

**Run Commands:**
```bash
node test-spell-simple.js        # Test spell check functionality
node test-bangla-notebook.js     # Test phonetic input and UI
node test-auto-suggestions.js    # Test word suggestion system
node test-professional-ui.js     # Test UI layout and theming
```

**Test Files Location:**
- Root level test files: `test-*.js` in project root
- Integration tests only (no unit tests)

## Test File Organization

**Location:**
- All E2E tests are at root level: `/test-*.js`
- No `__tests__` or `test/` directory structure
- Tests run against live server (`http://localhost:3000`)

**Naming:**
- Pattern: `test-{feature-name}.js`
- Examples: `test-spell-simple.js`, `test-bangla-notebook.js`, `test-auto-suggestions.js`

**Structure:**
Tests follow async IIFE pattern:
```javascript
async function testSpellCheck() {
  console.log('🔍 Testing Spell Check...\n');
  const browser = await puppeteer.launch({...});
  const page = await browser.newPage();
  // Test logic
}
testSpellCheck();
```

## Test Structure

**Suite Organization:**
```javascript
// 1. Setup browser and page
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1280, height: 720 }
});
const page = await browser.newPage();

// 2. Listen for console/errors
page.on('console', msg => {
  if (msg.text().includes('spell')) {
    console.log('📋', msg.text());
  }
});

// 3. Navigate to page
await page.goto('http://localhost:3000');
await page.waitForSelector('textarea');

// 4. Execute test steps
await page.evaluate(() => {
  const textarea = document.querySelector('textarea');
  textarea.value = 'test content';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
});

// 5. Verify results and take screenshots
const hasOverlay = await page.evaluate(() => {
  return !!document.querySelector('.spelling-overlay');
});
await page.screenshot({ path: 'screenshots/test.png' });
```

**Patterns:**
- Setup: Launch browser, create page, attach listeners
- Teardown: Keep browser open for inspection or explicit close
- Navigation: Always wait for specific selectors after page load
- Delays: Use explicit `await delay(ms)` for timing-sensitive operations
- Verification: DOM queries and element presence checks

## Key Test Examples

**Spell Check Test** (`test-spell-simple.js`):
```javascript
// Type text with mistakes
await page.evaluate(() => {
  const textarea = document.querySelector('textarea');
  textarea.value = 'আমাক কোরো';  // Misspelled Bangla
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
});

// Click spell check button
const clicked = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const btn = buttons.find(b => b.textContent?.includes('Test Spell Check'));
  if (btn) {
    btn.click();
    return true;
  }
  return false;
});

// Verify overlay appears
const hasOverlay = await page.evaluate(() => {
  return !!document.querySelector('.spelling-overlay');
});
```

**Phonetic Input Test** (`test-bangla-notebook.js`):
```javascript
// Test transliteration: "ami" -> "আমি"
await page.click('textarea');
await page.type('textarea', 'ami ');
await page.waitForFunction(() => true, { timeout: 500 });
const value = await page.$eval('textarea', el => el.value);

// Test complex sentence
await page.keyboard.press('Enter');
await page.type('textarea', 'amar nam tareq. ami bangla likhte pari. ');
```

**Language Toggle Test** (`test-bangla-notebook.js`):
```javascript
// Toggle language mode (Ctrl+B)
await page.keyboard.down('Control');
await page.keyboard.press('b');
await page.keyboard.up('Control');

// Type in English
await page.type('textarea', 'This should be in English ');

// Toggle back to Bangla
await page.keyboard.down('Control');
await page.keyboard.press('b');
await page.keyboard.up('Control');

// Type in Bangla
await page.type('textarea', 'ebar banglay ');
```

## Mocking

**Framework:**
- No mocking library (no Jest/Sinon)
- Browser context isolation via Puppeteer page instances
- localStorage mocked via page.evaluate() JavaScript context

**Patterns:**
```javascript
// Mock localStorage state
await page.evaluate(() => {
  localStorage.setItem('notes', JSON.stringify([...]));
});

// Mock user input
await page.evaluate(() => {
  const textarea = document.querySelector('textarea');
  textarea.value = 'new content';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
});
```

**What to Mock:**
- User input via `page.type()` or `dispatchEvent()`
- Browser storage via `page.evaluate()` to set localStorage
- Timing via explicit delays: `await delay(ms)`

**What NOT to Mock:**
- Network requests (tests run against real API)
- Browser rendering (Puppeteer handles real DOM)
- Local spell checker logic (runs in browser context)

## Fixtures and Test Data

**Test Data:**
Bangla test strings hardcoded in tests:
```javascript
// Misspelled words for spell check
'আমাক কোরো'  // Should be 'আমাকে করো'

// Phonetic input for transliteration
'ami'         // Should become 'আমি'
'bangladesh'  // Should become 'বাংলাদেশ'
'amar nam'    // Should become 'আমার নাম'
```

**Location:**
- Inline in test files
- No separate fixtures directory
- Data generation on-the-fly in `test-bangla-notebook.js`

## Test Execution

**Before Running Tests:**
1. Start development server: `pnpm dev`
2. Wait for server to be ready at `http://localhost:3000`
3. Run test script: `node test-spell-simple.js`

**Execution Flow:**
```javascript
async function testSpellCheck() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    // ... test steps
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  // Browser kept open for inspection
}
testSpellCheck();
```

**Output:**
- Console logs with emoji indicators: 📋, ✅, ❌, 🔍
- Screenshots saved to `/screenshots/` directory
- Test completion message logged
- Browser window remains open for manual verification

## Coverage

**Requirements:** None enforced

**Current State:**
- No code coverage metrics configured
- Manual E2E testing only
- No branch or line coverage tracking

**Gap Analysis:**
- Unit tests for `BanglaInputHandler` class (core transliteration logic)
- Unit tests for `useSpellCheck` hook
- Unit tests for `AdaptiveDictionary` class
- Integration tests for note CRUD operations

## Test Types

**Unit Tests:**
- Not implemented
- Would test: `BanglaInputHandler.transliterate()`, `AdaptiveDictionary.getSuggestions()`, spell check correction logic

**Integration Tests:**
- Partial E2E via Puppeteer
- Test scope: User workflows (typing, spell checking, language toggle, saving notes)
- Run against live dev server
- Examples: `test-bangla-notebook.js` tests full user flow

**E2E Tests:**
- Puppeteer-based browser automation
- Files: `test-spell-simple.js`, `test-bangla-notebook.js`, `test-auto-suggestions.js`, `test-professional-ui.js`
- Coverage: Phonetic input, spell checking, UI interaction, storage

## Testing Best Practices Observed

**1. Explicit Waits:**
```javascript
await page.waitForSelector('textarea');
await page.waitForFunction(() => true, { timeout: 500 });
```

**2. Readable Test Output:**
- Emoji prefixes for visual scanning
- Descriptive console messages
- Screenshot names tied to test phase

**3. Error Handling:**
```javascript
try {
  // test logic
} catch (error) {
  console.error('Test failed:', error);
  await page.screenshot({ path: 'screenshots/error-state.png' });
} finally {
  // Optional cleanup
}
```

**4. Isolated Test Cases:**
- Each test file runs independently
- Fresh browser instance per test
- No test interdependencies

**5. Screenshot Artifacts:**
- Save screenshots at key test stages
- Directory: `/screenshots/`
- Names: `test-name-step.png`

## Test Maintenance Notes

**Adding New Tests:**
1. Create `test-feature-name.js` in project root
2. Use Puppeteer for browser automation
3. Follow async/await pattern
4. Add console.log() statements at test steps
5. Save screenshots at verification points
6. Keep browser open in finally block for debugging

**Key Test Selectors:**
- Textarea editor: `textarea`
- Buttons: `button` (find by text content)
- Spell overlay: `.spelling-overlay`
- Format buttons: `[class*="format-btn"]`

**Common Issues:**
- Timeouts: Increase `waitForSelector` timeout if page loads slowly
- Selector not found: Use `page.evaluate()` to inspect DOM
- Screenshot missing: Ensure `/screenshots/` directory exists (`fs.mkdirSync('screenshots')`)

---

*Testing analysis: 2025-03-27*
