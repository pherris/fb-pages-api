fb-pages-api
============

Proxy API requests to Facebook that require an 'access token' without requiring the end user to login. This NodeJS app allows you to access public APIs from Facebook to display your Page's feed on your web site without exposing your credentials in client side code or navigating the Facebook token creation process. Facebook responses are cached for several minutes by default.

To see how this data is visualized, download the companion AngularJS app at: https://github.com/pherris/fb-pages-ui

Usage
------------------
````
git clone https://github.com/pherris/fb-pages-api/
cd fb-pages-ui
edit config.js.empty with your credentials and rename to config.js
node index.js
````
Cross origin calls are allowed only from localhost:9000 by default. To serve static content from the NodeJS server, place your content in the ./static/ directory.

API Calls
------------------
The proxy matches all HTTP requests made to HOST/fb and proxies them to Facebook with your pageId and credentials (from config.js). e.g.

this configuration
````
config.fb = {
  pageId:    123,
  appId:     456,
  appSecret: '1A2A3A4A5A'
};
````

Request: 
````
http://localhost:5000/fb
````

Maps to this Facebook API call (https://developers.facebook.com/docs/graph-api/reference/page/):
````
https://graph.facebook.com/123/?access_token=456|1A2A3A4A5A
````

Request: 
````
http://localhost:5000/fb/posts
````

Maps to this Facebook API call (https://developers.facebook.com/docs/graph-api/reference/page/feed/):
````
https://graph.facebook.com/123/posts?access_token=456|1A2A3A4A5A
````

The mapping is entirely by convention. If you were to make a HTTP request to:
````
http://localhost:5000/fb/noop/please
````

The app will make a Facebook call to:
````
https://graph.facebook.com/123/noop/please?access_token=456|1A2A3A4A5A
````
