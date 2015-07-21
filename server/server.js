var express = require('express');
var bodyParser = require('body-parser');
var merge = require('merge');
var colors = require('colors/safe');
var Promise = require('bluebird');
var request = require('request');
Promise.promisifyAll(request);

//taggaProxy config
var taggaProxy = require('tagga-proxy')({
	platformBase: 'http://platform.tagga.com',
	optIn: {
		providers: [
			{
				name: 't1',
				type: 'taggaSms',
				number: '82442',
				keyword: 'aaaarrrr'
			}
		]
	}
});

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
app.use(bodyParser.json({
	limit: '5mb'
}));

app.route('/form').post(function (req, res, next) {
	var data = {
		iid: req.body.iid,
		referer: req.get('Referer'),
		widgetLabel: '',
		form: req.body.form_data
	};

	var optInPromise = taggaProxy.optIn.submit(data.form);
	var formPromise = taggaProxy.form.submit(data);

	Promise.all([optInPromise, formPromise])
	.spread(function (optIn, form) {
		res.status(200).json({
			status: 'succeeded',
			optIn: optIn,
			form: form
		});
	})
	.catch(function (err) {
		console.log(err);
		res.status(500).json({
			status: 'failed',
			error: err
		});
	});
});

app.route('/gplusCount').post(function (req, res, next) {
	taggaProxy.googlePlusShareCount.getCount(req.body.url)
	.then(function (response) {
		res.status(200).json({
			count: response.count
		});
	});
});

app.route('/sociallink').post(function (req, res, next) {
	taggaProxy.socialLink.getURL({
		url: req.body.url,
		social_type: req.body.social_type,
		iid: req.body.iid,
		referer: req.get('Referer')
	})
	.then(function (response) {
		res.status(200).json(response);
	})
	.catch(function (err) {
		res.status(500).json({
			status: 'failed',
			error: err
		});
	});
});

app.get('/storelocator', function (req, res, next) {
	request.postAsync({
		url: 'http://platform.tagga.com/widgetservices/storelocator',
		json: true,
		form: req.query
	})
	.then(function (response, body) {
		res.status(200).json(body);
	})
	.catch(function (err) {
		res.status(500).json(err);
	});
});

app.post('/storelocator', function (req, res, next) {
	var params = merge(true, req.query, req.body);
	request.postAsync({
		url: 'http://platform.tagga.com/widgetservices/storelocatorSearch',
		json: true,
		form: params
	})
	.then(function (response, body) {
		res.status(200).json(body);
	})
	.catch(function (err) {
		res.status(500).json(err);
	});
});

app.post('/pageHit', function (req, res, next) {
	var logData = {
		HTTP_USER_AGENT: req.get('user-agent'),
		HTTP_ACCEPT_LANGUAGE: req.get('accept-language'),
		HTTP_REFERER: req.get('referer'),
		REMOTE_ADDR: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		referer: req.protocol + '://' + req.headers['host'] + req.originalUrl
	}

	taggaProxy.pageHit.log(logData)
	.then(function (response) {
		res.status(200).json(response);
	})
	.catch(function (err) {
		res.status(500).json({
			status: 'failed',
			error: err
		});
	});
});