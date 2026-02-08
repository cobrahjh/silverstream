# Silverstream Test Suite

Testing infrastructure for the Silverstream Hive service template.

## Test Structure

| File | Purpose | Runtime |
|------|---------|---------|
| `functional-tests.js` | API and UI tests | ~8s |
| `performance-regression.js` | Bundle size tracking | ~2s |

## Running Tests

```bash
# Run performance tests
npm test

# Run functional tests
npm run test:functional

# Run all tests
npm run test:all

# Update baseline
npm run test:baseline
```

## Pre-Commit Hook

Automatically runs before each commit:
1. Performance regression checks
2. Functional tests (if server running on port 8900)

Skip with: `git commit --no-verify`

## Test Coverage

### API Endpoints
- ✓ `/api/health` - Health check with status
- ✓ `/api/status` - Service status
- ✓ CORS headers

### UI Features
- ✓ Home page loads
- ✓ Service information visible

### Performance Metrics
- ✓ API response time (< 300ms)
- ✓ Bundle size tracking
- ✓ Regression detection (10% threshold)
