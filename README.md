# rollingBallBaseline

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![npm download][download-image]][download-url]

Rolling ball baseline correction.

## Installation

`$ npm i ml-rollingBallBaseline`

## Usage

```js
import { rollingBall } from 'ml-rollingBallBaseline';

// you need to provide and array with the data and
// two numbers indicating the "size" of the balls,
// i.e., the maximization/minimization and the smoothing window.
const baseline = rollingBall(spectrum, 200, 400);
```

## [API Documentation](https://mljs.github.io/rollingBallBaseline/)

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ml-rollingBallBaseline.svg
[npm-url]: https://www.npmjs.com/package/ml-rollingBallBaseline
[ci-image]: https://github.com/mljs/rollingBallBaseline/workflows/Node.js%20CI/badge.svg?branch=master
[ci-url]: https://github.com/mljs/rollingBallBaseline/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/ml-rollingBallBaseline.svg
[download-url]: https://www.npmjs.com/package/ml-rollingBallBaseline
