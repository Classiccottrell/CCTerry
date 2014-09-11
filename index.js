"use strict";
//
var express = require('express');
var bodyParser = require('body-parser');
var Proxy = require('form-proxy');

var app = express();

app.set('port', (process.env.PORT || 5000)); //set port

app.use(express.static(__dirname+'/app')); //serve static files from /app
app.use('/app', express.static(__dirname+'/app')); //also allow /app to be served
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
			sms: 'http://platform.taggadev.com/widgetservices/weboptinsms',
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
			url: 'http://platform.taggadev.com/widgetservices/form'
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
			url: 'http://platform.inc.ly/widgetservices/sociallink'
		},
		function(outcome) {
			res.writeHead(outcome.code, {'Content-Type': 'application/json'});
			res.end(outcome.body);
		}
	);
});

//start listening on port
app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'))
});