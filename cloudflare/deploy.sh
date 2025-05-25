#!/bin/bash
#
# we are using the worker from the een-login repository
WORKER="een-login"

# reading the secrets from .env
source ../.env

# check that we have the secrets
echo "client id: '${VITE_EEN_CLIENT_ID:0:5}...'"
echo "client secret: '${VITE_EEN_CLIENT_SECRET:0:5}...'"
[ -z ${VITE_EEN_CLIENT_ID} ] && echo "no client id. exit" && exit 1
[ -z ${VITE_EEN_CLIENT_SECRET} ] && echo "no client secret. exit" && exit 1

echo "deploying the worker according to the wrangler.toml file"
npx wrangler -v deploy

echo "delpoying secrets"
npx wrangler --name ${WORKER} secret put CLIENT_ID <<< ${VITE_EEN_CLIENT_ID}
npx wrangler --name ${WORKER} secret put CLIENT_SECRET <<< ${VITE_EEN_CLIENT_SECRET}

# Store deployment version info in KV
DEPLOY_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION_INFO="Deployed on ${DEPLOY_TIME} (commit: ${GIT_HASH})"
echo "Storing version info: ${VERSION_INFO}"
npx wrangler kv key put --namespace-id=bd89d6652c3941adbe1b5a0197796bb0 --remote DEPLOY_VERSION "${VERSION_INFO}"

