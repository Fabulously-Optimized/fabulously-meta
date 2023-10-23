// Setup octokit using the github token from config.json
import { Octokit } from 'octokit';
import { config } from './index';
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { resolve } from "path"
import { Mod, ModVersion, ModpackVersion, ModpackVersionList } from './types';

const octokit: Octokit = new Octokit({ auth: config.githubToken });

// Get all releases from the GitHub API for the "fabulously-optimized/fabulously-optimized" repository.
export async function getModpackReleases(): Promise<ModpackVersionList> {
  const releases = (await octokit.rest.repos.listReleases({
    owner: "fabulously-optimized",
    repo: "fabulously-optimized",
  })).data;

  console.debug("[DEBUG] Running getModpackReleases()");

  // Get all the versions from the modrinth API.
  const modrinthVersions = await (await fetch("https://api.modrinth.com/v2/project/1KVo5zza/version", {
    headers: {
      "User-Agent": "Fabulously-Optimized/fabulous-meta",
      "Authorization": config.modrinthToken,
    }
  })).json();

  // Cache any project requests.
  const dependencyProjects = new Map<string, any>();

  // Get all project IDs from modrinthVersions[*].dependencies - no duplicates.
  const dependencyProjectIDs: string[] = [];
  for (const version of modrinthVersions) {
    for (const dependency of version.dependencies) {
      if (!dependencyProjectIDs.includes(dependency.project_id) && dependency.project_id != null) {
        dependencyProjectIDs.push(dependency.project_id);
      }
    }
  }

  // Use https://api.modrinth.com/v2/projects?ids=[...]
  const dependencyProjectsRequests = await (await fetch("https://api.modrinth.com/v2/projects?ids=" + JSON.stringify(dependencyProjectIDs), {
    headers: {
      "User-Agent": "Fabulously-Optimized/fabulous-meta",
      "Authorization": config.modrinthToken,
    }
  })).json();

  // Cache the project requests.
  for (const result of (await Promise.all(dependencyProjectsRequests.map(async (project: any) => {
    return [project.id, project];
  })) as [string, any])) {
    dependencyProjects.set(result[0], result[1]);
  };

  const dependencyVersions = new Map<string, any>();

  // Get all version IDs from modrinthVersions[*].dependencies - no duplicates.
  const dependencyVersionIDs: string[] = [];
  for (const version of modrinthVersions) {
    for (const dependency of version.dependencies) {
      if (!dependencyVersionIDs.includes(dependency.version_id) && dependency.version_id != null) {
        dependencyVersionIDs.push(dependency.version_id);
      }
    }
  }

  // Use https://api.modrinth.com/v2/versions?ids=[...]
  const dependencyVersionRequests = await (await fetch("https://api.modrinth.com/v2/versions?ids=" + JSON.stringify(dependencyVersionIDs), {
    headers: {
      "User-Agent": "Fabulously-Optimized/fabulous-meta",
      "Authorization": config.modrinthToken,
    }
  })).json();

  // Cache the version requests.
  for (const result of (await Promise.all(dependencyVersionRequests.map(async (version: any) => {
    return [version.id, version];
  })) as [string, any])) {
    dependencyVersions.set(result[0], result[1]);
  };


  // Filter out any versions that are already cached.
  // const filteredReleases = releases.filter((release) => {
  //   const strippedVersionID = release.tag_name.replace("v", "");
  //   const version = versionCache.find((version) => version.id === strippedVersionID);

  //   return version == undefined;
  // });

  // Use a promise.all instead of for of loop.
  const versions: (ModpackVersion | undefined)[] = await Promise.all(releases.map(async (release) => {
    const strippedVersionID = release.tag_name.replace("v", "");

    // Get the version from modrinth.
    const version = await modrinthVersions.find((version: any) => version.version_number === strippedVersionID);

    if (version == undefined) {
      console.log("[WARN] GitHub version v" + strippedVersionID + " not found on modrinth.");
      return undefined;
    }

    const changelog = release.body ?? "No changelog provided.";
    const releaseDate = new Date(release.published_at ?? Date.now());

    // Get embedded dependencies from modrinth.
    // Ensure that version_id and project_id are defined.
    const dependencies: any[] = [];

    for (const dependency of version.dependencies) {
      if (dependency.version_id != null && dependency.project_id != null) {
        dependencies.push(dependency)
      }
    }

    // Get the mod information from modrinth.
    const modList: Mod[] = [];

    for (const dependency of dependencies) {
      const dependencyVersion: any = dependencyVersions.get(dependency.version_id);
      const dependencyMod: any = dependencyProjects.get(dependency.project_id);

      const mod = {
        name: dependencyMod.title,
        version: {
          name: dependencyVersion.version_number,
          url: "https://modrinth.com/" + dependencyMod.project_type + "/" + dependencyMod.slug + "/version/" + dependencyVersion.version_number
        },
        icon_url: dependencyMod.icon_url,
        summary: dependencyMod.description,
      };

      modList.push(mod)
    }

    const modpackVersion: ModpackVersion = {
      tag: release.tag_name.replace("v", ""),
      id: version.id,
      url: release.html_url,
      isPreRelease: release.prerelease,
      mods: modList,
      releaseDate,
      changelog,
    };

    return modpackVersion;
  }));

  // Remove undefined versions.
  let cleanVersions: ModpackVersion[] = versions.filter((version: ModpackVersion | undefined) => version != undefined) as ModpackVersion[];

  // Merge cache with cleanVersions.
  // cleanVersions = cleanVersions.concat(versionCache);

  // Sort by release date.
  cleanVersions.sort((a: ModpackVersion, b: ModpackVersion) => b.releaseDate.getTime() - a.releaseDate.getTime());

  const latestPreRelease = cleanVersions.find((version: ModpackVersion) => version.isPreRelease);
  const latestNonPreRelease = cleanVersions.find((version: ModpackVersion) => !version.isPreRelease);

  // Save the cache off thread.
  // saveCache(cleanVersions);

  return {
    versions: cleanVersions,
    latest: latestNonPreRelease ?? cleanVersions[0],
    latestPreRelease: latestPreRelease ?? cleanVersions[0],
  };
}