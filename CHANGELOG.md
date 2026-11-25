# Changelog

Notable changes to this WilderFire fork are documented here. Version headings distinguish released versions from development candidates.

## [0.1.1] — Release candidate (unreleased)

### Added
- Automated TypeScript checks, Vitest tests, production builds, and build artifacts through GitHub Actions.
- Automated GitHub Pages deployment for the development branch.
- Separate WilderFire Dev PWA identity, allowing installation alongside the original application.

### Fixed
- Export palette hexadecimal values in uppercase for JWildfire Mini compatibility (`bfd14f7`).
- Use a generic binary MIME type for `.flame` downloads to prevent Android from appending `.xml`; XML file contents remain unchanged (`6529740`).
- Support deployment under a GitHub Pages subdirectory, including manifest paths, service worker registration, and scoped caches.

### Validation — 2026-11-24
User-reported acceptance tests:
- [x] Application loads without errors.
- [x] Random fractals generate and render.
- [x] Sample fractals load correctly.
- [x] Flame export succeeds.
- [x] Exported flames open in JWildfire Mini without manual editing or renaming.
- [x] Application installs as WilderFire Dev.
- [x] Original WilderFire remains installed.
- [x] Application launches offline.
- [ ] Desktop JWildfire import and rendering.
- [ ] Desktop JWildfire round-trip compatibility.

### Release status
All eight initial acceptance tests passed. Desktop compatibility testing remains pending. No v0.1.1 release tag has been published; the version heading is a proposed release milestone.

## [0.1.0] — Upstream baseline

Original WilderFire application inherited from [thepacket/wilderfire](https://github.com/thepacket/wilderfire).
