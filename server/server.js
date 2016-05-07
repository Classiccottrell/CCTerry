var express = require('express');
var bodyParser = require('body-parser');

var merge = require('merge');

var colors = require('colors/safe');
var Promise = require('bluebird');
var request = require('request');
Promise.promisifyAll(request);

var mysql = require('mysql');
Promise.promisifyAll(require('mysql/lib/Connection').prototype);
Promise.promisifyAll(require('mysql/lib/Pool').prototype);

var HTTPError = require('node-http-error');

var app = express();

//set port
app.set('port', (process.env.PORT || 5000));

//start listening on port
app.listen(app.get('port'), function () {
	console.log('Node app is running at: ' + colors.green('localhost:' + app.get('port')));
	console.log('Tagga Proxy config', taggaProxy);
});

app.use(express.static('build'));
app.use('/*', express.static('build/index.html'));