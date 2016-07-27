"use strict";

var querystring = require("querystring");
var assert = require("assert");

var Promise = require('promise');

var BaseFlow = require('../BaseFlow').BaseFlow;
var Step = require('../Step').Step;
var phantom = require('phantom');







var BaseOAuthFlow = BaseFlow.extend({
	"init": function(ph, oauth) {

		this.oauth = oauth;
		this._super(ph, oauth.getAuthorizationRequest() );
		// this._super(ph, "http://uninett.no");
		this.title = 'Basic OAuth Authorization Code Flow';
	},

	"loadSteps": function(s) {
		for(var i = 0; i < s.length; i++) {
			this.steps.push(this[s[i]]());
		}
	},

	"prepare": function() {
		this.loadSteps([
			"stepSelectOrganization",
			"stepSelectProvider",
			"stepLogin",
			"stepTempUrl",
			//"stepPreProdWarning",
			"stepSAMLResponse",
			// "stepOAuthGrant",
			"stepRedirectURIcode"


			// "stepLoginConsent",
			// ,
		]);
		this._super();
	},

	"stepSelectOrganization": function() {
		var flow = this;
		return new Step('Select Organization', {
			"evaluate": function(callback) {
				this.page.evaluate(function() {
							return {
								"title": document.title,
								"url": window.location.href,
								"asd": 1
							}
						

				}, function(err, res) {
					callback (
						(res.url.indexOf('/accountchooser') !== -1)
					)
				});
			},
			"execute": function() {
				var that = this;
				return new Promise(function(resolve, reject) {
					that.evaluate(function(evaluated) {
						if (!evaluated) {
							return resolve(false);
						}

						that.page.evaluate(function(org) {
							localStorage.clear();
							$(document).ready(function() {
								setTimeout(function(){
									if($('a[data-subid="' + org + '"]').length < 1) {
										console.log("SKIPPING ORGANIZATION CHOOSER");
										window.location.reload();
									}
									$('a[data-subid="' + org + '"]').trigger("click");
								}, 100);
							});
						}, flow.oauth.config.org, function(err, res) {
							if(err) { return reject(err); }
							resolve(true);
						});
					});
				});
			}
		});
	},

	"stepSelectProvider": function() {
		var flow = this;
		return new Step('Select Login Provider', {
			"evaluate": function(callback) {
				this.page.evaluate(function() {
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {
					// console.log("    =====> URL WAS " + res.url);
					callback (
						(res.url.indexOf('/accountchooser') !== -1)
					)
				});

			},
			"execute": function() {
				var that = this;
				// console.log("  <<<<<>>>>> executing select login provider " + flow.title);
				return new Promise(function(resolve, reject) {
					// console.log("About to evaluate");
					that.evaluate(function(evaluated) {

						var done_step = false;
						if (!evaluated) {
							// console.log("SKipping ");
							done_step = true;

						}

						that.page.evaluate(function(org, done) {
							if(!done) {
								$(document).ready(function() {
									localStorage.clear();
									setTimeout(function(){
										console.log("CLICKING ORGANIZATION: " + org);
										$('a[data-subid="' + org + '"]').trigger("click");
									},100);
								});
							} else {
								console.log("SKIPPING SELECT PROVIDER");
								window.location.reload();
								//$(window).trigger("load");
							}
						}, flow.oauth.config.org, done_step, function(err, res) {
							if (err) { return reject(err); }
							resolve(true);
						});

					});
				});

			}
		});
	},


	"stepLogin": function() {
		var flow = this;
		return new Step('Login page (with credentials)', {
			"debug": true,
			"evaluate": function(callback) {

				// this.page.get('content', function (err,html) {
				// 	  console.log("Page HTML is: " + html);
				// 	})

				this.page.evaluate(function() {
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {
					callback (
						(res.url.indexOf('/simplesaml/module.php/feide/login.php') !== -1)
					)
				});
			},

			"execute": function() {
				var step = this;
				return new Promise(function(resolve, reject) {

					step.page.evaluate(function(username, password) {

						$(document).ready(function() {
							$('#username').val(username);
							$('#password').val(password);
							$('.submit').click();
						});

					}, flow.oauth.config.username, flow.oauth.config.password, function(err, res) {
						if (err) { return reject(err); }
						// console.log(" = <> = <> ABOUT TO RESOLVE 3");
						resolve(true);
					});

				});


			}


		});
	},

	"stepPreProdWarning": function() {
		var flow = this;
		return new Step('Pre-prod Warning', {
			"debug": false,
			"evaluate": function(callback) {
				this.page.evaluate(function() {
					// console.log("Title " + document.title);
					// console.log("URL " + window.location.href);
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {
					callback (
						(res.url.indexOf('/preprodwarning/showwarning.php') !== -1)
					)
				});
			},

			"execute": function() {
				var step = this;
				return new Promise(function(resolve, reject) {

					console.log("Executing !!!");

					step.page.evaluate(function() {

						console.log(window.location.href);
						$(document).ready(function() {
							$('#yesbutton').click();
						});

						setTimeout(function() {
							document.getElementById('yesbutton').click();
						}, 100);

					}, function(err, res) {
						if (err) { return reject(err); }
						console.log(" = <> = <> ABOUT TO RESOLVE 4");
						resolve(true);
					});

				});


			}
		});
	},

	// "stepLoginConsent": function() {
	// 	var flow = this;
	// 	return new Step(this.casper, 'Login consent', 1, {
	// 		"debug": false,
	// 		"evaluate": function(ctx) {
	// 			return false;
	// 		},
	// 		"execute": function(ctx, test) {
	// 			test.assertHttpStatus(200, this.t(flow, " Status code 200"));
	// 			ctx.evaluate(function() {
	// 				document.getElementById('yesbutton').click();
	// 			});
	// 		}
	// 	});
	// },

	"stepTempUrl": function() {
		var flow = this;
		return new Step('Temp URL step', {
			// "debug": true, "html": true,
			"evaluate": function(callback) {
				// this.page.get('content', function (err,html) {
				// 	  console.log("Page HTML is: " + html);
				// 	})


				this.page.evaluate(function() {
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {
					// console.log("url is " + res.url);
					callback (
						(1 === 1)
					)
				});
			},
			"execute": function() {
				var step = this;
				return new Promise(function(resolve, reject) {

					//An extra step in authenticating that has to be dealt with

					resolve(true);

				});


			}
		});
	},

	"stepSAMLResponse": function() {
		var flow = this;
		return new Step('SAML Response POST', {
			// "debug": true, "html": true,
			"evaluate": function(callback) {
				// this.page.get('content', function (err,html) {
				// 	  console.log("Page HTML is: " + html);
				// 	})


				this.page.evaluate(function() {
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {

					console.log("title is " + res.title);
					// console.log("url is " + res.url);
					callback (
						(res.title === 'POST data')
					)
				});
			},
			"execute": function() {
				var step = this;
				return new Promise(function(resolve, reject) {
					console.log("done");
					// console.log("NO ACTION FOR SAML RESPONSE");

					// console.log(" = <> = <> ABOUT TO RESOLVE 5");
					resolve(true);

					// this.page.evaluate(function() {
					// 	document.getElementsByTagName('input')[0].click();
					// });

				});


			}
		});
	},

	// "stepOAuthGrant": function() {
	// 	var flow = this;
	// 	return new Step('OAuth Grant display', {
	// 		// "debug": true, "html": true,
	// 		"evaluate": function(callback) {
	// 			this.page.get('content', function (err,html) {
	// 				console.log("Page HTML is: " + html);
	// 			});

	// 			this.page.evaluate(function() {
	// 				return {
	// 					"title": document.title,
	// 					"url": window.location.href
	// 				};
	// 			}, function(err, res) {
	// 				callback (
	// 					(res.title === 'Authorization Required')
	// 				)
	// 			});

	// 		},
	// 		"execute": function(callback) {

	// 			this.page.evaluate(function() {
	// 				setTimeout(function() {
	// 					document.getElementById('submit').click();
	// 					// document.getElementsByTagName('input')[0].click();
	// 				}, 100);
	// 			});

	// 		}
	// 	});
	// },

	"resolveCode": function(code) {
		return this.oauth.resolveCode(code);
	},

	"stepRedirectURIcode": function() {
		var flow = this;
		return new Step('Redirect URI Code Flow',{
			"debug": true, "html": true,
			"evaluate": function(callback) {

				this.page.get('content', function (err,html) {
					console.log("Page HTML is: " + html);
				});

				// console.log("Chcking if URL matches " + flow.oauth.config.oauth.redirect_uri);
				this.page.evaluate(function() {
					return {
						"title": document.title,
						"url": window.location.href
					};
				}, function(err, res) {
					// console.log("URL WAS " + res.url);
					callback (
						(res.url.indexOf(flow.oauth.config.oauth.redirect_uri) !== -1)
					)
				});
			},

			"execute": function() {
				var step = this;
				return new Promise(function(resolve, reject) {

					// console.log("LAST STEP IS PROCESSING");

					step.page.evaluate(function() {
						// setTimeout(function() {}, 1000);
						return {
							"title": document.title,
							"url": window.location.href,
							"qs": window.location.search
						};
					}, function(err, res) {
						// console.log("We got the URL with the code " + res.qs);
						var decoded = querystring.parse(res.qs.substring(1));
						// console.log(decoded);

						var code = decoded.code;

						describe('OAUth', function() {


							it('OAuth Code', function(done) {

								assert(typeof code === 'string', 'Code is string');
								done();
							});

						});


						return flow.resolveCode(code)
							.then(function(res) {


								it('OAuth resolved Access Token', function(done) {
									assert(typeof res.access_token === 'string', 'Access token is string');
									done();
								});

								console.log("Received access token is [" + res.access_token + "]");
								resolve(true);
							})
							.catch(function(err) {
								console.log("error " + err);
							});




					});
				});


			}
		});
	}


});


var OAuthFlowCodeAltAuth = BaseOAuthFlow.extend({
	"init": function(ph, oauth) {
		this._super(ph, oauth);
		this.title = 'Basic OAuth Authorization Code Flow with alternative authentication at token endpoint';
	},
	"resolveCode": function(code) {
		return this.oauth.resolveCodeAltAuth(code);
	}
});



exports.BaseOAuthFlow = BaseOAuthFlow;
exports.OAuthFlowCodeAltAuth = OAuthFlowCodeAltAuth;
