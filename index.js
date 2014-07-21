"use strict";

var express = require('express');
var bodyParser = require('body-parser');
// var formProxy = require('form-proxy');
var formProxy = require('./lib/form.js');

var app = express();

app.set('port', (process.env.PORT || 5000)); //set port

app.use(express.static(__dirname+'/app')); //serve static files from /app
app.use('/app', express.static(__dirname+'/app')); //also allow /app to be served
app.use(bodyParser.json()); //parse all Content-Type: application/json

//proxy to platform FormService
app.route('/form').post(function(req, res, next) {

	//pass in rules (incomplete)
	var rules = {
		uName : 'string',
		uEmail: 'email'
	};

	//call to proxy request
	formProxy({
		form : req.body.form_data, //request.post apparently expects 'form' as key name for data
		iid: req.body.iid, //iid from the user (comes from client)
		referer : req.get('Referer'),
		rules : rules
	}, function(error, response, body) { //feed request params right back to the callback func
		res.writeHead(response.statusCode, {'Content-Type': 'application/json'});
		res.end(body); //return back proxied response body
	});

});

//start listening on port
app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'))
});