import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const tennisMember = github("Estanip/tennisMember", { branch: "master", checkSuites: false });

  const web = service("web", {
    source: tennisMember,
    replicas: { "us-east4-eqdc4a": 1 },
    // YARN_PRODUCTION=false: NODE_ENV=production en Railway omite devDependencies
    // necesarias para el build de Next/TypeScript.
    build: {
      builder: "RAILPACK",
      buildCommand: "YARN_PRODUCTION=false yarn install --frozen-lockfile && yarn build:web",
    },
    // node directo: `yarn start:web` deja Yarn + with-env + shell residentes.
    // NEXT_PUBLIC_API_URL debe existir como variable en build time.
    start: "node node_modules/next/dist/bin/next start apps/web",
    healthcheck: "/",
    healthcheckTimeout: 60,
    // Restart policy ON_FAILURE es el default de Railway (se guarda como null).
    deploy: {
      sleepApplication: true,
      restartPolicyMaxRetries: 5,
    },
    domains: ["socios.reservame-alem.com.ar"],
  });

  const api = service("api", {
    source: tennisMember,
    replicas: { "us-east4-eqdc4a": 1 },
    // YARN_PRODUCTION=false: NODE_ENV=production en Railway omite devDependencies
    // (@types/node, typescript) y rompe `tsc` en el build.
    build: {
      builder: "RAILPACK",
      buildCommand: "YARN_PRODUCTION=false yarn install --frozen-lockfile && yarn build:api",
    },
    // Migraciones solo en pre-deploy: con sleepApplication el start corre en cada despertar.
    preDeploy: "yarn db:migrate:deploy",
    // node directo: `yarn start:api` deja procesos Yarn residentes (~100 MB c/u).
    start: "node apps/api/dist/index.js",
    healthcheck: "/health",
    healthcheckTimeout: 30,
    deploy: {
      sleepApplication: true,
      restartPolicyMaxRetries: 5,
    },
  });

  return project("TennisMember", {
    variables: { managed: false },
    resources: [web, api],
  });
});
