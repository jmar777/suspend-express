var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	methods = require('methods'),
	suspendExpress = require('../'),
	patch = suspendExpress.patch,
	resume = suspendExpress.suspend.resume;

describe('app.route(path).VERB(fn*)', function() {
	it('should auto-wrap generator functions', function(done) {
		var app = patch(express());

		app.route('/').get(function*(req, res, next) {
			res.send('boom');
		});

		request(app).get('/')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'boom');
				done();
			});
	});

	it('should work with multiple middleware', function(done) {
		var app = patch(express());

		app.route('/').get(function*(req, res, next) {
			req.foo = 'bar';
			next();
		}, function*(req, res, next) {
			res.send(req.foo);
		});

		request(app).get('/')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'bar');
				done();
			});
	});

	it('should forward thrown errors', function(done) {
		var app = patch(express());

		app.route('/').get(function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use(function(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});

		request(app).get('/').end(noop);
	});
});

describe('app.del(path, fn*) alias', function() {
	it('should work', function(done) {
		var app = express();

		// app.del() is deprecated, so skip test if/when it's removed
		if (!app.del) return done();

		patch(app);

		app.del('/', function*(req, res, next) {
			res.send('deleted');
		});

		request(app).delete('/')
			.end(function(err, res) {
				assert.ifError(err);
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.text, 'deleted');
				done();
			});
	});
});

// i think i read once that it's bad to programmatically build out your test cases...
methods.filter(function(method) {
	// todo: how do we test CONNECT requests?
	return method !== 'connect';
}).concat('all').forEach(function(method) {
	describe('app.' + method + '(path, fn*)', function() {
		it('should auto-wrap generator functions', function(done) {
			var app = patch(express());

			app[method]('/', function*(req, res, next) {
				res.send(method + ' successful');
			});

			request(app)[method === 'all' ? 'get' : method]('/')
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
			var app = patch(express());

			app[method]('/', function*(req, res, next) {
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

			request(app)[method === 'all' ? 'get' : method]('/')
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
			var app = patch(express());

			app[method]('/', function*(req, res, next) {
				throw new Error('catch me');
			});

			app.use(function(err, req, res, next) {
				assert.strictEqual(err.message, 'catch me');
				done();
			});

			request(app)[method === 'all' ? 'get' : method]('/').end(noop);
		});
	});
});

function noop() {};
