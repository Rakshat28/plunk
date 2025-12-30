# Changelog

## [0.3.0](https://github.com/useplunk/plunk/compare/v0.2.0...v0.3.0) (2025-12-29)


### Features

* Ability to overwrite locale on contact level with locale key on data ([7615523](https://github.com/useplunk/plunk/commit/76155232a3383e75e8c7b44a498454b07472852a))
* Add additional banner and information about security metrics ([bc8611a](https://github.com/useplunk/plunk/commit/bc8611a66250eb7747e7acd6e882a740c0028ba1))
* Add bulk actions to contact overview ([726f667](https://github.com/useplunk/plunk/commit/726f66762b890c73041139432524d6c85d6bd709))
* Add email verification and password reset ([1a5607f](https://github.com/useplunk/plunk/commit/1a5607f2780d5a4692492032dd0cd2e7521362d9))
* Add email verification endpoint at /v1/verify ([6a9f6aa](https://github.com/useplunk/plunk/commit/6a9f6aa65a3219c5d4d6f33253cdcf145c3ff20b))
* Add plus address check to /v1/verify ([afc405e](https://github.com/useplunk/plunk/commit/afc405ec028ac9d7333a7817c49f1232278fc28b))
* Add project-scoped language for unsubscribe footer and contact-facing pages ([e1f8263](https://github.com/useplunk/plunk/commit/e1f826357d1e8cff7bd3c2811698734f578836f5))
* Allow to pick currency when starting subscription ([8a136dd](https://github.com/useplunk/plunk/commit/8a136dde55fd1fae1f2a2e285019beb35fc75977))
* Email preview in contact and activity feed ([72dffe1](https://github.com/useplunk/plunk/commit/72dffe12e53ff9d74ef43da2cf653d31e7a4df25))
* **i18n:** add German translations and update supported languages ([a6bd2e7](https://github.com/useplunk/plunk/commit/a6bd2e7dba261a858eab6ab1f782ddc9efb136a5))
* **i18n:** add Hindi translations for contact-facing pages ([ddc14ae](https://github.com/useplunk/plunk/commit/ddc14ae8534eda2e1368f148e0434388008bb7b5)), closes [#246](https://github.com/useplunk/plunk/issues/246)


### Bug Fixes

* Add styling for visual editor emails in preview ([5993b84](https://github.com/useplunk/plunk/commit/5993b842a0f17d66644aaa3057602ae8f3daebc2))
* Correctly reserve fields from being set on contact ([61cea95](https://github.com/useplunk/plunk/commit/61cea95697ccb56c525002b08f76bf57da896837))
* Date filtering not working properly for custom contact data ([97ab0a2](https://github.com/useplunk/plunk/commit/97ab0a2c2c811ac1b8a2b9039ab835e837a3f3be))
* Do not check verification if platform emails are not enabled ([9567144](https://github.com/useplunk/plunk/commit/9567144390512173f7f615db71368c1cd26d9f4d))
* Import no longer case-sensitive about email column ([451dd03](https://github.com/useplunk/plunk/commit/451dd0327f4866fd27343407a84a6c979cfcd70d))
* Pass through email verification if auth type is apiKey ([d7b5d3f](https://github.com/useplunk/plunk/commit/d7b5d3f60ed1af6ca9bf8e2a659204a01ca3acb0))
* Persistence of subscription state for existing contacts ([007a908](https://github.com/useplunk/plunk/commit/007a908e833cdd1b229f485c34c17c6510a55f9c))
* Properly tag events in SegmentFilterBuilder.tsx ([8f725c7](https://github.com/useplunk/plunk/commit/8f725c7c84749eca5647fdbd19d41260f6998d6e))
* Redirect verification link to dashboard instead of landing ([35f5275](https://github.com/useplunk/plunk/commit/35f5275d889b167e0fe75246b29a4ffa632bad46))
* Set auth type before disable check ([862babb](https://github.com/useplunk/plunk/commit/862babb8f5ab47599ce6a841fc988fafa1ec0bbe))
* Variable substitution in transactional emails ([8c03042](https://github.com/useplunk/plunk/commit/8c0304273c2bd1a64718ec56838632aa63447ef8))


### Documentation

* Add locale overwrite to project documentation ([1fc1e23](https://github.com/useplunk/plunk/commit/1fc1e23fce69a870ccf95faf2fff644733de7145))
* Add plus address check to /v1/verify ([0d54b1a](https://github.com/useplunk/plunk/commit/0d54b1a631415a15e504ff5bd4573ddb12cc421a))
* Improve docs with core-concept and guides ([2ddfcec](https://github.com/useplunk/plunk/commit/2ddfceca3606b0d4d832f83fce14c7277b5eaa35))
* Update openapi.json to match actual API outputs ([dc9b88d](https://github.com/useplunk/plunk/commit/dc9b88dedb75535814239b4bc73f62375570998b))

## [0.2.0](https://github.com/useplunk/plunk/compare/v0.1.1...v0.2.0) (2025-12-16)


### Features

* ability to create new campaigns based on templates or previous campaigns ([6b25bbe](https://github.com/useplunk/plunk/commit/6b25bbe2f86e5dd6946ea38a9f34e9c7bdb5fb0f))
* Add improved html editor using CodeMirror ([672f1e6](https://github.com/useplunk/plunk/commit/672f1e6657293860554be1f86167cf4f4403b0ff))
* Add security center and warning for exceeding bounce/complaint rates ([fbd3038](https://github.com/useplunk/plunk/commit/fbd303801f9f1c260c5f8201bf218c9f277fe4d1))
* Added platform emails for billing limits and disabled projects ([2485d2f](https://github.com/useplunk/plunk/commit/2485d2ff1db652e87f8f1307c8ef770edd19bbd1))
* Automatically detect rate limit from AWS with ability to override in .env ([3225c50](https://github.com/useplunk/plunk/commit/3225c5005be42f1443fdca0f8233193ce029c890))
* Improved createdAt and updatedAt visualisation ([1019ba0](https://github.com/useplunk/plunk/commit/1019ba0d82c7cb6a0d4cef5989841ccc28dae776))


### Bug Fixes

* ability to clear reply-to and from name from templates and campaigns ([badb035](https://github.com/useplunk/plunk/commit/badb035585561b276b6e82a363693918810c8214))
* Add additional checks for disabled projects ([863e784](https://github.com/useplunk/plunk/commit/863e784e1c806118204acb3ba489322fe51498ad))
* Add additional checks for disabled projects ([780741e](https://github.com/useplunk/plunk/commit/780741e37f7fec5b822b91c329ebe98428077ba0))
* add additional indexes on event model ([1cd89d1](https://github.com/useplunk/plunk/commit/1cd89d137511ed4a8ae932a10f4f21487fbcee7c))
* Allow changing audience type after creation of campaign ([85b9d7a](https://github.com/useplunk/plunk/commit/85b9d7afe718c803be147475d5fbe13dafd677bf))
* Better highlight warnings in SecurityWarningBanner.tsx ([91eb0f3](https://github.com/useplunk/plunk/commit/91eb0f3a699eb7a51e87addfa122107ce74b4a39))
* Clear notification cache keys when changing billing limits ([e50c33a](https://github.com/useplunk/plunk/commit/e50c33ae4b2d5144a1bfce72ae97d8ede0187d17))
* Correctly show recipient count during creation and edit ([d0191be](https://github.com/useplunk/plunk/commit/d0191be31da8fc894269851a247746ce39a958b2))
* custom relative time to shorten strings for better UI fit ([5e4adb7](https://github.com/useplunk/plunk/commit/5e4adb71ade38cf53e67776ae3524a381641fcfd))
* display email progress instead of scheduling progress for campaigns ([07f875c](https://github.com/useplunk/plunk/commit/07f875c18c03a8d1766040bc40034c1023715fcd))
* Hide upsell banner if billing is not configured ([433e796](https://github.com/useplunk/plunk/commit/433e796c041e8d65068084d5c7729c397956098e))
* Increase z-index of color picker ([769e374](https://github.com/useplunk/plunk/commit/769e3748a0bbbcafdb1f79c9aea22d282e39b513))
* Move react and react-dom to dependencies instead of peerDependency for API ([a555a12](https://github.com/useplunk/plunk/commit/a555a127366f753130c765f9eb4700dc44a8cb7c))
* Move react and react-dom to dependencies instead of peerDependency for API ([f37bfcc](https://github.com/useplunk/plunk/commit/f37bfccbc22a0c2672971ff0e174f49f31301876))
* Only check free tier limits if billing is enabled ([1713b23](https://github.com/useplunk/plunk/commit/1713b2398d5c238058639ac5a0d5cef916a7a1e8))
* Only fetch project members if project Id is defined ([5a0a41c](https://github.com/useplunk/plunk/commit/5a0a41c6bbbb9bd4eefd5ed62e02c0a7c00c1022))
* Overflow of inputs in email editor ([3336fa1](https://github.com/useplunk/plunk/commit/3336fa1e38a29d9c1f69c62259662b1ff2ba6e61))
* Prevent manual tracking of internal events that are automatically tracked ([f34052e](https://github.com/useplunk/plunk/commit/f34052ed73cd78db4e4bf39cab8740ce0b78e93c))
* prevent scheduling of campaign if billing limit reached ([a3bbb1e](https://github.com/useplunk/plunk/commit/a3bbb1ed64ba461cb2f7170c1929f68f22b5bb4d))
* show correct default value for placeholder ([04275e3](https://github.com/useplunk/plunk/commit/04275e3cf59f902d50acb84e756f1c7425171726))
* Unauthenticated users are redirected to login on subscribe/unsubscribe/manage pages ([11ef47b](https://github.com/useplunk/plunk/commit/11ef47b576ec39209f2b9726c1027d06f8bbc03a))
* Update recipient count on create/update of campaign ([ff5c79c](https://github.com/useplunk/plunk/commit/ff5c79cfcf0ac6b351af20345ec639110f206f4b))
* Verify if sending without tracking is possible in SESService ([68f9979](https://github.com/useplunk/plunk/commit/68f99798f8c5944c18b438329b961fdec955ecef))

## [0.1.1](https://github.com/useplunk/plunk/compare/v0.1.0...v0.1.1) (2025-12-08)


### Bug Fixes

* Add additional verification in Oauth controllers ([53ecda9](https://github.com/useplunk/plunk/commit/53ecda9f7a34111785ac3ea3af18cb33460a44af))
* add clear cache button on full-screen loader ([60804c1](https://github.com/useplunk/plunk/commit/60804c12b0b4c4c3ef97e730e4857d41fa1fd021))
* Dedicated token name for next version ([fc535a5](https://github.com/useplunk/plunk/commit/fc535a558fab28045dae9ce978f483e58c72a24f))
* only mark releases as latest ([9d8b4a5](https://github.com/useplunk/plunk/commit/9d8b4a59fbd42420bb595d2a44df93a29214121a))


### Documentation

* dynamic link to Docker Compose for self-hosting ([90f8170](https://github.com/useplunk/plunk/commit/90f8170efbad0cec981a24e7831840aac65d8d70))
* Update AWS setup docs ([f7ac25f](https://github.com/useplunk/plunk/commit/f7ac25f91f4e1dcce301fb325801a67f2a9dee07))

## [0.1.0](https://github.com/useplunk/plunk/compare/v0.0.1...v0.1.0) (2025-12-08)


### Features

* Added ability to overwrite sender mail and name for templates and campaigns ([f1d4d50](https://github.com/useplunk/plunk/commit/f1d4d5073ccd7ddceabfdbd268c5ff142480fb75))
* basic health-checks ([2e69173](https://github.com/useplunk/plunk/commit/2e69173d1378bec8296ce556499f71990ee92375))
* **dashboard:** add status filter for contacts ([45697cf](https://github.com/useplunk/plunk/commit/45697cf6b122266ec3ab35e51e064db48517448d))
* Email attachment support ([0e718d4](https://github.com/useplunk/plunk/commit/0e718d4dba1c8a258eb949cc0590ee14046c080a))
* Increase pagination limits to improve data display and update version to 1.2.1 ([4fe90ad](https://github.com/useplunk/plunk/commit/4fe90adf1e97c85afddeae0ad9e1ecc11dd0609b))
* Optimize data retrieval and add new indexes for performance improvements ([51b40cc](https://github.com/useplunk/plunk/commit/51b40cc06962ad98333a50ac7b4dbd82d8a3fe10))


### Bug Fixes

* Add fixed yarn version ([daa8285](https://github.com/useplunk/plunk/commit/daa8285af59c54c302b805e1d5afa0106567bbf4))
* Add fixed yarn version to Docker build ([ff5c6af](https://github.com/useplunk/plunk/commit/ff5c6af9d730a80d037a84454074dedda5709862))
* Add ref ([4c25a28](https://github.com/useplunk/plunk/commit/4c25a28d69f7f3719b1180924ef1c26958757ba5))
* Add target ([8ca5aea](https://github.com/useplunk/plunk/commit/8ca5aea0ea34f530595c7ec4e1f9b7514ba4e1a9))
* Added Migration ([e2d0d0e](https://github.com/useplunk/plunk/commit/e2d0d0eb0d2989e2668506c48fe55c0e41b29da3))
* Added try/catch to CRON ([c96a007](https://github.com/useplunk/plunk/commit/c96a0074f87f084801289cc9852f27221e4720e9))
* Check if APP_URI has https ([bad18ae](https://github.com/useplunk/plunk/commit/bad18ae559d582181d8c298f3c537c50b4b08851))
* clear Redis key on event deletion ([0ef39ce](https://github.com/useplunk/plunk/commit/0ef39ce3d2ad90be8e83ab97d5076f90642f3cc6))
* Correctly duplicate from ([111e054](https://github.com/useplunk/plunk/commit/111e054fe88997201ebf012602223c92f65d21a6))
* Force node-20 ([0b79bef](https://github.com/useplunk/plunk/commit/0b79bef2cb79cd3f8073884c9b84df733a696bad))
* incorrect domain verification records ([4bb38b9](https://github.com/useplunk/plunk/commit/4bb38b9f43cf495cf08ec6d95466e1b8cea409ce))
* incorrect schema in dashboard ([d69a57d](https://github.com/useplunk/plunk/commit/d69a57d71150e52e12cd1ed475dd16353d5ff9c1))
* move updating the contact to contacts controller ([7c8d3bb](https://github.com/useplunk/plunk/commit/7c8d3bb050fb0c35e0296eeb71d516f0c37329a2))
* Proper reset of contact ([7879e66](https://github.com/useplunk/plunk/commit/7879e6631e8a06020753d7a78583d4a1404b7684))
* refetch contact after awaiting triggers ([7202606](https://github.com/useplunk/plunk/commit/7202606aef0081a1e68f91df3b2e94e67e44ca39))
* refetch contact after awaiting triggers ([3f70be9](https://github.com/useplunk/plunk/commit/3f70be95dde80c04611089f66b1fcaa8eb30655e))
* Remove openssl install ([605a5a0](https://github.com/useplunk/plunk/commit/605a5a0abfbf0d11076440afc07d2f9b2d1ee071))
* return updated contact info ([115ac5f](https://github.com/useplunk/plunk/commit/115ac5fe6c87181fe33de367d88d01ef872ed2af))
* server crash in self-hosted instances ([ccb832d](https://github.com/useplunk/plunk/commit/ccb832d095de7d7b65ee07743ba8cf8025b86948))
* Show project `from` and `name` as backup ([d4bdcbf](https://github.com/useplunk/plunk/commit/d4bdcbf78ecfe7913128f8c5c90e36ee60eb6dca))
* Unlink domain properly executes ([f58149a](https://github.com/useplunk/plunk/commit/f58149a1b168cf931c2a2768345f2a8213fe27a1))
* Update yarn.lock ([ee1651e](https://github.com/useplunk/plunk/commit/ee1651e3902d879047082864a459ff63f7bee57d))
* Version ([5ca4567](https://github.com/useplunk/plunk/commit/5ca45677ffa181b9d288e42f69dc90a2498342af))
* Version ([3a5d05a](https://github.com/useplunk/plunk/commit/3a5d05a65ba38d4abe5f70be4fe1bd195290e055))
* Version ([42e865c](https://github.com/useplunk/plunk/commit/42e865ccbab7799c535a3c18ade4caddffd88f72))
* Version ([b742ab1](https://github.com/useplunk/plunk/commit/b742ab10eb34c52fbd9b9af32e36e3784c2d6fc8))


### Code Refactoring

* remove recipients from campaign data structure ([c40189e](https://github.com/useplunk/plunk/commit/c40189ebbdb80c7e24881191cb1b750d9faffbc1))
