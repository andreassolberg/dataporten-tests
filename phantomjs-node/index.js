
// Built-in Node.js modules
var assert = require('assert');

// Third party libraries
var phantom = require('node-phantom-simple');
// var phantom = require('phantom');
var Promise = require('promise');
var Class = require('./lib/Class').Class;

// Local libraries
var FlowCollection = require('./lib/FlowCollection').FlowCollection;
var OAuth = require('./lib/OAuth').OAuth;

var config = {
	"url": "https://auth.dataporten.no/",
	"org": "uninett.no",
	"username": process.env.USERNAME,
	"password": process.env.PASSWORD,
	"oauth": {
		"client_id": process.env.DATAPORTEN_CLIENTID,
		"client_secret": process.env.DATAPORTEN_CLIENTSECRET,
		"redirect_uri": process.env.DATAPORTEN_REDIRECTURI
	}
};
if (process.env.CI) {
	config.url = 'http://127.0.0.1/';
}

console.log("----- ");
console.log(" OAuth config ");
console.log(config);
console.log("----- ");

var o = new OAuth(config);


describe('Feide Connect test suite collection', function() {

	it('Completed.', function(done) {
		this.timeout(10000);
		phantom.create(parameters, function(err, ph) {
			assert(typeof ph === 'object', 'Phantom object is present');
			var collection = new FlowCollection(ph, o);
			collection.run()
				.then(function() {
					console.log("Now we're completed with the whole thing");
					done();
				});

			// it('Waiting for test suite to complete', function(done) {
			// collection.completed(done);
			// });
			// done();
			// done();

		});

	});

	var parameters = {
		"parameters": {
			'ignore-ssl-errors': 'yes',
			"ssl-protocol": "any"
		}
	};


	// it("Whole testsuite completed", function(done) {
	// 	assert(true);
	// 	done();
	// });

});
