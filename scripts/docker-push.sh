#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Push the Docker image
IMAGE_NAME="ghcr.io/iankulin/aichat:latest"
echo "Pushing $IMAGE_NAME..."
docker push "$IMAGE_NAME"

echo "Docker image pushed successfully."
