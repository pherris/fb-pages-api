var restify   = require( 'restify' );
var NodeCache = require( 'node-cache' );
var config    = require( './config' );

config.validate();

var server    = restify.createServer();

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

var myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 } );

// Creates a JSON client
var fbClient = restify.createJsonClient({
  url: 'https://graph.facebook.com'
});

/**
 * captures all /fb/* requests and sends them to FB with correct credentials
 **/
server.get(/^\/fb\/(.*)/, function(req, resp, next) {
  var apiCall = req.params[0];

  myCache.get( apiCall, function( err, value ){
    var seperator = apiCall.indexOf('?') > -1 ? '&' : '?';
    
    if( isEmptyObject(value) || err ){
      // no key in cache, populate
      console.log('cache not found, fetching');
      fbClient.get('/' + config.fb.pageId + '/' + apiCall + seperator + 'access_token=' + config.fb.appId + '|' + config.fb.appSecret, function(err, req, res, obj) {
        console.log( 'fb response received' );
        myCache.set(apiCall, obj);
        resp.send( obj );
        return next();
      });
    } else {
      console.log( 'found cached value, returning' );
      resp.send( value[apiCall] );
      return next();
    }
  });
});

server.get(/^\/*/, restify.serveStatic({
  directory: './static'
}));

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

