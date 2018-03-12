#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { version } = require('../package');
const token = process.env.GH_TOKEN;
const { execSync } = require('child_process');

const getChangeLog = () => {
    let file;
    let contents = '';

    try {
        file = path.resolve(__dirname, '../CHANGELOG.md');

        contents = fs.readFileSync(file, 'utf8');
        contents = contents.replace(/\r\n/g, '\n');
        contents = contents.split(`<a name="${version}"></a>`)[1];

        fs.unlinkSync(file);
    } catch(e) {
      console.error(`Error: ${e.message}`);
    }

    return contents;
};

const gitHubRelease = (contents = '') => {
    const releasesApi = 'https://api.github.com/repos/cdcabrera/semantic-sans-npm/releases';

    const data = {
        tag_name: `v${version}`,
        target_commitish: "master",
        name: `v${version}`,
        body: contents,
        draft: false,
        prerelease: false
    };

    const execStr = `curl -H "Authorization: token ${token}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}' ${releasesApi}`;

    return execSync(execStr, {stdio:'inherit'});
};

const gitHubLatestRelease = () => {
  const releasesApi = 'https://api.github.com/repos/cdcabrera/semantic-sans-npm/releases/latest';
  const packageJsonVersion = require('../package').version;
  const execStr = `curl -fs -H "Authorization: token ${token}" -H "Content-Type: application/json" ${releasesApi}`;
  let apiResponse = {};

  try {
    apiResponse = JSON.parse(execSync(execStr).toString());
  } catch(e) {
    console.error(`Error: ${e.message}`);
  }

  return {
    package: packageJsonVersion,
    tag: apiResponse.tag_name,
    gitHubId: apiResponse.id
  };
};

const gitHubReleaseUpdate = (contents = '') => {
  const { package, tag, gitHubId } = gitHubLatestRelease();
  const releasesApi = `https://api.github.com/repos/cdcabrera/semantic-sans-npm/releases/${gitHubId}`;

  if (package === tag || `${package}`.indexOf(tag) > -1 || `${tag}`.indexOf(package) > -1) {
    const data = {
      // name: `v${version}`,
      body: contents
    };

    try {
      const execStr = `curl -fs -H "Authorization: token ${token}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}' ${releasesApi}`;
      execSync(execStr);
    } catch(e) {
      console.error(`Error: ${e.message}`);
    }
  } else {
    console.warn('Warning: package & tag mistmatch. Ignoring release notes update.');
  }

};

const gitHubPushTags = () => {
  try {
    const execStr = 'git push --follow-tags origin master';
    execSync(execStr)
  } catch(e) {
    console.error(`Error: ${e.message}`);
  }
};

const log = getChangeLog();

if (log !== '') {
    // gitHubPushTags();
    gitHubReleaseUpdate(log);
} else {
    console.warn('Warning: Changelog not available, exiting.');
    process.exit();
}

/*
const log = getChangeLog();

if (log !== '') {
    gitHubRelease(log);
} else {
    console.log('Changelog not available, exiting.');
    process.exit();
}
*/
