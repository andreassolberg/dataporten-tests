CasperJS/PhantomJS tests for Dataporten

##### Note you need PhantomJS (http://phantomjs.org/) for this to work

Create a config.js file, which should look something like this:

```
module.exports = {   
  client_id: '*****-*****-*****-*****',   
  client_secret: '*****-*****-*****-*****',   
  username: 'SOME_USERNAME',   
  password: 'SOME_PASSWORD'   
}
```

Install dependencies with ```$ npm install```

To run the tests

```$ casperjs test dataporten-tests.js```
