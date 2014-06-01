var suspend = require('suspend'),
	methods = require('methods');

exports.suspend = suspend;

exports.patch = function patch(app) {
	if (!app) throw new Error('.patch() requires an express app');

	['use', 'param'].map(wrap.bind(null, app));

	// all route handlers run through the router
	var origLazyRouter = app.lazyrouter;
	app.lazyrouter = function lazyrouter() {
		origLazyRouter.apply(this, arguments);
		
		var origRoute = app._router.route;
		app._router.route = function route() {
			var ret = origRoute.apply(this, arguments);
			methods.forEach(wrap.bind(null, ret));
			return ret;
		};

		// patch is completed, so restore original version before the cops notice
		app.lazyrouter = origLazyRouter;
	};

	return app;
};

function wrap(obj, method) {
	var orig = obj[method];
	if (!orig) return orig;
	
	obj[method] = function() {
		return orig.apply(this, map(arguments, suspendifyArg));
	};
}

function suspendifyArg(fn) {
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

var map = Function.prototype.call.bind(Array.prototype.map);
