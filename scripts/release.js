#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const version = require('../package').version;
const token = process.env.GH_TOKEN;
const { exec } = require('child_process');

const getChangeLog = () => {
    let file;
    let contents = '';

    try {
        file = path.resolve(__dirname, '../CHANGELOG.md');

        contents = fs.readFileSync(file, 'utf8');
        contents = contents.replace(/\r\n/g, '\n');
        contents = contents.split(`<a name="${version}"></a>`)[1];

        fs.unlinkSync(file);
    } catch(e) {}

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

    return exec.execSync(execStr, {stdio:'inherit'});
};

const log = getChangeLog();

if (log !== '') {
    gitHubRelease(log);
} else {
    console.log('Changelog not available, exiting.');
    process.exit();
}