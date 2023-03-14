# Changelog

<a name="2.3.2"></a>

## 2.3.2 (2023-03-14)

### Added

- 👷‍♂️ Update build command ([#560](https://github.com/lukevella/Rallly/issues/560)) [[5c96c0a](https://github.com/lukevella/Rallly/commit/5c96c0a763bd44a33481431e29b40f721eca076d)]

### Miscellaneous

- 🌐 Update translations ([#558](https://github.com/lukevella/Rallly/issues/558)) [[674103b](https://github.com/lukevella/Rallly/commit/674103b0b985e1657bcf5c5b314399713cf897dd)]
- 💦 Temporarily disable arm64 builds ([#561](https://github.com/lukevella/Rallly/issues/561)) [[087fb8e](https://github.com/lukevella/Rallly/commit/087fb8e19cd012f56de18712ca271fe34e431508)]
- 🔓 Add config to secure instance from unauth users ([#559](https://github.com/lukevella/Rallly/issues/559)) [[1b38a3c](https://github.com/lukevella/Rallly/commit/1b38a3cf766fbe5355cdfe68aca23a1cf31a9d28)]

<a name="2.3.1"></a>

## 2.3.1 (2023-03-14)

### Added

- 📈 Include pollId when capturing events ([#555](https://github.com/lukevella/Rallly/issues/555)) [[d14a88e](https://github.com/lukevella/Rallly/commit/d14a88e9ebcf825769dfe97968e3b25479b1f931)]

### Miscellaneous

- 🌐 Update translations ([#554](https://github.com/lukevella/Rallly/issues/554)) [[b06341a](https://github.com/lukevella/Rallly/commit/b06341a9de660cdc0bd3c76d499d0370db78d511)]
- 🔓 Allow SMTP server to be configured without auth ([#556](https://github.com/lukevella/Rallly/issues/556)) [[c6e68c4](https://github.com/lukevella/Rallly/commit/c6e68c407c50c96ad9b8d1461cd7468cfa3c6192)]

<a name="2.3.0"></a>

## 2.3.0 (2023-03-13)

This update improves the onboarding experience for new users. Users will receive more information over email and there is less emphasis on verifying a user's email which is only required to enable notifications.

### Added

- ✨ Allow users to log in with magic link ([#553](https://github.com/lukevella/Rallly/issues/553)) [[2cf9ad4](https://github.com/lukevella/Rallly/commit/2cf9ad467ca076f2ebbb6ac292a234e15b941815)]
- ✨ Update notification flow ([#548](https://github.com/lukevella/Rallly/issues/548)) [[39a0755](https://github.com/lukevella/Rallly/commit/39a07558eee7a94d1dcfebaf6e76e1a848fb7ddc)]

### Changed

- 💄 Add dropdown indicator to language selector ([#552](https://github.com/lukevella/Rallly/issues/552)) [[5b78093](https://github.com/lukevella/Rallly/commit/5b78093c6fd1b1c407fb443c69f9154e6843d790)]
- 🔧 Remove custom Crowdin commit message [[2ebda9f](https://github.com/lukevella/Rallly/commit/2ebda9fd19d67c5081086d38eedb1bf8419ee7c0)]
- 💬 Update email subject lines [[611d04e](https://github.com/lukevella/Rallly/commit/611d04eaaa7c0a8ab75a91b6e9c4599cb6afd29d)]
- ⚡ Make submitting a participant a bit faster [[e06c55c](https://github.com/lukevella/Rallly/commit/e06c55c1313bf34d85d69a75736809e7f68d7637)]

### Fixed

- 🐛 Fix crash in week view ([#549](https://github.com/lukevella/Rallly/issues/549)) [[1d31a42](https://github.com/lukevella/Rallly/commit/1d31a42bb9f4b8845d7873ff4d07b23b5fde21b7)]
- 🐛 Fix crowdin integration [[9fe794a](https://github.com/lukevella/Rallly/commit/9fe794a9e454b64e8edc530103c3995f905d2c98)]

### Miscellaneous

- 🌐 Update translations ([#542](https://github.com/lukevella/Rallly/issues/542)) [[b4ef1ed](https://github.com/lukevella/Rallly/commit/b4ef1eda3a3820ec07a1954e068d2b7d45afbf03)]
- Fix mobile styles ([#550](https://github.com/lukevella/Rallly/issues/550)) [[cb1fb23](https://github.com/lukevella/Rallly/commit/cb1fb23b194c7f62bbade091249c97c4fcaa7106)]
- 📝 Update README.md [[58fa0cb](https://github.com/lukevella/Rallly/commit/58fa0cb10db4a91e2d61c441b2eebf3b5f299dc2)]
- 🌐 Update translations [[a0a84fd](https://github.com/lukevella/Rallly/commit/a0a84fd5b659b3f99a3333a9c4779bf359faf44c)]
- 🌐 Update translations ([#538](https://github.com/lukevella/Rallly/issues/538)) [[899c890](https://github.com/lukevella/Rallly/commit/899c890b09064132748f489a517b7eb382d2f1b2)]

<a name="2.2.3"></a>

## 2.2.3 (2023-03-06)

### Added

- 👷‍♂️ Fix Dockerfile build [[76f1a08](https://github.com/lukevella/Rallly/commit/76f1a089f6a27921caa00b2b6bed5377dc4cd1b0)]

<a name="2.2.2"></a>

## 2.2.2 (2023-03-06)

### Fixed

- 🐛 Fix wrong scope used in Dockerfile [[4a4eec1](https://github.com/lukevella/Rallly/commit/4a4eec1a0b8495e58cf855267b71d8b410f607c7)]

<a name="2.2.1"></a>

## 2.2.1 (2023-03-06)

### Added

- 👷‍♂️ Fix docker image build workflow [[c31c5ab](https://github.com/lukevella/Rallly/commit/c31c5abe769231378d9ba72a189e43ea166958e6)]
- ✨ Allow participant to enter email to receive edit link ([#534](https://github.com/lukevella/Rallly/issues/534)) [[0ac3c95](https://github.com/lukevella/Rallly/commit/0ac3c95755f9eda53b5af09259b710f6f231910e)]
- ✨ Updated workflow for adding and updating participants ([#500](https://github.com/lukevella/Rallly/issues/500)) [[5d7db84](https://github.com/lukevella/Rallly/commit/5d7db848b81996ba98763979fe0bd7e13997e29b)]

### Changed

- ♻️ Refactor email templating code ([#533](https://github.com/lukevella/Rallly/issues/533)) [[309cb10](https://github.com/lukevella/Rallly/commit/309cb109aab819b725dab90278d1bffb4e1bab22)]
- ♻️ Switch to turborepo ([#532](https://github.com/lukevella/Rallly/issues/532)) [[0a836ae](https://github.com/lukevella/Rallly/commit/0a836aeec796e645d1d4eab2fedd6eba0cf028e3)]
- ♻️ Use built-in next/font instead of @next/font [[6682c53](https://github.com/lukevella/Rallly/commit/6682c5347f739579ee69879595f87e621cabbd7d)]
- ♻️ Update trpcs routes ([#531](https://github.com/lukevella/Rallly/issues/531)) [[18eca7c](https://github.com/lukevella/Rallly/commit/18eca7cd8c82cb67e5867979180ec4357b5a195b)]
- 🚸 Improve time slot start times ([#519](https://github.com/lukevella/Rallly/issues/519)) [[da895c1](https://github.com/lukevella/Rallly/commit/da895c14953f38ff20370a145c68d0d74e475901)]
- 💬 Update submit button text ([#522](https://github.com/lukevella/Rallly/issues/522)) [[d66663a](https://github.com/lukevella/Rallly/commit/d66663a1f1210b4211ef43bb5f613c7fd7d5a1dd)]
- 🎨 Get urlId during ssr ([#521](https://github.com/lukevella/Rallly/issues/521)) [[4ee3d7c](https://github.com/lukevella/Rallly/commit/4ee3d7cc8b21c2a0cf5466bd61abca6bac4dba17)]
- ⚡ Lazy load animation library to help reduce bundle size ([#502](https://github.com/lukevella/Rallly/issues/502)) [[696cd44](https://github.com/lukevella/Rallly/commit/696cd44ba1f657283d05cfeeaa78b9e2dd58fa28)]
- ⚡ Use nextjs layout feature [[c2c000f](https://github.com/lukevella/Rallly/commit/c2c000f77068e9d5b8c1f5fca45b3ada034e0b41)]
- 💄 Fix margin on admin controls [[02ef900](https://github.com/lukevella/Rallly/commit/02ef9000a768c7de48e78802b25135f282376351)]
- 🔧 Add &#x60;LANDING_PAGE&#x60; config option [[a661630](https://github.com/lukevella/Rallly/commit/a661630e1f9ea0b434f925eb5d381790e41a0264)]

### Removed

- 🔥 Remove page animations [[ecd63ae](https://github.com/lukevella/Rallly/commit/ecd63aea48d8477ae650880ee45a628cc0f93cc4)]

### Fixed

- 🐛 Fix framer motion missing layout animations [[aab9995](https://github.com/lukevella/Rallly/commit/aab999598ee3d4c5433835277ced3a342f5feb01)]
- 🐛 Prevent form submission when poll is locked [[e96c31b](https://github.com/lukevella/Rallly/commit/e96c31b9c94b8d65db41559772f72a7bc179b476)]

### Security

- 🔒 Bump json5 from 1.0.1 to 1.0.2 ([#523](https://github.com/lukevella/Rallly/issues/523)) [[78f3640](https://github.com/lukevella/Rallly/commit/78f36400361b4339f01dc24ef2dfe2c9dd87bc30)]

### Miscellaneous

- 📝 Fix broken links in README [[6636101](https://github.com/lukevella/Rallly/commit/66361013b4ba6a2c66a2ddd5fb9efbc2844638e3)]
- 📦 Bump prisma version [[41ef81a](https://github.com/lukevella/Rallly/commit/41ef81aa7520dbbad806dc5a4039f8a7e962b90b)]
- fix: upgrade posthog-js from 1.40.2 to 1.42.3 ([#529](https://github.com/lukevella/Rallly/issues/529)) [[d9f6a0d](https://github.com/lukevella/Rallly/commit/d9f6a0d0979ee01e450bcefe1fccf643ab6f2540)]
- fix: upgrade react-i18next from 12.0.0 to 12.1.4 ([#513](https://github.com/lukevella/Rallly/issues/513)) [[1816f92](https://github.com/lukevella/Rallly/commit/1816f9296b177b81be4e313f79e26ede22fcdc50)]
- fix: upgrade @svgr/webpack from 6.2.1 to 6.5.1 ([#512](https://github.com/lukevella/Rallly/issues/512)) [[584fc85](https://github.com/lukevella/Rallly/commit/584fc85297ab478439ad57f6198ac47b640d7d26)]
- fix: upgrade superjson from 1.9.1 to 1.12.2 ([#511](https://github.com/lukevella/Rallly/issues/511)) [[057482b](https://github.com/lukevella/Rallly/commit/057482bb803c303958d1ca093118135b3801beeb)]
- fix: upgrade @next/font from 13.1.3 to 13.1.4 ([#514](https://github.com/lukevella/Rallly/issues/514)) [[f04bd65](https://github.com/lukevella/Rallly/commit/f04bd657f1b76cd61f719f496b36f1b2840516af)]
- 📦 Update next version ([#524](https://github.com/lukevella/Rallly/issues/524)) [[84fdde6](https://github.com/lukevella/Rallly/commit/84fdde6c2959921eed60a7a9ddbf3be3cd1d5506)]
- 🚧 Add more info about giving feedback in the open beta environment ([#508](https://github.com/lukevella/Rallly/issues/508)) [[ce3e554](https://github.com/lukevella/Rallly/commit/ce3e5540db07b065a7b4438243e3d4310ca2a21c)]
- 📦 Upgrade @tanstack/react-query from 4.16.1 to 4.22.0 ([#504](https://github.com/lukevella/Rallly/issues/504)) [[9586a07](https://github.com/lukevella/Rallly/commit/9586a072d48815cc991d795c124d2369d88d0f94)]
- 📦 Upgrade @headlessui/react from 1.6.6 to 1.7.7 ([#505](https://github.com/lukevella/Rallly/issues/505)) [[d33d05c](https://github.com/lukevella/Rallly/commit/d33d05ca5a6c9160656c45f7cab80dfad5efca2b)]
- 📦 Upgrade nodemailer from 6.7.2 to 6.9.0 ([#506](https://github.com/lukevella/Rallly/issues/506)) [[a60d5bf](https://github.com/lukevella/Rallly/commit/a60d5bfd98f7bc706dd8747612d1a72f4982566c)]
- 📦 Upgrade iron-session from 6.1.3 to 6.3.1 ([#507](https://github.com/lukevella/Rallly/issues/507)) [[7f76a25](https://github.com/lukevella/Rallly/commit/7f76a256424be52ef5c6c6aa50e0571db4e5f13e)]
- 🚩 Add badge when in beta environment [[e0f4ae1](https://github.com/lukevella/Rallly/commit/e0f4ae1f45118b6e3838470bc4ed818dc725d42b)]
- 📦 Update prisma ([#501](https://github.com/lukevella/Rallly/issues/501)) [[bac7db5](https://github.com/lukevella/Rallly/commit/bac7db54f257a8990edbdbca5bb3a7b8b3384507)]

<a name="2.1.1"></a>

## 2.1.1 (2023-02-08)

### Changed

- 💄 Increase participant page max width [[4811fbe](https://github.com/lukevella/Rallly/commit/4811fbe1ddd0250a74074404309fb01cdca0f2d4)]
- 💄 Bring back showing the day of the week for date options ([#499](https://github.com/lukevella/Rallly/issues/499)) [[0d805c8](https://github.com/lukevella/Rallly/commit/0d805c8316a08cc5a85f9dd88f5606fb09738399)]

### Fixed

- ✏️ Fix typo in release workflow [[3d8a8e8](https://github.com/lukevella/Rallly/commit/3d8a8e868a616297dfbe6d11c697dc794bf30ace)]

### Miscellaneous

- 👷 Update CI badge to show status of main branch [[f965d14](https://github.com/lukevella/Rallly/commit/f965d14ee044c6771406bbc2bc99d61d3de8af6e)]
- 👷 Trigger CI when we push to main [[13726f4](https://github.com/lukevella/Rallly/commit/13726f46d69bf7dedc85b357f8b60e7257e8a5fb)]
- 👷 Add trigger to deploy on version release [[e0dfb52](https://github.com/lukevella/Rallly/commit/e0dfb527ab81385ca05ed6e7dd0acdca0ead9b7e)]
- 📦 Bump tailwind dependencies ([#497](https://github.com/lukevella/Rallly/issues/497)) [[fc7a2b8](https://github.com/lukevella/Rallly/commit/fc7a2b8390c7980cb01dd699269f678f701c7489)]

<a name="2.1.0"></a>

## 2.1.0 (2023-02-08)

### Added

- ✨ Improve usability of mobile poll ([#486](https://github.com/lukevella/Rallly/issues/486)) [[8c74836](https://github.com/lukevella/Rallly/commit/8c74836de139e627574517bcd780724f1d026946)]

### Changed

- 🔧 Increase timeout when install dependencies [[bcf4e0b](https://github.com/lukevella/Rallly/commit/bcf4e0be6b7650f170cff9df2f1a2a2968b89698)]
- 🔧 Update crowdin config [[c20002e](https://github.com/lukevella/Rallly/commit/c20002ebfe1c1874568bad68f3ad144c33820361)]
- 💬 New translations app.json (Swedish) ([#487](https://github.com/lukevella/Rallly/issues/487)) [[f6d3aed](https://github.com/lukevella/Rallly/commit/f6d3aed272290d83a2373331955f81ff895b123c)]

### Miscellaneous

- 📦 Upgrade framer-motion from 6.3.11 to 6.5.1 ([#496](https://github.com/lukevella/Rallly/issues/496)) [[281f1d6](https://github.com/lukevella/Rallly/commit/281f1d6c0dd8323c9b81daa5d824640edb580ff7)]
- 📦 Upgrade autoprefixer from 10.4.2 to 10.4.13 ([#495](https://github.com/lukevella/Rallly/issues/495)) [[e3ad665](https://github.com/lukevella/Rallly/commit/e3ad66593c19952854a20069dda0e23d2a497d4a)]
- 📦 Upgrade react-hook-form from 7.39.3 to 7.42.1 ([#493](https://github.com/lukevella/Rallly/issues/493)) [[6095d1d](https://github.com/lukevella/Rallly/commit/6095d1db8cc025bc25f386be266db48343913cfc)]
- 🌐 Update Swedish translations (app.json) ([#488](https://github.com/lukevella/Rallly/issues/488)) [[bb54e49](https://github.com/lukevella/Rallly/commit/bb54e49ce760690c993a76315471c9420e67e80e)]
- 👷 Add major version tag to docker [[b643652](https://github.com/lukevella/Rallly/commit/b6436524b596510cffb3273ae04650d8d14ad1d6)]

<a name="2.0.0"></a>

## 2.0.0 (2023-02-06)

This is the first version release of Rallly!

### Changed

- 🚚 Move scripts to scripts folder [[3c80eca](https://github.com/lukevella/Rallly/commit/3c80ecacf372410a49b84fae1b43c9620b066567)]

### Miscellaneous

- 👷 Add release script [[5dba8b0](https://github.com/lukevella/Rallly/commit/5dba8b04482a1ce86d8fa9b29fef7883047e5833)]
- 👷 Prepare docker workflow for versioned releases [[8465cfe](https://github.com/lukevella/Rallly/commit/8465cfe6c287a57838ffbc19d0e61f0f1130577c)]
- 👷 Add release workflow [[f0eabd8](https://github.com/lukevella/Rallly/commit/f0eabd82c3fbd91bce2a49c9a2ad5fde5812d977)]
