/**
 * Skill → Devicon CSS class mapping.
 *
 * Uses Devicon v2.16.0 (loaded via CDN in index.html).
 * @see https://devicon.dev/ for the full icon list.
 *
 * Each entry maps a normalized skill name (lowercase, trimmed) to its
 * Devicon CSS class. The lookup helper `getSkillIconClass` strips common
 * suffixes like ".js" and tries aliases so that "React.js", "ReactJS",
 * and "react" all resolve to the same icon.
 */

// ── Core mapping ────────────────────────────────────────────────────────────

const SKILL_ICON_MAP: Record<string, string> = {
  // ── Languages ───────────────────────────────────────────────────────────
  javascript:    'devicon-javascript-plain colored',
  typescript:    'devicon-typescript-plain colored',
  python:        'devicon-python-plain colored',
  java:          'devicon-java-plain colored',
  'c#':          'devicon-csharp-plain colored',
  csharp:        'devicon-csharp-plain colored',
  'c++':         'devicon-cplusplus-plain colored',
  cplusplus:     'devicon-cplusplus-plain colored',
  c:             'devicon-c-plain colored',
  go:            'devicon-go-original-wordmark colored',
  golang:        'devicon-go-original-wordmark colored',
  rust:          'devicon-rust-original',
  swift:         'devicon-swift-plain colored',
  kotlin:        'devicon-kotlin-plain colored',
  dart:          'devicon-dart-plain colored',
  php:           'devicon-php-plain colored',
  ruby:          'devicon-ruby-plain colored',
  r:             'devicon-r-original colored',
  scala:         'devicon-scala-plain colored',
  perl:          'devicon-perl-plain colored',
  lua:           'devicon-lua-plain colored',
  elixir:        'devicon-elixir-plain colored',
  haskell:       'devicon-haskell-plain colored',
  clojure:       'devicon-clojure-plain colored',
  matlab:        'devicon-matlab-plain colored',
  solidity:      'devicon-solidity-plain colored',

  // ── Frontend Frameworks & Libraries ────────────────────────────────────
  react:         'devicon-react-original colored',
  reactjs:       'devicon-react-original colored',
  'react native':'devicon-react-original colored',
  'react query': 'devicon-react-original colored',
  nextjs:        'devicon-nextjs-plain',
  'next.js':     'devicon-nextjs-plain',
  angular:       'devicon-angularjs-plain colored',
  angularjs:     'devicon-angularjs-plain colored',
  vue:           'devicon-vuejs-plain colored',
  vuejs:         'devicon-vuejs-plain colored',
  'vue.js':      'devicon-vuejs-plain colored',
  svelte:        'devicon-svelte-plain colored',
  nuxt:          'devicon-nuxtjs-plain colored',
  nuxtjs:        'devicon-nuxtjs-plain colored',
  gatsby:        'devicon-gatsby-plain colored',
  ember:         'devicon-ember-original-wordmark colored',
  jquery:        'devicon-jquery-plain colored',
  redux:         'devicon-redux-original colored',

  // ── CSS / Styling ──────────────────────────────────────────────────────
  css:           'devicon-css3-plain colored',
  css3:          'devicon-css3-plain colored',
  html:          'devicon-html5-plain colored',
  html5:         'devicon-html5-plain colored',
  sass:          'devicon-sass-original colored',
  scss:          'devicon-sass-original colored',
  less:          'devicon-less-plain-wordmark colored',
  'tailwind css':'devicon-tailwindcss-plain colored',
  tailwindcss:   'devicon-tailwindcss-plain colored',
  tailwind:      'devicon-tailwindcss-plain colored',
  bootstrap:     'devicon-bootstrap-plain colored',
  materialui:    'devicon-materialui-plain colored',
  'material ui': 'devicon-materialui-plain colored',

  // ── Backend Frameworks ─────────────────────────────────────────────────
  nodejs:        'devicon-nodejs-plain colored',
  'node.js':     'devicon-nodejs-plain colored',
  node:          'devicon-nodejs-plain colored',
  express:       'devicon-express-original',
  expressjs:     'devicon-express-original',
  nestjs:        'devicon-nestjs-original colored',
  django:        'devicon-django-plain',
  flask:         'devicon-flask-original',
  fastapi:       'devicon-fastapi-plain colored',
  'spring boot': 'devicon-spring-original colored',
  spring:        'devicon-spring-original colored',
  rails:         'devicon-rails-plain colored',
  'ruby on rails':'devicon-rails-plain colored',
  laravel:       'devicon-laravel-original colored',
  dotnet:        'devicon-dot-net-plain colored',
  '.net':        'devicon-dot-net-plain colored',
  asp:           'devicon-dot-net-plain colored',

  // ── Databases ──────────────────────────────────────────────────────────
  mysql:         'devicon-mysql-plain colored',
  postgresql:    'devicon-postgresql-plain colored',
  postgres:      'devicon-postgresql-plain colored',
  mongodb:       'devicon-mongodb-plain colored',
  redis:         'devicon-redis-plain colored',
  sqlite:        'devicon-sqlite-plain colored',
  oracle:        'devicon-oracle-original colored',
  firebase:      'devicon-firebase-plain colored',
  dynamodb:      'devicon-dynamodb-plain colored',
  cassandra:     'devicon-cassandra-plain colored',
  neo4j:         'devicon-neo4j-plain colored',
  couchdb:       'devicon-couchdb-plain colored',
  mariadb:       'devicon-mariadb-original colored',

  // ── DevOps / Cloud / Infra ─────────────────────────────────────────────
  docker:        'devicon-docker-plain colored',
  kubernetes:    'devicon-kubernetes-plain colored',
  k8s:           'devicon-kubernetes-plain colored',
  aws:           'devicon-amazonwebservices-plain-wordmark colored',
  'amazon web services': 'devicon-amazonwebservices-plain-wordmark colored',
  azure:         'devicon-azure-plain colored',
  'google cloud platform': 'devicon-googlecloud-plain colored',
  'google cloud':'devicon-googlecloud-plain colored',
  gcp:           'devicon-googlecloud-plain colored',
  terraform:     'devicon-terraform-plain colored',
  ansible:       'devicon-ansible-plain colored',
  jenkins:       'devicon-jenkins-plain colored',
  nginx:         'devicon-nginx-original colored',
  apache:        'devicon-apache-plain colored',
  'github actions': 'devicon-github-original',
  github:        'devicon-github-original',
  gitlab:        'devicon-gitlab-plain colored',
  bitbucket:     'devicon-bitbucket-original colored',
  circleci:      'devicon-circleci-plain colored',
  vagrant:       'devicon-vagrant-plain colored',
  heroku:        'devicon-heroku-plain colored',
  digitalocean:  'devicon-digitalocean-plain colored',
  vercel:        'devicon-vercel-original',
  netlify:       'devicon-netlify-plain colored',

  // ── Tools & Platforms ──────────────────────────────────────────────────
  git:           'devicon-git-plain colored',
  npm:           'devicon-npm-original-wordmark colored',
  yarn:          'devicon-yarn-plain colored',
  webpack:       'devicon-webpack-plain colored',
  vite:          'devicon-vitejs-plain colored',
  babel:         'devicon-babel-plain colored',
  eslint:        'devicon-eslint-original colored',
  prettier:      'devicon-prettier-plain colored',
  postman:       'devicon-postman-plain colored',

  // ── Design ─────────────────────────────────────────────────────────────
  figma:         'devicon-figma-plain colored',
  sketch:        'devicon-sketch-line colored',
  xd:            'devicon-xd-plain colored',
  'adobe xd':    'devicon-xd-plain colored',
  photoshop:     'devicon-photoshop-plain colored',
  illustrator:   'devicon-illustrator-plain colored',
  canva:         'devicon-canva-original colored',

  // ── Mobile ─────────────────────────────────────────────────────────────
  flutter:       'devicon-flutter-plain colored',
  android:       'devicon-android-plain colored',
  ios:           'devicon-apple-original',
  'objective-c': 'devicon-objectivec-plain colored',
  xamarin:       'devicon-xamarin-original colored',

  // ── Data / ML / AI ────────────────────────────────────────────────────
  tensorflow:    'devicon-tensorflow-original colored',
  pytorch:       'devicon-pytorch-original colored',
  pandas:        'devicon-pandas-original colored',
  numpy:         'devicon-numpy-original colored',
  jupyter:       'devicon-jupyter-plain colored',
  opencv:        'devicon-opencv-plain colored',
  anaconda:      'devicon-anaconda-original colored',

  // ── Testing ────────────────────────────────────────────────────────────
  jest:          'devicon-jest-plain colored',
  mocha:         'devicon-mocha-plain colored',
  playwright:    'devicon-playwright-plain colored',
  selenium:      'devicon-selenium-original colored',
  pytest:        'devicon-pytest-plain colored',
  storybook:     'devicon-storybook-plain colored',

  // ── Messaging / Queues ─────────────────────────────────────────────────
  kafka:         'devicon-apachekafka-original colored',
  rabbitmq:      'devicon-rabbitmq-original colored',

  // ── CMS / Other ────────────────────────────────────────────────────────
  wordpress:     'devicon-wordpress-plain colored',
  drupal:        'devicon-drupal-plain colored',
  graphql:       'devicon-graphql-plain colored',
  'socket.io':   'devicon-socketio-original',
  socketio:      'devicon-socketio-original',
  threejs:       'devicon-threejs-original',
  'three.js':    'devicon-threejs-original',
  electron:      'devicon-electron-original colored',
  deno:          'devicon-denojs-original colored',
  bun:           'devicon-bun-plain colored',

  // ── Methodology / Process (no devicon, will use fallback) ──────────────
  // agile, scrum, jira → these will use the text-initial fallback

  // ── Project Management ─────────────────────────────────────────────────
  jira:          'devicon-jira-plain colored',
  confluence:    'devicon-confluence-plain colored',
  trello:        'devicon-trello-plain colored',
  slack:         'devicon-slack-plain colored',

  // ── State Management ──────────────────────────────────────────────────
  zustand:       'devicon-react-original colored', // React ecosystem
};

