var restify   = require( 'restify' );
var NodeCache = require( 'node-cache' );

var server    = restify.createServer();

var pageConfig = {
  pageId:    0,
  appId:     0,
  appSecret: ''
};

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
      fbClient.get('/' + pageConfig.pageId + '/' + apiCall + seperator + 'access_token=306514909486699|19849a550dc9bb5330c5623afbbb1fe0', function(err, req, res, obj) {
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

server.listen(3000, function() {
  console.log('%s listening at %s', server.name, server.url);
});

