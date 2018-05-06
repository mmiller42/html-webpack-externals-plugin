const { execSync } = require('child_process');

const commitMessage = execSync('git log -1 --pretty=%B', {
  cwd: __dirname,
  encoding: 'utf8',
  shell: process.env.SHELL
}).trim();

const match = commitMessage.match(/^([0-9]+\.[0-9]+\.[0-9]+)(?:-(.+))?$/);
if (match) {
  const [, version, releaseTag] = match;
  if (releaseTag) {
    console.log(`Publishing pre-release version ${commitMessage} with release tag ${releaseTag}`);
    execSync(`TAG=${releaseTag} npm publish --tag ${releaseTag}`);
  } else {
    console.log(`Publishing release version ${version}`);
    execSync(`TAG=${releaseTag} npm publish`);
  }
} else {
  console.log('No release pushed.');
}
