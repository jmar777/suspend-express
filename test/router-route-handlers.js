var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	methods = require('methods'),
	suspendExpress = require('../'),
	patch = suspendExpress.patch,
	resume = suspendExpress.suspend.resume;

describe('router.route(path).VERB(fn*)', function() {
	it('should auto-wrap generator functions', function(done) {
		var app = express(),
			router = patch(express.Router());

		router.route('/').get(function*(req, res, next) {
			res.send('boom');
		});

		app.use('/test', router);

		request(app).get('/test')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'boom');
				done();
			});
	});

	it('should work with multiple middleware', function(done) {
		var app = express(),
			router = patch(express.Router());

		router.route('/').get(function*(req, res, next) {
			req.foo = 'bar';
			next();
		}, function*(req, res, next) {
			res.send(req.foo);
		});

		app.use('/test', router);

		request(app).get('/test')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'bar');
				done();
			});
	});

	it('should forward thrown errors', function(done) {
		var app = express(),
			router = patch(express.Router());

		router.route('/').get(function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use('/test', router);

		app.use(function(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});

		request(app).get('/test').end(noop);
	});
});

describe('router.del(path, fn*) alias', function() {
	it('should work', function(done) {
		var app = express(),
			router = express.Router();

		// app.del() is deprecated, so skip test if/when it's removed
		if (!router.del) return done();

		patch(router);

		router.del('/', function*(req, res, next) {
			res.send('deleted');
		});

		app.use('/test', router);

		request(app).delete('/test')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'deleted');
				done();
			});
	});
});

// todo: figure out why router.all(path, fn*) fails
methods.filter(function(method) {
	// todo: how do we test CONNECT requests?
	return method !== 'connect';
}).concat('all').forEach(function(method) {
	describe('router.' + method + '(path, fn*)', function() {
		it('should auto-wrap generator functions', function(done) {
			var app = express(),
				router = patch(express.Router());

			router[method]('/', function*(req, res, next) {
				res.send(method + ' successful');
			});

			app.use('/test', router);

			request(app)[method === 'all' ? 'get' : method]('/test')
				.end(function(err, res) {
					assert.ifError(err);
					assert.strictEqual(res.statusCode, 200);
					if (method !== 'head') {
						assert.strictEqual(res.text, method + ' successful');
					}
					done();
				});
		});

		it('should work with multiple middleware', function(done) {
			var app = express(),
				router = patch(express.Router());

			router[method]('/', function*(req, res, next) {
				req.foo = 'bar';
				next();
			},
			function*(req, res, next) {
				req.foo += 'baz';
				next();
			},
			function*(req, res, next) {
				res.send(req.foo);
			});

			app.use('/test', router);

			request(app)[method === 'all' ? 'get' : method]('/test')
				.end(function(err, res) {
					assert.ifError(err);
					assert.strictEqual(res.statusCode, 200);
					if (method !== 'head') {
						assert.strictEqual(res.text, 'barbaz');
					}
					done();
				});
		});

		it('should forward thrown errors', function(done) {
			var app = express(),
				router = patch(express.Router());

			router[method]('/', function*(req, res, next) {
				throw new Error('catch me');
			});

			app.use('/test', router);

			app.use(function(err, req, res, next) {
				assert.strictEqual(err.message, 'catch me');
				done();
			});

			request(app)[method === 'all' ? 'get' : method]('/test').end(noop);
		});
	});
});

function noop() {};
