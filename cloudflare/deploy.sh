#!/bin/bash
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

