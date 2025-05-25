# EEN Capture Application

A modern Vue 3 application building on top of 
[EEN Login](https://github.com/klaushofrichter/een-login) with additional 
functionality for Google Firebase. All features of EEN Login are preserved,
please refer to the README there for details. 

This application is WIP, it integrates access to a Google Firebase data base to 
capture content from EEN Cameras for further processing. Further details will be 
provded at a later point in time. 

This application uses EEN APIs but is otherwise not associated to EEN or maintained by EEN. 

## Development 

### Node.js Version Requirements
This project requires **Node.js 20.19.0 or higher**. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

#### Quick Setup with Helper Script
```bash
# Run the setup script to automatically configure Node.js
source scripts/setup-node.sh
```

#### Manual Setup with nvm
1. Install nvm if you haven't already: [nvm installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Install and use the correct Node version:
   ```bash
   # Install Node 20.19.0 (if not already installed)
   nvm install 20.19.0
   
   # Use Node 20.19.0 (reads from .nvmrc file)
   nvm use
   
   # Verify correct version
   node --version  # Should output v20.19.0
   ```

#### Checking Node Version
You can verify your Node.js version meets the requirements:
```bash
# Check if your Node version is compatible
npm run check-node
```

#### Alternative: Manual Installation
If you prefer not to use nvm, ensure you have Node.js 20.19.0+ installed from [nodejs.org](https://nodejs.org/).

### Running Tests
The project includes end-to-end tests using Playwright:

```bash
# Run all tests (development mode)
npm test

# Run specific test
npx playwright test --grep "ESC key closes modals"

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Test in CI-like environment locally (mimics GitHub Actions)
npm run test:ci
```

#### Troubleshooting CI Test Failures

If tests fail in GitHub Actions but work locally:

1. **Test locally in CI mode** to replicate the issue:
   ```bash
   npm run test:ci
   ```

2. **Check environment variables** - Ensure all required secrets are set in GitHub:
   - `VITE_EEN_CLIENT_ID`
   - `VITE_EEN_CLIENT_SECRET` 
   - `VITE_REDIRECT_URI`
   - `TEST_USER`
   - `TEST_PASSWORD`
   - Firebase configuration secrets (all `VITE_FIREBASE_*` variables)

3. **Review test artifacts** - GitHub Actions uploads:
   - Playwright HTML reports
   - Test videos and screenshots
   - Console logs for debugging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
