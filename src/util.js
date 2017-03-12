
export function createCanvas(width, height, elem) {
  elem = elem || document.body;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  elem.appendChild(canvas);
  return ctx;
}

export function loadImage(src) {
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = src;
  });
}

export function crosshair(ctx, point) {
  const arms = {
    top: {
      begin: { x: 0, y: -2 },
      end: { x: 0, y: -6 }
    },
    bottom: {
      begin: { x: 0, y: 2 },
      end: { x: 0, y: 6 }
    },
    left: {
      begin: { x: -2, y: 0 },
      end: { x: -6, y: 0 }
    },
    right: {
      begin: { x: 2, y: 0 },
      end: { x: 6, y: 0 }
    },
  };

  for (const arm of Object.values(arms)) {
    ctx.beginPath();
    ctx.moveTo(point.x + arm.begin.x, point.y + arm.begin.y);
    ctx.lineTo(point.x + arm.end.x, point.y + arm.end.y);
    ctx.closePath();
    ctx.stroke();
  }
}

export function swatch(ctx, color, rect) {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function coordsToOffset(x, y, width) {
  return (x + (y * width));
}

export function offsetToCoords(i, width) {
  const x = i % width;
  const y = Math.floor(i / width);
  return { x, y };
}

export function randomNext(arr) {
  let indices = Array.from({ length: arr.length }, (v, i) => i);
  return function next() {
    const i = Math.floor(Math.random() * indices.length);
    const index = indices.splice(i, 1);
    if (indices.length === 0) {
      indices = Array.from({ length: arr.length }, (v, j) => j);
    }
    return arr[index];
  };
}

export function onLoad(fn) {
  if (window.addEventListener) {
    window.addEventListener('load', fn, false);
  }
  else if (window.attachEvent) {
    window.attachEvent('onload', fn);
  }
  else {
    window.onload = fn;
  }
}

export function waitFor(ids) {
  return new Promise(function(resolve, reject) {
    const observer = new MutationObserver(function(mutations, self) {
      const allPresent = ids.map(id => document.getElementById(id))
      .map(elem => {
        console.log(elem, ids);
        return elem;
      })
      .every(elem => !!elem);
      if (allPresent) {
        console.log('all loaded');
        self.disconnect();
        resolve();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });
  });
}

export function createDropzone(elem, cb) {
  elem.addEventListener('dragover', handleDragOver, false);
  elem.addEventListener('drop', (e) => handleFileSelect(e, cb), false);
}

export function handleFileSelect(evt, cb) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.setData('text/plain', null);

  const file = evt.dataTransfer.files[0];

  if (!file.type.match('image.*')) {
    return;
  }

  const reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = (function(theFile) {
    return function(e) {
      cb(e.target.result);
    };
  })(file);

  reader.readAsDataURL(file);
}

export function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

export function onlyListenToDropEventsFrom(elems) {
  window.addEventListener('dragenter', function(e) {
    if (!elems.includes(e.target.id)) {
      e.preventDefault();
      e.dataTransfer.effectAllowed = 'none';
      e.dataTransfer.dropEffect = 'none';
    }
  }, false);

  window.addEventListener('dragover', function(e) {
    if (!elems.includes(e.target.id)) {
      e.preventDefault();
      e.dataTransfer.effectAllowed = 'none';
      e.dataTransfer.dropEffect = 'none';
    }
  });

  window.addEventListener('drop', function(e) {
    if (!elems.includes(e.target.id)) {
      e.preventDefault();
      e.dataTransfer.effectAllowed = 'none';
      e.dataTransfer.dropEffect = 'none';
    }
  });
}
