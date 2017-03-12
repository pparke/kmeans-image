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

const WIDTH = 500;
const kmeans = new Kmeans();
let K = 10;
let iterations = 5;
let filename;
let stop = false;

onLoad(setupListeners);

function setupListeners() {
  const dropzoneId = 'drop-zone';

  onlyListenToDropEventsFrom([dropzoneId]);

  // load the image when it is dropped
  // document.getElementById(dropzoneId)
  createDropzone(document.body, load);

  document.getElementById('k-value').onchange = (e) => {
    K = parseInt(e.target.value, 10);
  };

  document.getElementById('iterations').onchange = (e) => {
    iterations = parseInt(e.target.value, 10);
  };

  // remove the previous canvases on restart and load the file again
  document.getElementById('restart').onclick = () => {
    stop = false;
    load(filename);
  };

  document.getElementById('stop').onclick = () => {
    document.getElementById('stop').disabled = true;
    stop = true;
  };
}

function load(file) {
  const canvasContainer = document.getElementById('canvas-container');
  while (canvasContainer.firstChild) {
    canvasContainer.removeChild(canvasContainer.firstChild);
  }
  document.getElementById('restart').disabled = false;
  document.getElementById('stop').disabled = false;
  filename = file;
  document.getElementById('drop-zone').style = 'display: none';

  setupCanvases(file).then(setupKmeans).then(main);
}

async function setupCanvases(file = 'img/nic_cage.jpg') {
  const img = await loadImage(file);
  const HEIGHT = WIDTH * (img.height / img.width);
  const canvasContainer = document.getElementById('canvas-container');
  const ctx = createCanvas(WIDTH, HEIGHT, canvasContainer);
  ctx.canvas.id = 'source-canvas';
  const ctx2 = createCanvas(WIDTH, HEIGHT, canvasContainer);
  ctx2.canvas.id = 'dest-canvas';

  ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);

  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

  return { ctx, ctx2, HEIGHT, imageData };
}

function setupKmeans({ ctx, ctx2, HEIGHT, imageData }) {
  const observations = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;

  kmeans.init(K, observations, WIDTH);
  kmeans.run(iterations);

  return { kmeans, ctx: ctx2, imageData, width: WIDTH };
}

async function main({ ctx, imageData, width }) {
  const data = imageData.data;

  const centroid = await kmeans.step();
  if (!kmeans.done && !stop) {
    setTimeout(main.bind(null, { kmeans, ctx, imageData, width }), 50);
  }
  else {
    // drawSwatches(ctx, kmeans.centroids);
    return;
  }
  const r = Math.floor(centroid.r);
  const g = Math.floor(centroid.g);
  const b = Math.floor(centroid.b);
  for (const point of centroid.cluster) {
    const i = coordsToOffset(point.x, point.y, width) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ctx.putImageData(imageData, 0, 0);

}

function drawSwatches(ctx, centroids) {
  for (const centroid of centroids) {
    const color = { r: Math.floor(centroid.r), g: Math.floor(centroid.g), b: Math.floor(centroid.b), a: 1 };
    const rect = { x: centroid.x + 10, y: centroid.y + 10, w: 20, h: 20 };
    swatch(ctx, color, rect);
  }
}
