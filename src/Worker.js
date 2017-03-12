
const handler = {
  construct(target, args) {
    // get the function scope as a string
    let body = args[0].toString().trim();
    // remove the enclosing function expression
    body = body.replace(/^function\s*\(\.*\)\s*{\n?/, '');
    // remove the terminating curly bracket
    body = body.replace(/}$/, '');

    // build the switch statement that will act as the interface based
    // on the names of the functions in the body
    const methods = /function\s+(\w+)\s*\(.*\)/g.exec(body).slice(1);
    const cases = methods.map(fn => {
      return `\n\tcase '${fn}':\n\t\tresult = ${fn}(...args);\n\t\tbreak;\n`;
    }).join('');

    // this is the original worker source
    let source = target.toString().trim();
    // remove the enclosing function
    source = source.replace(/^function\sonmessage\(\.*\)\s*{\n?/, '');
    source = source.replace(/}$/, '');
    // insert the cases after the opening of the switch statement
    source = source.replace(/switch\s*\(fn\)\s*{/, `$&${cases}`);

    source = 'function () {' + source + '}';
    // insert the body into the source after the opening function scope
    source = source.replace(/^function\s*\(\.*\)\s*{\n?/, `$&${body}`);

    const blob = new Blob([
      source.toString().replace(/^[^{]*{\s*([\d\D]*)\s*}[^}]*$/, '$1')
    ], { type: 'text/javascript' });

    const url = window.URL.createObjectURL(blob);
    const worker = new Worker(url);

    // this will hold the results of each method call keyed by method name
    worker.results = {};

    /**
     * This is the external onmessage event that will be able to interact
     * with the external properties of the worker object
     * @param {event} e - the message returned from the worker's context
     * @return {null}
     */
    worker.onmessage = function(e) {
      const key = e.data[0];
      const status = e.data[1];
      const results = e.data.slice(2);

      if (status === 'success') {
        return this.results[key].resolve(...results);
      }
      this.results[key].reject(results);
    };

    /**
      * create a function on the worker for each method specified in the
      * passed in function scope.  The method will return a promise that
      * resolves to the result of the internel method.  Each time the
      * method is invoked it overwrites the previous result
      */
    methods.reduce((wrkr, mthd) => {
      // this is the 'method' that will be called on the worker
      wrkr[mthd] = function(...args) {
        wrkr.results[mthd] = new (function() {
          this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
          });
        })();
        wrkr.postMessage([mthd, ...args]);
        return wrkr.results[mthd].promise;
      };
      return wrkr;
    }, worker);

    // return the newly constructed worker
    return worker;
  },
};

const onmessage = function() {
  self.onmessage = function(e) {
    if (!e.data) {
      return;
    }
    const fn = e.data[0];
    const args = e.data.slice(1);
    let result = null;
    try {
      switch(fn) {
        default:
        throw new Error('Unknown Function');
        break;
      }
    }
    catch (err) {
      self.postMessage([fn, 'error', `Failed to execute ${fn}`, err.name, err.message, err.lineNumber]);
      return;
    }
    self.postMessage([fn, 'success', result]);
  }
};

export default new Proxy(onmessage, handler);
