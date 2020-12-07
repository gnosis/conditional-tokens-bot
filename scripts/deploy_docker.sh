#!/bin/bash

set -euo pipefail

if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    # Get login token and execute login
    $(aws ecr get-login --no-include-email --region $AWS_REGION)

    if [ "$1" = "develop" -o "$1" = "master" ]; then
        # If image does not exist, don't use cache
        docker pull $REGISTRY_URI/$DOCKERHUB_PROJECT:$1 && \
        docker build -t $DOCKERHUB_PROJECT -f docker/Dockerfile . --cache-from $REGISTRY_URI/$DOCKERHUB_PROJECT:$1 || \
        docker build -t $DOCKERHUB_PROJECT -f docker/Dockerfile .
    else
        docker pull $REGISTRY_URI/$DOCKERHUB_PROJECT:staging && \
        docker build -t $DOCKERHUB_PROJECT -f docker/Dockerfile . --cache-from $REGISTRY_URI/$DOCKERHUB_PROJECT:staging || \
        docker build -t $DOCKERHUB_PROJECT -f docker/Dockerfile .
    fi
    docker tag $DOCKERHUB_PROJECT $REGISTRY_URI/$DOCKERHUB_PROJECT:$1
    docker push $REGISTRY_URI/$DOCKERHUB_PROJECT:$1
fi

if [ "$1" = "develop" ] && [ -n "$AUTODEPLOY_URL" ] && [ -n "$AUTODEPLOY_TOKEN" ]; then
    # Notifying webhook
    curl -s  \
    --output /dev/null \
    --write-out "%{http_code}" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"token": "'$AUTODEPLOY_TOKEN'", "push_data": {"tag": "'$1'" }}' \
    $AUTODEPLOY_URL
fi