import Centroid from './Centroid';
import Observation from './Observation';
import { randomNext, offsetToCoords } from './util';

export default class Kmeans {
  init(K, observations, width) {
    this.teardown();
    this.K = K;
    this.observations = observations;
    this.width = width;
    this.clusters = this.createClusters(K);
    this.randomInitialization(this.clusters, observations, width);
    this.centroids = this.createCentroids(this.clusters);
    this.done = false;
  }

  teardown() {
    if (this.centroids) {
      this.centroids.forEach(c => c.worker.terminate());
    }
  }

  step() {
    if (this._gen && this._gen.next) {
      const result = this._gen.next();
      this.done = result.done;
      return result.value;
    }
    throw new Error('Kmeans does not have a generator yet, try calling run() first.');
  }

  run(iterations = 5) {
    this._gen = this._run(iterations);
  }

  *_run(iterations = 5) {
    let done = false;
    let count = 0;
    while (!done && count < iterations) {
      count++;
      // start the calculation on all workers in parallel
      const results = this.centroids.map(c => c.calculate());
      for (const result of results) {
        yield result;
      }
      done = this.assignment(this.clusters, this.centroids);
    }
  }

  createClusters(K) {
    const clusters = new Array(K);
    for (let i = 0; i < K; i++) {
      clusters[i] = new Set();
    }
    return clusters;
  }

  // assign each observation to a random group
  randomInitialization(clusters, observations, width) {
    const next = randomNext(clusters);
    for (let i = 0; i < observations.length; i += 4) {
      const [r, g, b] = observations.slice(i, i + 3);
      const { x, y } = offsetToCoords(i / 4, width);
      const ob = new Observation(r, g, b, x, y);
      const index = Math.floor(Math.random() * clusters.length);
      next().add(ob);
    }
  }

  createCentroids(clusters) {
    return clusters.map(c => new Centroid(c));
  }

  // move each observation to the nearest cluster
  assignment(clusters, centroids) {
    let done = true;
    for (const cluster of clusters) {
      for (const ob of cluster) {
        const nearest = Centroid.nearest(centroids, ob);
        if (!nearest.cluster.has(ob)) {
          nearest.cluster.add(ob);
          cluster.delete(ob);
          done = false;
        }
      }
    }
    return done;
  }
}
