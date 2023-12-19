import { Contributor, ContributorsList, octokit } from "./types";

// Get contributors off github.
export async function getContributors(): Promise<ContributorsList> {
  // Get organization members from "fabulously-optimized"
  const organizationMembers = (await octokit.rest.orgs.listMembers({
    org: "fabulously-optimized",
  })).data;

  const orgContributors: Contributor[] = organizationMembers.map((member) => {
    return {
      username: member.login,
      avatar_url: member.avatar_url ?? "https://github.com/ghost.png",
    }
  });

  // Get all contributors from "fabulously-optimized" repositories.
  const repositories = (await octokit.rest.repos.listForOrg({
    org: "fabulously-optimized",
  })).data;

  const contributors: Contributor[] = [];

  for (const repository of repositories) {
    const repositoryContributors = (await octokit.rest.repos.listContributors({
      owner: "fabulously-optimized",
      repo: repository.name,
    })).data;

    for (const contributor of repositoryContributors) {
      if (contributor.login) {
        if (contributor.login.includes("[bot]")) continue;

        contributors.push({
          username: contributor.login,
          avatar_url: contributor.avatar_url ?? "https://github.com/ghost.png",
        });
      }
    }
  }

  // Remove organization members from contributors.
  const filteredContributors = [...new Set(contributors.filter((contributor) => {
    return !orgContributors.includes(contributor);
  }))];

  return {
    organizationMembers: orgContributors,
    contributors: filteredContributors,
  };
}