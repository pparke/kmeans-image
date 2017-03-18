import 'babel-polyfill';
import Kmeans from './Kmeans';

import {  createCanvas,
          loadImage,
          crosshair,
          swatch,
          coordsToOffset,
          onLoad,
          createDropzone,
          onlyListenToDropEventsFrom
        } from './util';

const state = {
  WIDTH: 500,
  kmeans: new Kmeans(),
  K: 10,
  iterations: 5,
  filename: '',
  stop: false,
};

onLoad(setupListeners.bind(null, state));

function run(state) {
  setupCanvases(state).then(setupKmeans).then(main);
}

/**
 * setupListeners
 * Sets listeners for various UI events including the k-value
 * and iterations inputs, the restart and stop buttons, and
 * sets up the dropzone
 *
 * @returns {undefined}
 */
function setupListeners(state) {
  const dropzoneId = 'drop-zone';

  onlyListenToDropEventsFrom([dropzoneId]);

  // load the image when it is dropped
  // document.getElementById(dropzoneId)
  createDropzone(document.body, (filename) => {
    state.filename = filename;
    load(state);
    run(state);
  });

  document.getElementById('k-value').onchange = (e) => {
    state.K = parseInt(e.target.value, 10);
  };

  document.getElementById('iterations').onchange = (e) => {
    state.iterations = parseInt(e.target.value, 10);
  };

  // remove the previous canvases on restart and load the file again
  document.getElementById('restart').onclick = () => {
    state.stop = false;
    load(state);
    run(state);
  };

  document.getElementById('stop').onclick = () => {
    document.getElementById('stop').disabled = true;
    state.stop = true;
  };
}

/**
 * load
 * Removes any existing canvases, disables buttons, hides the drop
 * zone and runs setupCanvases followed by setupKmeans and then main
 *
 * @param {string} file - the url of the image file
 * @returns {undefined}
 */
function load(state) {
  const canvasContainer = document.getElementById('canvas-container');
  while (canvasContainer.firstChild) {
    canvasContainer.removeChild(canvasContainer.firstChild);
  }
  document.getElementById('restart').disabled = false;
  document.getElementById('stop').disabled = false;
  document.getElementById('drop-zone').style = 'display: none';
}

/**
 * setupCanvases
 * Loads the image and creates one canvas to display the original and
 * a second to display the result. Draws the original image to the
 * first canvas.
 *
 * @param file='img/nic_cage.jpg'
 * @returns {object} - contains the two canvas contexts
 */
async function setupCanvases(state) {
  const img = await loadImage(state.filename);
  state.HEIGHT = state.WIDTH * (img.height / img.width);
  const canvasContainer = document.getElementById('canvas-container');
  const ctx = createCanvas(state.WIDTH, state.HEIGHT, canvasContainer);
  ctx.canvas.id = 'source-canvas';
  const ctx2 = createCanvas(state.WIDTH, state.HEIGHT, canvasContainer);
  ctx2.canvas.id = 'dest-canvas';

  ctx.drawImage(img, 0, 0, state.WIDTH, state.HEIGHT);
  ctx2.drawImage(img, 0, 0, state.WIDTH, state.HEIGHT);

  state.ctx = ctx;
  state.ctx2 = ctx2;

  return state;
}

/**
 * setupKmeans
 *
 * @returns {Canvas Context 2D}
 */
function setupKmeans(state) {
  const observations = state.ctx.getImageData(0, 0, state.WIDTH, state.HEIGHT).data;

  state.kmeans.init(state.K, observations, state.WIDTH);
  state.kmeans.run(state.iterations);

  return state;
}

/**
 * main
 * The main drawing loop, steps the kmeans function forward and updates the
 * image data with the new color values and then draws to the display canvas
 *
 * @returns {undefined}
 */
async function main(state) {

  const centroid = await state.kmeans.step();
  if (!state.kmeans.done && !state.stop) {
		// call this function again
    setTimeout(main.bind(null, state), 50);
  }

  const imageData = state.ctx2.getImageData(0, 0, state.WIDTH, state.HEIGHT);
  const data = imageData.data;
  const r = Math.floor(centroid.r);
  const g = Math.floor(centroid.g);
  const b = Math.floor(centroid.b);
  for (const point of centroid.cluster) {
    const i = coordsToOffset(point.x, point.y, state.WIDTH) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
	// draw the new centroid data to the canvas
  state.ctx2.putImageData(imageData, 0, 0);
}

function drawSwatches(ctx, centroids) {
  for (const centroid of centroids) {
    const color = { r: Math.floor(centroid.r), g: Math.floor(centroid.g), b: Math.floor(centroid.b), a: 1 };
    const rect = { x: centroid.x + 10, y: centroid.y + 10, w: 20, h: 20 };
    swatch(ctx, color, rect);
  }
}
