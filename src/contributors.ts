import { Contributor, ContributorsList, octokit } from "./types";

// Get contributors off github.
export async function getContributors(): Promise<ContributorsList> {
  // Get organization members from "fabulously-optimized"
  const organizationMembers = (await octokit.rest.orgs.listMembers({
    org: "fabulously-optimized",
  })).data;

  const orgContributors: Contributor[] = organizationMembers.map((member) => {
    return member.login;
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
        contributors.push(contributor.login);
      }
    }
  }

  // Remove organization members from contributors.
  const filteredContributors = contributors.filter((contributor) => {
    return !orgContributors.includes(contributor);
  });

  return {
    organizationMembers: orgContributors,
    contributors: filteredContributors,
  };
}