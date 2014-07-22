var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	suspendExpress = require('../'),
	patch = suspendExpress.patch,
	resume = suspendExpress.suspend.resume;

describe('router.param(name, fn*)', function(){
	it('should auto-wrap generator functions', function(done) {
		var app = express(),
			router = patch(express.Router());

		router.param('foo', function*(req, res, next, foo) {
			req.foo = foo;
			next();
		});

		router.get('/:foo', function (req, res, next) {
			res.send(req.foo);
		});

		app.use('/test', router);

		request(app)
			.get('/test/bar')
			.end(function(err, res) {
				assert.ifError(err);

				assert.strictEqual(res.text, 'bar');
				done();
			});
	});
});
