import { currentVersion, errorExitCode } from "../config";

import axios from "axios";

let releasesData: any;

async function initReleasesData() {
  if (!releasesData) {
    const url =
      "https://api.github.com/repos/alexbcberio/sgssi-crypto/releases/latest";

    try {
      const { data } = await await axios.get(url);

      // eslint-disable-next-line require-atomic-updates
      releasesData = data;
    } catch (e) {
      console.log(`Error fetching latest release`);
      process.exit(errorExitCode);
    }
  }
}

async function getLatestVersion(): Promise<string> {
  try {
    await initReleasesData();
  } catch (e) {
    console.log(`Error fetching latest release`);

    return "";
  }

  return releasesData.tag_name;
}

async function isLatestRelease() {
  const latestVersion = await getLatestVersion();

  if (!latestVersion) {
    // We assume we are running already the latest version, if we were not we
    // do not have information about the url of the new release so we cannot do
    // anything.
    return true;
  }

  return `v${currentVersion}` === latestVersion;
}

async function getDownloadUrl(platform?: NodeJS.Platform): Promise<string> {
  if (!platform) {
    platform = process.platform;
  }

  if (!releasesData) {
    await initReleasesData();
  }

  const { assets } = releasesData;
  let asset;

  switch (platform) {
    case "win32":
      asset = assets.find((r: any) => r.name.endsWith(".exe"));
      break;
    case "linux":
      asset = assets.find((r: any) => r.name.endsWith("linux"));
      break;
    case "darwin":
      asset = assets.find((r: any) => r.name.endsWith("macos"));
      break;
    default:
      throw `Unsupported platform ${platform}`;
  }

  return asset.browser_download_url;
}

export { isLatestRelease, getDownloadUrl };
