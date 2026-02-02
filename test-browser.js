const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  try {
    // Test 1: Main app loads
    console.log('Test 1: Main app loads...');
    const page = await browser.newPage();
    await page.goto('http://localhost:8900/silverstream.html', { waitUntil: 'networkidle0' });
    const title = await page.title();
    results.push({ test: 'Main app loads', pass: title.includes('SilverStream'), detail: title });

    // Test 2: Activity buttons render (check for activity types)
    console.log('Test 2: Activity buttons render...');
    const hasActivities = await page.evaluate(() => {
      return typeof ACTIVITY_TYPES !== 'undefined' && ACTIVITY_TYPES.length > 0;
    });
    results.push({ test: 'Activity types defined', pass: hasActivities, detail: hasActivities ? 'ACTIVITY_TYPES exists' : 'Not found' });

    // Test 3: Browse videos and play one
    console.log('Test 3: Browse and play a video...');
    await page.evaluate(() => {
      // Use browseAll function to go to browse screen
      if (typeof browseAll === 'function') browseAll();
    });
    await new Promise(r => setTimeout(r, 500));

    // Play first video using playVideo function
    const playResult = await page.evaluate(() => {
      const videos = typeof youtubeVideos !== 'undefined' ? youtubeVideos : [];
      if (videos.length > 0 && typeof playVideo === 'function') {
        playVideo(videos[0].id);
        return { played: true, videoCount: videos.length, screen: state.screen };
      }
      return { played: false, videoCount: videos.length };
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check if player screen is active and container exists
    const playerState = await page.evaluate(() => {
      const appHtml = document.getElementById('app').innerHTML;
      return {
        screen: state.screen,
        hasContainer: document.getElementById('youtube-player-container') !== null,
        hasPlayer: document.querySelector('iframe[src*="youtube"]') !== null || document.getElementById('youtube-player-container') !== null,
        appHtmlSnippet: appHtml.substring(0, 300),
        hasCloseButton: appHtml.includes('closePlayer')
      };
    });
    const hasPlayerContainer = playerState.screen === 'player' && playerState.hasCloseButton;
    results.push({ test: 'Player container created', pass: hasPlayerContainer, detail: JSON.stringify(playerState) });

    // Check if YouTube API script was added
    const hasYTScript = await page.evaluate(() => {
      return Array.from(document.scripts).some(s => s.src.includes('youtube.com/iframe_api'));
    });
    results.push({ test: 'YouTube API script loaded', pass: hasYTScript, detail: hasYTScript ? 'Loaded' : 'Not loaded' });

    // Test 4: Error handling functions exist
    console.log('Test 4: Error handling functions exist...');
    const hasFunctions = await page.evaluate(() => {
      return {
        onPlayerError: typeof onPlayerError === 'function',
        playNextVideo: typeof playNextVideo === 'function',
        openOnYouTube: typeof openOnYouTube === 'function',
        playPrevVideo: typeof playPrevVideo === 'function'
      };
    });
    results.push({
      test: 'Error handling functions defined',
      pass: hasFunctions.onPlayerError && hasFunctions.playNextVideo && hasFunctions.openOnYouTube,
      detail: JSON.stringify(hasFunctions)
    });

    // Test 5: Admin page loads
    console.log('Test 5: Admin page loads...');
    await page.goto('http://localhost:8900/admin.html', { waitUntil: 'networkidle0' });
    const adminTitle = await page.title();
    results.push({ test: 'Admin page loads', pass: adminTitle.includes('Admin'), detail: adminTitle });

    // Test 6: Admin has test video function
    console.log('Test 6: Admin video test function...');
    const hasTestFn = await page.evaluate(() => typeof testVideoEmbed === 'function');
    results.push({ test: 'testVideoEmbed function exists', pass: hasTestFn, detail: hasTestFn ? 'Defined' : 'Missing' });

    // Test 7: Navigate to Videos page and check Add Video modal
    console.log('Test 7: Videos page and test button...');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-page="videos"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click Add Video button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add Video'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Check for test button in modal
    const hasTestBtn = await page.$('#test-embed-btn') !== null;
    results.push({ test: 'Test embed button in Add Video modal', pass: hasTestBtn, detail: hasTestBtn ? 'Found' : 'Not found' });

  } catch (err) {
    results.push({ test: 'Test execution', pass: false, detail: err.message });
  }

  await browser.close();

  // Print results
  console.log('\n========== TEST RESULTS ==========\n');
  let passed = 0, failed = 0;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(`${status}: ${r.test}`);
    console.log(`       ${r.detail}\n`);
    if (r.pass) passed++; else failed++;
  }
  console.log(`==================================`);
  console.log(`Total: ${passed} passed, ${failed} failed`);
  console.log(`==================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