// ── Alias table for common variations ───────────────────────────────────

const ALIASES: Record<string, string> = {
  'react.js':     'react',
  'vue.js':       'vue',
  'next.js':      'nextjs',
  'nuxt.js':      'nuxtjs',
  'node.js':      'nodejs',
  'express.js':   'express',
  'nest.js':      'nestjs',
  'deno.js':      'deno',
  'three.js':     'threejs',
  'socket.io':    'socketio',
  'react js':     'react',
  'vue js':       'vue',
  'next js':      'nextjs',
  'node js':      'nodejs',
  'nest js':      'nestjs',
  'tailwind css': 'tailwindcss',
  'material ui':  'materialui',
  'react native': 'react',
  'react query':  'react',
  'ruby on rails':'rails',
  'spring boot':  'spring',
  'adobe xd':     'xd',
  'google cloud platform': 'gcp',
  'google cloud': 'gcp',
  'amazon web services': 'aws',
  'github actions': 'github',
};

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Resolve a human-readable skill name to its Devicon CSS class.
 *
 * @returns  The Devicon class string, or `null` if no icon exists.
 */
export function getSkillIconClass(skillName: string): string | null {
  if (!skillName) return null;

  const raw = skillName.trim().toLowerCase();

  // Direct hit
  if (SKILL_ICON_MAP[raw]) return SKILL_ICON_MAP[raw];

  // Try alias
  const aliased = ALIASES[raw];
  if (aliased && SKILL_ICON_MAP[aliased]) return SKILL_ICON_MAP[aliased];

  // Strip trailing ".js" / "js" suffix and retry
  const stripped = raw.replace(/\.js$/i, '').replace(/js$/i, '');
  if (stripped && SKILL_ICON_MAP[stripped]) return SKILL_ICON_MAP[stripped];

  return null;
}

/**
 * Generate a deterministic soft color from a skill name
 * for fallback initial-letter badges.
 */
const FALLBACK_COLORS = [
  { bg: 'bg-sky-100',     text: 'text-sky-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100',   text: 'text-amber-700' },
  { bg: 'bg-rose-100',    text: 'text-rose-700' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  { bg: 'bg-orange-100',  text: 'text-orange-700' },
  { bg: 'bg-teal-100',    text: 'text-teal-700' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-lime-100',    text: 'text-lime-700' },
];

export function getFallbackColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}
