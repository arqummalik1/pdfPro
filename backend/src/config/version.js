/**
 * Runtime version metadata for backend responses and logs.
 */
const backendPackage = require('../../package.json');

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) || null;
}

function getVersionInfo() {
  const version = backendPackage.version || '0.0.0';
  const commitSha = firstNonEmpty([
    process.env.RENDER_GIT_COMMIT,
    process.env.RENDER_GIT_COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.COMMIT_SHA,
  ]);

  const buildId = firstNonEmpty([
    process.env.RENDER_SERVICE_ID,
    process.env.VERCEL_DEPLOYMENT_ID,
    process.env.BUILD_ID,
  ]);

  return {
    version,
    commitSha,
    shortCommitSha: commitSha ? commitSha.slice(0, 7) : null,
    buildId,
  };
}

module.exports = {
  getVersionInfo,
};
