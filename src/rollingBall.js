import isAnyArray from 'is-any-array';
import max from 'ml-array-max';
import min from 'ml-array-min';

/**
 * Rolling ball baseline correction algorithm.
 * From the abstract of (1):
 * "This algorithm behaves equivalently to traditional polynomial backgrounds in simple spectra,
 * [...] and is considerably more robust for multiple overlapping peaks, rapidly varying background [...]
 *
 * The baseline is the trace one gets by rolling a ball below a spectrum. Algorithm has three steps:
 * Finding the minima in each window, find maxima among minima and then smooth over them by averaging.
 *
 * Reference:
 * (1) Kneen, M. A.; Annegarn, H. J.
 *     Algorithm for Fitting XRF, SEM and PIXE X-Ray Spectra Backgrounds.
 *     Nuclear Instruments and Methods in Physics Research Section B: Beam Interactions with Materials and Atoms 1996, 109–110, 209–213.
 *     https://doi.org/10.1016/0168-583X(95)00908-6.
 * (2) Kristian Hovde Liland, Bjørn-Helge Mevik, Roberto Canteri: baseline.
 *     https://cran.r-project.org/web/packages/baseline/index.html
 * @export
 * @param {Array} spectrum
 * @param {Number} [options.windowM]: width of local window for minimization/maximization, defaults to 4% of the spectrum length
 * @param {Number} [options.windowS]: width of local window for smoothing, defaults to 8% of the specturm length
 */
export function rollingBall(spectrum, options = {}) {
  if (!isAnyArray(spectrum)) {
    throw new Error('Spectrum must be an array');
  }

  if (spectrum.length === 0) {
    throw new TypeError('Spectrum must not be empty');
  }

  const numberPoints = spectrum.length;
  const maxima = new Float64Array(numberPoints);
  const minima = new Float64Array(numberPoints);
  const baseline = new Float64Array(numberPoints);

  // windowM 4 percent of spectrum length
  // windowS 8 percent of spectrum length

  const {
    windowM = Math.round(numberPoints * 0.04),
    windowS = Math.round(numberPoints * 0.04),
  } = options;

  /* Find the minima */
  let u1 = Math.ceil((windowM + 1) / 2);
  let u2 = 0;

  minima[0] = min(spectrum, { fromIndex: 0, toIndex: u1 + 1 });
  /* Start of spectrum */
  for (let i = 1; i < windowM; i++) {
    u2 = u1 + 1 + ((i + 1) % 2);
    minima[i] = Math.min(
      min(spectrum, { fromIndex: u1 + 1, toIndex: u2 + 1 }),
      minima[i - 1],
    );
    u1 = u2;
  }

  /* Main part of spectrum */
  for (let j = windowM; j < numberPoints - windowM; j++) {
    if (
      spectrum[u1 + 1] <= minima[j - 1] &&
      spectrum[u1 - windowM] !== minima[j - 1]
    ) {
      minima[j] = spectrum[u1 + 1];
    } else {
      minima[j] = min(spectrum, {
        fromIndex: j - windowM,
        toIndex: j + windowM + 1,
      });
    }
    u1 = u1 + 1;
  }
  u1 = numberPoints - 2 * windowM - 2;

  /* End part of spectrum */
  for (let k = numberPoints - windowM; k < numberPoints; k++) {
    u2 = u1 + 1 + (k % 2);
    if (min(spectrum, { fromIndex: u1, toIndex: u2 }) > minima[k - 1]) {
      minima[k] = minima[k - 1];
    } else {
      minima[k] = min(spectrum, { fromIndex: u2, toIndex: numberPoints - 1 });
    }
    u1 = u2;
  }

  /* Maximization */
  u1 = Math.ceil((windowM + 1) / 2);
  maxima[0] = max(minima, { fromIndex: 0, toIndex: u1 + 1 });

  /* Start of spectrum */
  for (let i = 1; i < windowM; i++) {
    u2 = u1 + 1 + ((i + 1) % 2);
    maxima[i] = Math.max(
      max(minima, { fromIndex: u1 + 1, toIndex: u2 + 1 }),
      maxima[i - 1],
    );
    u1 = u2;
  }

  /* Main part of spectrum */
  for (let j = windowM; j < numberPoints - windowM; j++) {
    if (
      minima[u1 + 1] >= maxima[j - 1] &&
      minima[u1 - windowM] !== maxima[j - 1]
    ) {
      maxima[j] = minima[u1 + 1];
    } else {
      maxima[j] = max(minima, {
        fromIndex: j - windowM,
        toIndex: j + windowM + 1,
      });
    }
    u1 += 1;
  }

  /* End part of spectrum */
  u1 = numberPoints - 2 * windowM - 2;
  for (let k = numberPoints - windowM; k < numberPoints; k++) {
    u2 = u1 + 1 + (k % 2);
    if (max(minima, { fromIndex: u1, toIndex: u2 }) < maxima[k - 1]) {
      maxima[k] = maxima[k - 1];
    } else {
      maxima[k] = max(minima, {
        fromIndex: u2,
        toIndex: numberPoints - 1,
      });
    }
    u1 = u2;
  }

  /* Now, averaging to smooth */
  /* start of spectrum */
  u1 = Math.ceil(windowS / 2) - 1;
  let v = maxima.slice(0, u1 + 1).reduce((a, b) => a + b, 0);

  for (let i = 0; i < windowS; i++) {
    u2 = u1 + 1 + ((i + 1) % 2);
    v += maxima.slice(u1 + 1, u2 + 1).reduce((a, b) => a + b, 0);
    baseline[i] = v / u2;
    u1 = u2;
  }

  /* middle of spectrum */
  v = maxima.slice(0, windowS * 2 + 1).reduce((a, b) => a + b, 0);
  baseline[windowS] = v / (2 * windowS + 1);
  for (let j = windowS + 1; j < numberPoints - windowS; j++) {
    v = v - maxima[j - windowS - 1] + maxima[j + windowS];
    baseline[j] = v / (2 * windowS + 1);
  }

  u1 = numberPoints - 2 * windowS;
  v -= maxima[u1];
  baseline[numberPoints - windowS] = v / (2 * windowS);

  /* Finally, end of the spectrum */

  for (let k = numberPoints - windowS + 1; k < numberPoints; k++) {
    u2 = u1 + 1 + (k % 2);
    v -= maxima.slice(u1, u2).reduce((a, b) => a + b, 0);
    baseline[k] = v / (numberPoints - u2 + 1);
    u1 = u2;
  }

  return baseline;
}
