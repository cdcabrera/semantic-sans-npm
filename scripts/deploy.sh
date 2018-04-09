#!/usr/bin/env bash

RED='\033[0;31m'
NOCOLOR='\033[0m' # No Color
SSH_REPO="git@github.com:${TRIGGER_REPO_SLUG}"

getDeployKey () {
  if [ "${TRAVIS_PULL_REQUEST}" != "false" ]; then
    echo -e "${RED}The travis ecrypted key var is not available to builds triggered by pull requests.  Aborting.${NOCOLOR}"
    exit 0
  fi

  # Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
  ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
  ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
  echo "Checking Travis ENV VAR: ${ENCRYPTED_KEY_VAR}..."
  ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
  echo "Checking Travis ENV VAR: ${ENCRYPTED_IV_VAR}..."
  ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
  echo "Run Openssl"
  openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in deploy_key.enc -out deploy_key -d
  echo "Run chmod"
  chmod 600 deploy_key
  eval `ssh-agent -s`
  ssh-add deploy_key
}

#if [ "${TRAVIS_REPO_SLUG}" != "${TRIGGER_REPO_SLUG}" -o "${TRAVIS_BRANCH}" != "${TRIGGER_REPO_BRANCH}" ]; then
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$TRIGGER_REPO_BRANCH" ]; then
  echo -e "${RED}Exiting, this is not a production release.${NOCOLOR}"
  exit 0;
fi

getDeployKey
# npm run release

# npm run storybook:build
# cd .out
git config --global user.email $COMMIT_AUTHOR_EMAIL
git config --global user.name $COMMIT_AUTHOR_USERNAME
git remote add ssh-origin $SSH_REPO
# git init
# git add .
# git commit -m "test"
echo "before"
git show --summary
echo "after"
npm run release
git show --summary

# git push --force --quiet ssh-origin master:gh-pages
# git push --follow-tags --quiet ssh-origin $TARGET_BRANCH
# git push --follow-tags ssh-origin $TARGET_BRANCH
# git push -f ssh-origin $TARGET_BRANCH
# git push --force ssh-origin master:$TARGET_BRANCH
echo "before"
git push --follow-tags ssh-origin $TARGET_BRANCH
