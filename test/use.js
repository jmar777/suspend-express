var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	suspendExpress = require('../'),
	patch = suspendExpress.patch,
	resume = suspendExpress.suspend.resume;

describe('.use(fn*)', function(){
	it('should auto-wrap generator functions', function(done) {
		var app = patch(express());

		app.use(function*(req, res, next) {
			req.foo = 'bar';
			next();
		});

		app.get('/', function (req, res, next) {
			res.send(req.foo);
		});

		request(app)
			.get('/')
			.end(function(err, res) {
				assert.ifError(err);

				assert.strictEqual(res.text, 'bar');
				done();
			});
	});

	it('should forward thrown errors', function(done) {
		var app = patch(express());

		app.use(function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use(function(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});
		
		request(app).get('/').end(noop);
	});

	it('should support generator function error handlers', function(done) {
		var app = patch(express());

		app.use(function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use(function*(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});
		
		request(app).get('/').end(noop);
	});
});

describe('.use(path, fn*)', function(){
	it('should auto-wrap generator functions', function(done) {
		var app = patch(express());

		app.use('/', function*(req, res, next) {
			req.foo = 'bar';
			next();
		});

		app.get('/', function (req, res, next) {
			res.send(req.foo);
		});

		request(app)
			.get('/')
			.end(function(err, res) {
				assert.ifError(err);

				assert.strictEqual(res.text, 'bar');
				done();
			});
	});

	it('should forward thrown errors', function(done) {
		var app = patch(express());

		app.use('/', function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use(function(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});
		
		request(app).get('/').end(noop);
	});

	it('should support generator function error handlers', function(done) {
		var app = patch(express());

		app.use('/', function*(req, res, next) {
			throw new Error('catch me');
		});

		app.use(function*(err, req, res, next) {
			assert.strictEqual(err.message, 'catch me');
			done();
		});
		
		request(app).get('/').end(noop);
	});
});

function noop() {};
