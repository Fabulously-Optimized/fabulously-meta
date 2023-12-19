import { Octokit } from "octokit";
import { config } from "./index";

/**
 * Represents a mod's version information.
 */
export interface ModVersion {
  name: string,
  url: string,
}

/**
 * Represents a mod's author information.
 */
export interface ModAuthor {
  name: string,
  avatar_url: string,
  url: string,
}

/**
 * Represents a mod's information.
 */
export interface Mod {
  name: string,
  icon_url: string | undefined,
  summary: string,
  version: ModVersion
}

/**
 * Represents a list of mods that are in the modpack version.
 */
export type ModList = Mod[];

export interface ModpackVersion {
  tag: string,
  id: string,
  url: string,
  isPreRelease: boolean,
  mods: ModList,
  releaseDate: Date,
  changelog: string,
}

export interface ModpackVersionList {
  versions: ModpackVersion[],
  latest: ModpackVersion,
  latestPreRelease: ModpackVersion,
}

// Where string is GitHub username.
export type Contributor = {
  username: string,
  avatar_url: string,
};

export interface ContributorsList {
  organizationMembers: Contributor[],
  contributors: Contributor[],
}

export const octokit: Octokit = new Octokit({ auth: config.githubToken });
