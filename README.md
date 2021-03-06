# suspend-express


Write simpler, cleaner express middleware using generators and [suspend](https://github.com/jmar777/suspend).

suspend-express is built for express 4 and requires Node v0.11.3+.

## Quick Example

```javascript
var express = require('express'),
    app = require('suspend-express').patch(express());

app.get('/users/:username', function*(req, res, next) {
    res.json(yield UserModel.find({ username: req.params.username }));
});

app.listen(3000);
```

**Note:** Generators are a new feature in ES6 and are still hidden behind the `--harmony-generators` (or the more general `--harmony`) flag in V8:

```
$ node --harmony-generators app.js
```

## Installation

```
$ npm install suspend-express
```

## Documentation

* **[Overview](#overview)**
    * [How it Works](#how-it-works)
    * [Features](#features)
    * [Limitations](#limitations)
* **[API](#api)**
    * [.patch(app)](#patchapp)
    * [.suspend](#suspend)

## Overview

### How it Works

suspend-express works by patching a given express [app](http://expressjs.com/4x/api.html#express) or [router](http://expressjs.com/4x/api.html#router), allowing it to transparently (to express) wrap generator functions with [suspend](https://github.com/jmar777/suspend).  The patched express app or router remains 100% compatible with its preexisting API; the only difference is that it can now accept generator functions in all the most useful places.  For a deeper look at how it actually patches express applications, please check out the [source](https://github.com/jmar777/suspend-express/blob/master/lib/suspend-express.js).

### Features

suspend-express is designed to enable generator functions within express' existing API, and then gets out of the way.

At present, the following express APIs are supported:

* [`app.use([path], fn*)`](http://expressjs.com/4x/api.html#app.use)
* [`app.VERB(path, [fn*...], fn*)`](http://expressjs.com/4x/api.html#app.VERB)
* [`app.route(path).VERB(fn*)`](http://expressjs.com/4x/api.html#app.route)
* [`app.param(name, fn*)`](http://expressjs.com/4x/api.html#app.param)
* [`router.use([path], fn*)`](http://expressjs.com/4x/api.html#router.use)
* [`router.VERB(path, [fn*...], fn*)`](http://expressjs.com/4x/api.html#router.VERB)
* [`router.route(path).VERB(fn*)`](http://expressjs.com/4x/api.html#router.route)
* [`router.param(name, fn*)`](http://expressjs.com/4x/api.html#router.param)

The entire API surface is well tested, with over a 3-to-1 ratio of tests cases to lines of code (that's just a fun stat, so I had to throw it in).  Please do [report any issues](https://github.com/jmar777/suspend-express/issues), however!

### Limitations

While generator functions are enabled in most of the obvious places, you should be aware that they are *not* enabled in `app.param(fn)` or `router.param(fn)` (they are, however, supported when the `name` parameter is provided, as in `app.param(name, fn*)`.

## API

### `.patch(app|router)`

Accepts an express application or router instance and performs the necessary patching to enable generator functions. The return value is the patched application.

**Example:**

```javascript
var express = require('express'),
    app = require('suspend-express').patch(express());
```

**Example:**

```javascript
var express = require('express'),
    router = require('suspend-express').patch(express.Router());
```

### `.suspend`

A reference to the same instance of suspend being used by suspend-express.  This reference should be used, as mixing with another copy of suspend may result in unexpected behavior.

**Example:**

```javascript
var express = require('express'),
    se = require('suspend-express'),
    app = se.patch(express()),
    suspend = se.suspend;

app.get('/slow', function*() {
    yield setTimeout(suspend.resume(), 5000);
    res.send('Slow enough for you?');
});
```

Please note that since I maintain the suspend library as well, I can offer the following assurances:

* suspend-express will be kept up-to-date with suspend.
* The semantic versioning of suspend-express will account for any API developments of suspend as well.

## License

The MIT License (MIT)

Copyright (c) 2014 Jeremy Martin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
