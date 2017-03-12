import Worker from './Worker';

export default class Centroid {
  constructor(cluster) {
    this.cluster = cluster;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.x = 0;
    this.y = 0;
    this.worker = new Worker(function() {
      function mean(cluster) {
        const size = cluster.size;
        const o = { r: 0, g: 0, b: 0, x: 0, y: 0 };
        for (const ob of cluster) {
          o.r += ob.r / size;
          o.g += ob.g / size;
          o.b += ob.b / size;
          o.x += ob.x / size;
          o.y += ob.y / size;
        }
        return o;
      }
    });

    this.worker.onerror = (message, filename, line) => console.log(message, filename, line);
  }

  async calculate() {
    const vals = await this.worker.mean(this.cluster);
    this.r = vals.r;
    this.g = vals.g;
    this.b = vals.b;
    this.x = vals.x;
    this.y = vals.y;
    /*
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.x = 0;
    this.y = 0;
    const size = this.cluster.size;
    for (const ob of this.cluster) {
      this.r += ob.r / size;
      this.g += ob.g / size;
      this.b += ob.b / size;
      this.x += ob.x / size;
      this.y += ob.y / size;
    }
    */
    return this;
  }

  distance(ob) {
    const r = this.r - ob.r;
    const g = this.g - ob.g;
    const b = this.b - ob.b;
    const x = this.x - ob.x;
    const y = this.y - ob.y;
    return Math.hypot(r, g, b, x, y);
  }

  static nearest(centroids, ob) {
    return centroids.sort((a, b) => a.distance(ob) - b.distance(ob))[0];
  }
}
