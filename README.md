# Fabulously Meta

A web API used to power the Fabulously Optimized Website.

This API collates a mod list, changelog and various information from the Modrinth and GitHub APIs. All responses are cached for 5 minutes to prevent spam to the Modrinth and GitHub APIs.

## Routes

Currently the API can be found at `https://fabulously-meta.mineblock11.dev/` - however this will certainly change.

- `/v1/modpackVersions` - Get a list of all modpack versions, the latest version and the latest pre-release version.

### Expected Response
```json
{
  "versions": [...],
  "latest": {
    "tag": "5.4.1",
    "id": "2ZbcYfCj",
    "url": "https://github.com/Fabulously-Optimized/fabulously-optimized/releases/tag/v5.4.1",
    "isPreRelease": false,
    "mods": [
      {
        "name": "Continuity",
        "version": {
          "name": "3.0.0-beta.4+1.20.1",
          "url": "https://modrinth.com/mod/continuity/version/3.0.0-beta.4+1.20.1"
        },
        "icon_url": "https://cdn.modrinth.com/data/1IjD5062/icon.png",
        "summary": "A Fabric mod that allows for efficient connected textures"
      },
      ...
    ],
    "releaseDate": "2023-10-15T16:22:34.000Z",
    "changelog": "markdown changelog from github here"
  },
  "latestPreRelease": {...}
}
```

- `/v1/contributors` - Get a list of all contributors to the GitHub Organization.

### Expected Response
```json
{
  "organizationMembers": [
    "Imzxhir",
    "Kichura",
    "Madis0",
    "mineblock11",
    "osfanbuff63"
  ],
  "contributors": [
    "RaptaG",
    "RozeFound",
    "AlphaKR93",
    "..."
  ]
}
```