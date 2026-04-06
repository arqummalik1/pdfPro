import packageJson from '../../package.json';

function getCommitSha(): string | null {
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA?.trim();
  if (!commit) return null;
  return commit;
}

export const APP_VERSION = packageJson.version || '0.0.0';
export const APP_COMMIT_SHA = getCommitSha();
export const APP_VERSION_LABEL = APP_COMMIT_SHA
  ? `${APP_VERSION}+${APP_COMMIT_SHA.slice(0, 7)}`
  : APP_VERSION;
