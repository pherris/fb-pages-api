var restify   = require( 'restify' );
var NodeCache = require( 'node-cache' );
var config    = require( __dirname + '/config.js' );

config.validate();

var server    = restify.createServer();

//allow cross origin for dev
server.use(
  function crossOrigin(req,res,next){
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:9000');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    return next();
  }
);

function isEmptyObject(obj) {
  if (typeof obj != 'undefined') {
    return obj === null || !Object.keys(obj).length;
  } else {
    return true;
  }
}

var myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 } );

// Creates a JSON client
var fbClient = restify.createJsonClient({
  url: 'https://graph.facebook.com'
});

/**
 * captures all /fb* requests and sends them to FB with correct credentials
 **/
server.get(/^\/fb(.*)/, function(req, resp, next) {
  var apiCall = req.params[0];

  myCache.get( apiCall, function( err, value ){
    var seperator = apiCall.indexOf('?') > -1 ? '&' : '?';
    if( isEmptyObject(value[apiCall] ) || err ){
      // no key in cache, populate
      console.log('cache not found, fetching');
      fbClient.get('/' + config.fb.pageId + apiCall + seperator + 'access_token=' + config.fb.appId + '|' + config.fb.appSecret, function(err, req, res, obj) {
        console.log( 'fb call executed to: ' + '/' + config.fb.pageId + '/' + apiCall + seperator + 'access_token=' + config.fb.appId + '|' + config.fb.appSecret );
        console.log( 'fb response recevied' );
        myCache.set(apiCall, obj);
        resp.send( obj ? obj : "{ 'error': 'could not access fb' }" );
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

