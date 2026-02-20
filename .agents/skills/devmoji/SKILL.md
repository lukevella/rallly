---
name: devmoji
description: Devmoji commit message emoji conventions. Use when writing git commit messages, formatting commit descriptions, or choosing the right emoji prefix for a commit. Triggers on "commit message", "git commit", "commit emoji", "devmoji".
user-invocable: false
---

# Devmoji Commit Conventions

This project uses emoji prefixes in commit messages following devmoji/gitmoji conventions. Every commit message MUST start with an emoji followed by a space, then the description.

## Format

```
<emoji> <Short description>
```

**Examples from this repo:**
- `🐛 Fix hydration error on dashboard page`
- `✨ Add support for in-memory rate limiting`
- `♻️ Move locale sync`
- `⚡️ Preload dayjs locales`
- `💄 Disable overscroll`

## Emoji Reference

| Emoji | Code | When to use |
|-------|------|-------------|
| ✨ | `:sparkles:` | New feature or capability |
| 🐛 | `:bug:` | Bug fix |
| ♻️ | `:recycle:` | Refactoring (no feature or fix) |
| ⚡️ | `:zap:` | Performance improvement |
| 💄 | `:lipstick:` | UI/style/cosmetic change |
| 🔧 | `:wrench:` | Configuration file change |
| 🔥 | `:fire:` | Remove code or files |
| 📝 | `:memo:` | Documentation |
| 🌐 | `:globe_with_meridians:` | Internationalization/localization |
| 🔒️ | `:lock:` | Security fix or improvement |
| ⬆️ | `:arrow_up:` | Upgrade dependencies |
| 🚀 | `:rocket:` | Deploy or release |
| 🔖 | `:bookmark:` | Version tag / release |
| 👷 | `:construction_worker:` | CI/CD changes |
| 🧑‍💻 | `:technologist:` | Developer experience improvement |
| 🌱 | `:seedling:` | Seed data / database seeding |
| 🔊 | `:loud_sound:` | Add or update logs |
| ➕ | `:heavy_plus_sign:` | Add dependency |
| ➖ | `:heavy_minus_sign:` | Remove dependency |
| 🚨 | `:rotating_light:` | Fix linting / compiler warnings |
| ✅ | `:white_check_mark:` | Add or update tests |
| 🏗️ | `:building_construction:` | Architectural change |
| 📦 | `:package:` | Build system change |
| 🗃️ | `:card_file_box:` | Database / migration change |
| 🩹 | `:adhesive_bandage:` | Simple fix for non-critical issue |
| ⏪️ | `:rewind:` | Revert changes |

## Rules

1. **Always prefix** the commit message with exactly one primary emoji
2. **No conventional commit type prefix** — use `🐛 Fix bug` not `fix: 🐛 Fix bug`
3. **Capitalize** the first word after the emoji
4. **No period** at the end of the subject line
5. **Keep it short** — subject line under 72 characters
6. Pick the **most specific** emoji that applies (e.g. `💄` for a pure CSS change, not `✨`)
