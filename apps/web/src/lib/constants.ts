export const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true";

export const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

// GitHub redirects the old path after a transfer, so fleet binaries keep
// working; update here and the cloud side follows on the next deploy.
export const githubRepo = "lukevella/rallly";
export const githubRepoUrl = `https://github.com/${githubRepo}`;
