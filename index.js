var restify   = require( 'restify' );
var NodeCache = require( 'node-cache' );
var config    = require( __dirname + '/config.js' );

config.validate();

console.log(JSON.stringify(config));

var server    = restify.createServer();

//allow cross origin for dev
server.use(
  function crossOrigin(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
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

var myCache = new NodeCache({ stdTTL: config.app.cache.ttlMillis, checkperiod: 120 } );

// Creates a JSON client
var fbClient = restify.createJsonClient({
  url: 'https://graph.facebook.com'
});

/**
 * captures all /fb* requests and sends them to FB with correct credentials
 **/
server.get(/^\/fb(.*)/, function(req, resp, next) {
  var apiCall = req.params[0].substr(1, req.params[0].length); //pull off leading /

  //if apiCall is numeric&/or hyphens, don't prepend pageId
  if (!apiCall.match(/^[\d|-]+\/?.*$/)) {
    apiCall = config.fb.pageId + '/' + apiCall;
  }

  myCache.get( apiCall, function( err, value ){
    var seperator = apiCall.indexOf('?') > -1 ? '&' : '?';
    
    if( isEmptyObject(value[apiCall] ) || err ){
      // no key in cache, populate
      //console.log('cache not found, fetching');

      var url = '/' + apiCall + seperator + 'access_token=' + config.fb.appId + '|' + config.fb.appSecret;

      fbClient.get(url, function(err, req, res, obj) {
        console.log( 'fb response recevied' );
        
        myCache.set(apiCall, obj);
        resp.send( obj ? obj : "{ 'error': 'could not access fb' }" );
        return next();
      });
    } else {
      //console.log( 'found cached value, returning' );
      resp.send( value[apiCall] );
      return next();
    }
  });

  return next();
});

//wrap the config object and only expose what is safe to expose
server.get(/^\/config/, function (req, resp, next) {
  resp.send({
    'facebook': {
      'appId': config.fb.appId,
      'pages': config.fb.pages
    },
    'google': {
      'analytics': {
        'siteId': config.google.analytics.siteId
      }
    }
  });
  return next();
});

server.get(/^\/*/, restify.serveStatic({
  directory: './static'
}));

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

