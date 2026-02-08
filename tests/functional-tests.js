/**
 * Silverstream Functional Tests
 * Tests Hive-compatible service template
 */

const { chromium } = require('playwright');
const axios = require('axios');

const API_BASE = 'http://localhost:8900';
const TEST_TIMEOUT = 30000;

class FunctionalTests {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    console.log('Setting up browser...');
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async teardown() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  async test(name, fn) {
    try {
      await fn();
      this.results.push({ name, status: 'PASS' });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.error(`✗ ${name}: ${error.message}`);
    }
  }

  async runTests() {
    console.log('\n=== Silverstream Functional Tests ===\n');

    // API Health Tests
    await this.test('API health check', async () => {
      const response = await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
      if (response.status !== 200) throw new Error('Health check failed');
      if (response.data.status !== 'ok') throw new Error('Health status not ok');
    });

    await this.test('API status endpoint', async () => {
      const response = await axios.get(`${API_BASE}/api/status`, { timeout: 5000 });
      if (!response.data) throw new Error('No status data returned');
      if (!response.data.service) throw new Error('Missing service name');
    });

    await this.test('CORS enabled', async () => {
      const response = await axios.options(`${API_BASE}/api/health`, { timeout: 5000 });
      if (!response.headers['access-control-allow-origin']) {
        throw new Error('CORS headers missing');
      }
    });

    // UI Tests
    await this.test('Home page loads', async () => {
      await this.page.goto(API_BASE, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
      const title = await this.page.title();
      if (!title) throw new Error('No page title');
    });

    await this.test('Service info visible', async () => {
      await this.page.goto(API_BASE, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
      const hasInfo = await this.page.evaluate(() => {
        const body = document.body.innerText.toLowerCase();
        return body.includes('silverstream') || body.includes('hive') || body.includes('service');
      });
      if (!hasInfo) throw new Error('Service info not found');
    });

    // Print summary
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n=== Test Summary ===`);
    console.log(`Total: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }

    return failed === 0;
  }
}

async function main() {
  const tests = new FunctionalTests();
  
  try {
    await tests.setup();
    const success = await tests.runTests();
    await tests.teardown();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test suite failed:', error);
    await tests.teardown();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = FunctionalTests;
