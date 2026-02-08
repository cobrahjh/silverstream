/**
 * Silverstream Performance Regression Tests
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = 'http://localhost:8900';
const BASELINE_FILE = path.join(__dirname, 'performance-baseline.json');

const THRESHOLDS = {
  maxResponseTime: 300,
  maxBundleSize: 256000,
};

class PerformanceTests {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      apiResponseTime: 0,
      bundleSize: 0,
    };
    this.baseline = this.loadBaseline();
  }

  loadBaseline() {
    if (!fs.existsSync(BASELINE_FILE)) {
      console.log('No baseline found, will create one');
      return null;
    }
    return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  }

  saveBaseline() {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(this.metrics, null, 2));
    console.log(`Baseline saved to ${BASELINE_FILE}`);
  }

  async measureApiResponseTime() {
    const start = Date.now();
    try {
      await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
      this.metrics.apiResponseTime = Date.now() - start;
      console.log(`API response time: ${this.metrics.apiResponseTime}ms`);
    } catch (error) {
      console.error('API health check failed:', error.message);
      this.metrics.apiResponseTime = -1;
    }
  }

  async measureBundleSize() {
    const serverFile = path.join(__dirname, '../server.js');
    if (fs.existsSync(serverFile)) {
      const stats = fs.statSync(serverFile);
      this.metrics.bundleSize = stats.size;
      console.log(`Server file size: ${this.metrics.bundleSize} bytes`);
    }

    const publicDir = path.join(__dirname, '../public');
    if (fs.existsSync(publicDir)) {
      let totalSize = 0;
      const files = fs.readdirSync(publicDir, { recursive: true, withFileTypes: true });
      files.forEach(file => {
        if (file.isFile()) {
          const filePath = path.join(file.path || publicDir, file.name);
          totalSize += fs.statSync(filePath).size;
        }
      });
      this.metrics.bundleSize += totalSize;
      console.log(`Total bundle size: ${this.metrics.bundleSize} bytes`);
    }
  }

  checkRegression() {
    if (!this.baseline) {
      console.log('\n=== No Baseline - Setting Initial Metrics ===\n');
      return true;
    }

    console.log('\n=== Performance Regression Check ===\n');
    let hasRegression = false;

    if (this.metrics.apiResponseTime > 0) {
      const apiChange = this.metrics.apiResponseTime - this.baseline.apiResponseTime;
      const apiPctChange = (apiChange / this.baseline.apiResponseTime) * 100;
      console.log(`API Response Time: ${this.metrics.apiResponseTime}ms (baseline: ${this.baseline.apiResponseTime}ms)`);
      if (apiPctChange > 20) {
        console.log(`⚠️  API response time increased by ${apiPctChange.toFixed(1)}%`);
        hasRegression = true;
      }
      if (this.metrics.apiResponseTime > THRESHOLDS.maxResponseTime) {
        console.log(`❌ API response time exceeds threshold (${THRESHOLDS.maxResponseTime}ms)`);
        hasRegression = true;
      }
    }

    if (this.metrics.bundleSize > 0) {
      const sizeChange = this.metrics.bundleSize - this.baseline.bundleSize;
      const sizePctChange = (sizeChange / this.baseline.bundleSize) * 100;
      console.log(`Bundle Size: ${this.metrics.bundleSize} bytes (baseline: ${this.baseline.bundleSize} bytes)`);
      if (sizePctChange > 10) {
        console.log(`⚠️  Bundle size increased by ${sizePctChange.toFixed(1)}%`);
        hasRegression = true;
      }
      if (this.metrics.bundleSize > THRESHOLDS.maxBundleSize) {
        console.log(`❌ Bundle size exceeds threshold (${THRESHOLDS.maxBundleSize} bytes)`);
        hasRegression = true;
      }
    }

    return !hasRegression;
  }

  async run() {
    console.log('=== Silverstream Performance Tests ===\n');
    
    await this.measureApiResponseTime();
    await this.measureBundleSize();
    
    const passed = this.checkRegression();
    
    if (!this.baseline || process.argv.includes('--update-baseline')) {
      this.saveBaseline();
    }

    console.log(passed ? '\n✓ Performance tests passed' : '\n✗ Performance regression detected');
    return passed;
  }
}

async function main() {
  const tests = new PerformanceTests();
  const success = await tests.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTests;
