# Changelog

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
