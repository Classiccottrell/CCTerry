"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var Proxy = require('form-proxy');
var request = require('request');
var merge = require('merge');

var app = express();

app.set('port', (process.env.PORT || 5000)); //set port

var logger = function (req, res, next) {
	var path = req.path;

	//log only if its a route, or a html or html file
	if( path.indexOf('.') == -1 || 
		(path.indexOf('.') > -1 && (path.indexOf('.html') != -1 || path.indexOf('.htm') != -1) ) ) {
		var logData = {
			HTTP_USER_AGENT: req.get('user-agent'),
			HTTP_ACCEPT_LANGUAGE: req.get('accept-language'),
			HTTP_REFERER: req.get('referer'),
			REMOTE_ADDR: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			referer: req.protocol + '://' + req.headers['host']
		}

		request.post({
			url: 'http://platform.tagga.com/widgetservices/pagehit',
			json: true,
			form: logData
		// }, function(error, response, body) {console.log(body);});
		});
		// console.log(logData);
	}

	next();
};

app.use(logger);
app.use(express.static(__dirname+'/app')); //serve static files from /app
app.use('/app', logger, express.static(__dirname+'/app')); //also allow /app to be served
app.use(bodyParser.json()); //parse all Content-Type: application/json

//proxy to platform FormService
app.route('/form').post(function(req, res, next) {
	Proxy.optinProxy(
		{
			form: req.body.form_data,
			iid: req.body.iid,
			referer: req.get('Referer')
		},
		{
			sms: 'http://platform.tagga.com/widgetservices/weboptinsms',
			email: 'https://api.createsend.com/api/v3.1/subscribers/'
		},
		function(outcome) {
			//ignore opt-in outcome for now
		}
	);

	//pass in rules (incomplete)
	var rules = {};
	//call to proxy request
	Proxy.formProxy(
		{
			form: req.body.form_data, //request.post apparently expects 'form' as key name for data
			iid: req.body.iid, //iid from the user (comes from client)
			referer: req.get('Referer'),
			rules: rules,
		},
		{
			url: 'http://platform.tagga.com/widgetservices/form'
		},
		function(outcome) { //feed request params right back to the callback func
			res.writeHead(outcome.code, {'Content-Type': 'application/json'});
			res.end(outcome.body);
		}
	);
});

app.route('/gplusCount').post(function(req, res, next) {
	Proxy.gplusCount(req.body.url, function(outcome) {
		res.writeHead(outcome.code, {'Content-Type': 'application/json'});
		res.end(outcome.body);
	});
});

app.route('/sociallink').post(function(req, res, next) {
	Proxy.socialLink(
		{
			url: req.body.url,
			social_type: req.body.social_type,
			iid: req.body.iid,
			referer: req.get('Referer')
		},
		{
			url: 'http://platform.tagga.com/widgetservices/sociallink'
		},
		function(outcome) {
			res.writeHead(outcome.code, {'Content-Type': 'application/json'});
			res.end(outcome.body);
		}
	);
});

app.get('/storelocator', function(req, res, next) {
	request.post({
		url: 'http://platform.tagga.com/widgetservices/storelocator',
		json: true,
		form: req.query
	}, function(error, response, body) {
		res.status(200).json(body);
	});
});

app.post('/storelocator', function(req, res, next) {
	var params = merge(true, req.query, req.body);
	request.post({
		url: 'http://platform.tagga.com/widgetservices/storelocatorSearch',
		json: true,
		form: params
	}, function(error, response, body) {
		res.status(200).json(body);
	});
});

//start listening on port
app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'))
});