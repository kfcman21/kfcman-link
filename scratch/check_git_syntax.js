const { execSync } = require('child_process');
const vm = require('vm');

function checkGitFile(revision, filepath) {
  try {
    const buf = execSync(`git show ${revision}:${filepath}`);
    const content = buf.toString('utf8');
    
    // Test compile
    new vm.Script(content);
    console.log(`${revision}:${filepath} -> VALID, length: ${content.length}`);
    return true;
  } catch (e) {
    console.log(`${revision}:${filepath} -> INVALID: ${e.message}`);
    return false;
  }
}

const commits = ['HEAD', 'HEAD~1', 'HEAD~2', 'HEAD~3', 'HEAD~4', '66e0cb4', '68ceff0'];
for (const commit of commits) {
  checkGitFile(commit, 'www/app.js');
}
