#!/bin/bash

# test-ci-local.sh - Run tests locally in CI-like environment

echo "🔧 Setting up CI-like test environment..."

# Ensure we're using the correct Node version
source scripts/setup-node.sh

# Set CI environment variable
export CI=true
export PLAYWRIGHT_TEST_BASE_URL="http://127.0.0.1:3333"

# Check required environment variables
echo "🔍 Checking environment variables..."
REQUIRED_VARS=(
  "VITE_EEN_CLIENT_ID"
  "VITE_EEN_CLIENT_SECRET" 
  "VITE_REDIRECT_URI"
  "TEST_USER"
  "TEST_PASSWORD"
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_PROJECT_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf "   %s\n" "${MISSING_VARS[@]}"
  echo ""
  echo "💡 Make sure to set these in your .env file or environment"
  exit 1
fi

echo "✅ All required environment variables are set"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build successful"

# Start the preview server
echo "🚀 Starting preview server..."
npm run preview &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
timeout=60
while ! curl -s http://127.0.0.1:3333 > /dev/null; do
  if [ $timeout -le 0 ]; then
    echo "❌ Server failed to start within 60 seconds"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  echo "Waiting... ($timeout seconds remaining)"
  sleep 1
  timeout=$((timeout-1))
done

echo "✅ Server is ready!"

# Test server response
echo "🔍 Testing server response..."
RESPONSE=$(curl -I http://127.0.0.1:3333 2>/dev/null | head -1)
if [[ $RESPONSE == *"200"* ]]; then
  echo "✅ Server responding correctly: $RESPONSE"
else
  echo "❌ Server not responding properly: $RESPONSE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping server with PID: $SERVER_PID"
    kill $SERVER_PID 2>/dev/null || true
  fi
}

# Set up cleanup trap
trap cleanup EXIT

# Run the tests
echo "🎭 Running Playwright tests..."
npx playwright test

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi

echo ""
echo "📊 Test results and videos are in:"
echo "   - HTML report: playwright-report/"
echo "   - Test results: test-results/"

exit $TEST_EXIT_CODE 