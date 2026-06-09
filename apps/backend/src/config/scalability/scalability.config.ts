export const scalabilityConfig = {
  cache: {
    defaultTtlSeconds: 300,
    analyticsTtlSeconds: 600,
    reportsTtlSeconds: 900,
  },

  queue: {
    enabled: true,
    provider: "memory",
    futureProvider: "bullmq-redis",
  },

  cdn: {
    enabled: false,
    provider: "future-cloudfront-or-cloudflare",
    assetFolders: ["uploads", "reports"],
  },

  scaleTargets: {
    maxUsers: 100000,
    maxBranchesPerGym: 500,
    maxMembersPerBranch: 5000,
  },
};