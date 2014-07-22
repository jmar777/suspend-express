var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	suspendExpress = require('../'),
	patch = suspendExpress.patch,
	resume = suspendExpress.suspend.resume;

describe('app.param(name, fn*)', function(){
	it('should auto-wrap generator functions', function(done) {
		var app = patch(express());

		app.param('foo', function*(req, res, next, foo) {
			req.foo = foo;
			next();
		});

		app.get('/:foo', function (req, res, next) {
			res.send(req.foo);
		});

		request(app)
			.get('/bar')
			.end(function(err, res) {
				assert.ifError(err);

				assert.strictEqual(res.text, 'bar');
				done();
			});
	});
});
