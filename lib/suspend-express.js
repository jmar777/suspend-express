var suspend = require('suspend'),
	methods = require('methods');

exports.suspend = suspend;

exports.patch = function(app) {
	if (!app) throw new Error('.patch() requires an express app');

	// wrap .get(), .post(), etc.
	methods.forEach(function(method) {
		app[method] = wrap(app, method);
	});

	// re-alias `delete`
	app.del = app.delete;

	// wrap .param()
	var origParam = app.param;
	app.param = function() {
		var args = slice(arguments).map(function(arg) {
			return isGeneratorFunction(arg) ? suspend.fn(arg) : arg;
		});
		return origParam.apply(app, args);
	};
};

function wrap(app, method) {
	var orig = app[method];
	if (!orig) return orig;
	
	return function(path) {
		// don't interfere with `app.get('key')` API
		if (arguments.length === 1 && method === 'get') {
			return orig.apply(app, arguments);
		}

		return orig.apply(app, slice(arguments).map(suspendify));
	};
}

function suspendify(fn) {
	if (!isGeneratorFunction(fn)) return fn;

	// express checks the function length to detect error-handling middleware
	// e.g., `function(error, req, res, next) {}`
	if (fn.length === 4) {
		return function(err, req, res, next) {
			suspend.async(fn)(err, req, res, next, function(err) {
				if (err) next(err);
			});
		};
	}

	return function(req, res, next) {
		suspend.async(fn)(req, res, next, function(err) {
			if (err) next(err);
		});
	};
}

// ht: Nathan Rajlich (@TooTallNate)
function isGeneratorFunction(obj) {
	return obj && obj.constructor
		&& 'GeneratorFunction' === obj.constructor.name;
}

var slice = Function.prototype.call.bind(Array.prototype.slice);
