#!/bin/bash
source ../.env
NAME=$( cat ../package.json|grep '"name":' | cut -d '"' -f4 )
echo "Sending message to Slack for ${NAME}"
curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"Hello, ${NAME}!\"}" ${SLACK_WEBHOOK_URL}
echo

