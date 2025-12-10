# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.15](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.14...v0.1.15) (2025-01-31)


### Code Refactoring

* update compound batch date constraints and batch creation logic ([d4f561c](https://github.com/DhairyaSehgal07/neel-inv/commit/d4f561c))
  * remove unique constraint on batch date field to allow multiple batches per day
  * add unique sparse indexes on coverCompoundProducedOn and skimCompoundProducedOn
  * add validation to prevent cover and skim dates from conflicting
  * simplify update-dates route by removing duplicate date checks
  * add batchDate parameter to compound service to use calendaring date for new batches
  * update belt service to pass calendaring date when creating compound batches

### [0.1.14](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.13...v0.1.14) (2025-11-30)


### Features

* add rating management system with MongoDB integration ([e491851](https://github.com/DhairyaSehgal07/neel-inv/commit/e49185140a42755b356611c1c1fc51ba77d9df35))

### [0.1.12](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.11...v0.1.12) (2025-11-29)


### Features

* add sorting functionality to belts table and fix top/bottom cover display ([84ffeaf](https://github.com/DhairyaSehgal07/neel-inv/commit/84ffeaf55f4157d9ef91d8d17d3cf0fe758ed61d))
* enable date calculations from any date field in edit belt dialog ([3d2d39a](https://github.com/DhairyaSehgal07/neel-inv/commit/3d2d39aed0febe15bf9e99e97b184345353af603))
* implement backward-only date calculation in edit belt dialog ([40b3a7d](https://github.com/DhairyaSehgal07/neel-inv/commit/40b3a7d5ebf908cc887913628b5832510bc0fe9b))

### [0.1.11](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.9...v0.1.11) (2025-11-28)


### Bug Fixes

* improve date handling and compound batch date synchronization ([bfe0ccc](https://github.com/DhairyaSehgal07/neel-inv/commit/bfe0ccca12a36a8895bc61051a9f3140b32ae6f1))
* improve number formatting and add RBAC protection to belt details ([fc291ec](https://github.com/DhairyaSehgal07/neel-inv/commit/fc291ecc4cc79894671ed65001df63855bf40bbc))


### Miscellaneous Chores

* bump version to 0.1.10 ([6455952](https://github.com/DhairyaSehgal07/neel-inv/commit/6455952a911890d557951f1a180f251c8235c42b))


### Code Refactoring

* reorganize fabric lookup table and add new fabric ratings ([124667e](https://github.com/DhairyaSehgal07/neel-inv/commit/124667e849381893de3e4ea5bcb94849200b7730))
* update belt form, table components, and utility functions ([605007d](https://github.com/DhairyaSehgal07/neel-inv/commit/605007d701276e49f267accc9513473a561ebf9c))

### [0.1.10](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.9...v0.1.10) (2025-01-28)


### Bug Fixes

* improve number formatting with 2 decimal places in belt details dialog and tables ([fc291ec](https://github.com/DhairyaSehgal07/neel-inv/commit/fc291ec))
* add RBAC protection to hide order date and delivery deadline from non-admin users in belt details dialog ([fc291ec](https://github.com/DhairyaSehgal07/neel-inv/commit/fc291ec))

### [0.1.9](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.8...v0.1.9) (2025-11-24)


### Features

* add RBAC enhancements, user seeding, and UI improvements ([225ff67](https://github.com/DhairyaSehgal07/neel-inv/commit/225ff67bd77e4f654b6392fd8d6466065cf877c8))
* enhance belts table columns with additional belt specifications ([8d27a74](https://github.com/DhairyaSehgal07/neel-inv/commit/8d27a74e58ca1bc11c2c93bca2539f946ada88dd))


### Bug Fixes

* restrict compound calculation details display to admin users only ([ea7b234](https://github.com/DhairyaSehgal07/neel-inv/commit/ea7b234a340293b0921285f00df8250f5d6c364c))

### [0.1.9](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.8...v0.1.9) (2025-01-28)


### Features

* add Spinner UI component for loading states
* add compound batch permissions to RBAC system
* enhance database connection with automatic user seeding (Admin and Manager roles)
* add RBAC protection to compound batches API routes
* improve user avatar component with role-based avatar images

### Bug Fixes

* improve permission serialization in authentication flow to ensure proper array handling
* enhance form components with better state management

### [0.1.8](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.7...v0.1.8) (2025-11-24)


### Bug Fixes

* improve date handling and compound date calculations ([6067f24](https://github.com/DhairyaSehgal07/neel-inv/commit/6067f249514e9bb1fabb129591a148121d6a4c49))

### [0.1.7](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.6...v0.1.7) (2025-01-27)


### Features

* add edit functionality for belts with comprehensive form dialog
* add edit functionality for compound batches with update dialog
* add API route for updating belts (PUT /api/belts/[id])
* add API route for updating compound batches (PUT /api/compounds/batches/[id])
* add row actions for compound batches table with edit option
* add update belt mutation hook for React Query
* add update compound batch mutation hook for React Query
* add updateBeltRequestSchema for validating belt update requests
* enhance belt and compound services with update methods
* add history tracking for belt and compound batch updates

### [0.1.6](https://github.com/DhairyaSehgal07/neel-inv/compare/v0.1.5...v0.1.6) (2025-11-21)


### Bug Fixes

* add missing compoundCode and date fields to BatchUsage interface ([715dcf4](https://github.com/DhairyaSehgal07/neel-inv/commit/715dcf470bc787b4f1e2da955641389b27f66097))

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
