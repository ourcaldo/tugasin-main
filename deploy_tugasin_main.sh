#!/bin/bash
set -e

REPO_DIR="/home/nexpocket/tugasin-main"
IMAGE_NAME="ghcr.io/ourcaldo/tugasin-main:latest"
GITHUB_USER="ourcaldo"

echo "===== Starting deployment $(date) =====" >> $REPO_DIR/deploy.log 2>&1

# Load GitHub PAT from environment
source ~/.bashrc

cd $REPO_DIR

# Reset & pull latest code
git reset --hard HEAD >> $REPO_DIR/deploy.log 2>&1
git pull origin main >> $REPO_DIR/deploy.log 2>&1

# Log in to GHCR
echo $GITHUB_PAT | docker login ghcr.io -u $GITHUB_USER --password-stdin >> $REPO_DIR/deploy.log 2>&1

# Build & push Docker image
docker build -t $IMAGE_NAME $REPO_DIR >> $REPO_DIR/deploy.log 2>&1
docker push $IMAGE_NAME >> $REPO_DIR/deploy.log 2>&1

echo "===== Deployment finished $(date) =====" >> $REPO_DIR/deploy.log 2>&1
