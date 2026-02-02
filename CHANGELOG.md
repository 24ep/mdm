# Changelog

## [1.0.0] - 2026-02-02

### Added
- **Authentication**: Added 2FA support with `two_factor_secret`, `is_two_factor_enabled`, and `two_factor_backup_codes` in User model.
- **Spaces API**: Added 500 error handling and fixed `gen_random_uuid()` usage by explicitly providing `updated_at`.

### Changed
- **Database**: Updated `User` table schema to support two-factor authentication.
- **Spaces API**: Improved robustness of space creation logic.
- **Version**: Bumped version to 1.0.0 for production release.

### Fixed
- **Spaces API**: Resolved 500 Internal Server Error when creating spaces due to missing `updated_at` column in `INSERT` statement.
- **Prisma Schema**: Fixed `prisma.$queryRawUnsafe` invocation error by syncing schema with database.
