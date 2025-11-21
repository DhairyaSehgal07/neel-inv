# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.5](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.4...v0.1.5) (2025-11-21)


### Bug Fixes

* fabric consumed field not being set during belt creation ([98ae613](https://github.com/DhairyaSehgal07/neel-inv/commit/98ae613526db97679f3610421290a06de8dbcb94))


### Miscellaneous Chores

* bug fix ([28d0634](https://github.com/DhairyaSehgal07/neel-inv/commit/28d06347db8aa5c8a31fa1e44a4f9968fb7a8afa))

### [0.1.4](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.3...v0.1.4) (2025-11-20)


### Features

* add compound batches API route with RBAC protection
* add compound batches table component with search and filtering
* add belts table component with essential columns and detailed view dialog
* add useBeltsQuery hook for fetching belts with React Query
* add useCompoundBatchesQuery hook for fetching compound batches
* add server-side fetch functions for compound batches
* add belt details dialog showing all belt information in organized sections

### Bug Fixes

* fix compound batches API route file naming (routes.ts -> route.ts) to resolve 404 errors

### [0.1.3](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.2...v0.1.3) (2025-11-20)


### Bug Fixes

* correct API endpoints and client query hooks for compound masters ([fd46b6b](https://github.com/DhairyaSehgal07/neel-inv/commit/fd46b6b1fd02c5381db4c11601ffbfbd73a27e1f))

### [0.1.2](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.1...v0.1.2) (2025-11-20)


### Features

* add authentication system with NextAuth and dashboard ([b4aa59c](https://github.com/DhairyaSehgal07/neel-inv/commit/b4aa59c0f5c863f0d7b95e98b37d80b7ad235ccc))
* add dashboard layout with sidebar navigation and new pages ([74f7d09](https://github.com/DhairyaSehgal07/neel-inv/commit/74f7d0953a14f69024352b0f77e2d762d7a2ce83))


### Bug Fixes

* **husky:** remove deprecated husky.sh import from commit-msg hook ([b9f68f8](https://github.com/DhairyaSehgal07/neel-inv/commit/b9f68f86d15307fd57d96fc2612d18ab0868d5d2))

### 0.1.1 (2025-11-11)


### Miscellaneous Chores

* set up commit conventions and changelog system 87ad728

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js and MongoDB
- Database connection utility with connection state management
