// Setup octokit using the github token from config.json
import { Octokit } from 'octokit';
import { config } from './index';
import { Mod, ModVersion, ModpackVersion, ModpackVersionList } from './types';

const octokit: Octokit = new Octokit({ auth: config.githubToken });

// Get all releases from the GitHub API for the "fabulously-optimized/fabulously-optimized" repository.
export async function getModpackReleases(): Promise<ModpackVersionList> {
  const releases = (await octokit.rest.repos.listReleases({
    owner: "fabulously-optimized",
    repo: "fabulously-optimized",
  })).data;

  // Get all the versions from the modrinth API.
  const modrinthVersions = await (await fetch("https://api.modrinth.com/v2/project/1KVo5zza/version")).json();

  const versions: ModpackVersion[] = [];

  for (const release of releases) {
    const strippedVersionID = release.tag_name.replace("v", "");

    // Get the version from modrinth.
    const version = modrinthVersions.find((version: any) => version.version_number === strippedVersionID);

    if (version == undefined) {
      console.log("[WARN] GitHub version v" + strippedVersionID + " not found on modrinth.");
      continue;
    }

    const changelog = release.body ?? "No changelog provided.";
    const releaseDate = new Date(release.published_at ?? Date.now());

    // Get embedded dependencies from modrinth.
    const dependencies = version.dependencies.filter((dependency: any) => dependency.dependency_type === "embedded");

    // Get the mod information from modrinth.
    const modList: Mod[] = await Promise.all(dependencies.map(async (dependency: any): Promise<Mod> => {
      const dependencyVersion = await (await fetch("https://api.modrinth.com/v2/version/" + dependency.version_id)).json();
      const dependencyMod = await (await fetch("https://api.modrinth.com/v2/mod/" + dependency.mod_id)).json();

      return {
        name: dependencyMod.title,
        version: {
          name: dependencyVersion.version_number,
          url: "https://modrinth.com/" + dependencyMod.project_type + "/" + dependencyMod.slug + "/version/" + dependencyVersion.version_number
        },
        icon_url: dependencyMod.icon_url,
        summary: dependencyMod.description,
      }
    }));

    const modpackVersion: ModpackVersion = {
      id: version.id,
      url: release.html_url,
      isPreRelease: release.prerelease,
      mods: [],
      releaseDate,
      changelog,
    };

    versions.push(modpackVersion);
  }

  // Sort by release date.
  versions.sort((a: ModpackVersion, b: ModpackVersion) => b.releaseDate.getTime() - a.releaseDate.getTime());

  const latestPreRelease = versions.find((version: ModpackVersion) => version.isPreRelease);
  const latestNonPreRelease = versions.find((version: ModpackVersion) => !version.isPreRelease);

  return {
    versions,
    latest: latestNonPreRelease ?? versions[0],
    latestPreRelease: latestPreRelease ?? versions[0],
  };
}