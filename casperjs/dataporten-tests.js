var config = require('config.js');

var client_id       = config.client_id;
var client_secret   = config.client_secret;
var username        = config.username;
var password        = config.password;
var redirect_uri    = config.redirect_uri;
var original_state  = makeid(30);

casper.test.begin("full-test", 15, function(test) { 
  casper.start('https://auth.dataporten.no/oauth/authorization?\
    client_id=' + client_id + "&" +
    "redirect_uri=" + redirect_uri +
    "&response_type=code" +
    "&state=" + original_state);

  casper.then(function() {
    //this.echo('First Page: ' + this.getTitle());
    test.assertTitle("Select your login provider", "Dataporten title should be: Select your login provider, and is: " + this.getTitle());
    casper.waitForSelector('a[id="altlogin"]', function() {
      test.assertExists('a[id="altlogin"]', 'Checking for alternate login');
      if(this.exists('#altlogin')) {
        this.click("#altlogin");
      }
    }, function() {
      casper.waitForSelector('a[data-subid="spusers.feide.no"]', function() {
        test.assertExists('a[data-subid="spusers.feide.no"]', "Checking for UNINETT.no button");
        this.click("a[data-subid='spusers.feide.no']");
      });
    });
  });

  casper.then(function() {
    casper.waitForSelector('a[data-subid="spusers.feide.no"]', function() {
      test.assertExists('a[data-subid="spusers.feide.no"]', "Checking for UNINETT.no button");
      this.click("a[data-subid='spusers.feide.no']");
    })
  });

  casper.then(function() {
    test.assertExists('#username', "Checking for username field");
    test.assertExists("#password", "Checking for password field");

    this.fillSelectors('form[name="f"]', {
       '#username' : username,
       '#password' : password
   }, true);

 });

 casper.then(function() {
   casper.capture('img/image.png');
   code   = getParameterByName("code", this.getCurrentUrl());
   local_state  = getParameterByName("state", this.getCurrentUrl());

   test.assert(code != undefined, "Code not empty: " + code);
   test.assert(local_state == original_state, "State should be: " + original_state + " and state is: " + local_state);

   casper.thenOpen("https://auth.dataporten.no/oauth/token?", {
     method: 'POST',
     data: {
       'grant_type': 'authorization_code',
       'client_id': client_id,
       'client_secret': client_secret,
       'code': code,
       'redirect_uri': 'http://localhost/oauth/callback.php'
     }
   }, function(response) {
     test.assert(response.status == 200, "Response code, token: " + response.status);
   });
 });

 casper.then(function() {
   response = JSON.parse(this.page.plainText);
   test.assert(typeof(response) == "object", "Response is type " + typeof(response) + " and should be object");
   access_token = JSON.parse(this.page.plainText).access_token;
   test.assert(access_token != "" && access_token != undefined, "Accesstoken sent is: " +  access_token);
   casper.thenOpen("https://auth.dataporten.no/userinfo?", {
     method: 'GET',
     data: {
       'access_token': access_token,
     },
     headers: {
       'Authorization': 'Bearer ' + access_token
     }
   }, function(response) {
     test.assert(response.status == 200, "Response code, userinfo: " + response.status);
   });
 });

 casper.then(function() {
   response = JSON.parse(this.page.plainText);
   test.assert(typeof(response) == "object", "Response is: " + typeof(response) + " and should be object");
   test.assert(response.user != undefined, "User object is: " + this.page.plainText);
   casper.thenOpen("https://groups-api.dataporten.no/groups/me/groups?", {
     method: 'GET',
     data: {
       'access_token': access_token,
     },
     headers: {
       'Authorization': 'Bearer ' + access_token
     }
   }, function(response) {
     test.assert(response.status == 200, "Response code, groups: " + response.status);
   });
 });

 casper.then(function() {
   response = JSON.parse(this.page.plainText);
   test.assert(typeof(response) == "object", "Group response is " + typeof(response) + " and should be object: " + this.page.plainText);
 });

  casper.run(function() {
      test.done();
  });

});

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function makeid(len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.,$!";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
