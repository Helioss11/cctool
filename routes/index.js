var express = require('express');
var router = express.Router();

var JWToken = require('./auth');

router.all('*', function(req, res, next){

  if(req.method === 'OPTIONS'){
    next();
  }else{

    if( (req.method !== 'POST' && req.url === '/api/v1/users') || 
      (req.url !== '/' && req.url !== '/api/v1/users/auth' && req.url !== '/api/v1/token' && req.url !== '/api/v1/users' && req.url !== '/api/v1/assets' && 
      req.url !== '/api/v1/users/username' && req.url !== '/api/v1/lookup/country' && req.url !== '/api/v1/lookup/category' && req.url !== '/api/v1/lookup/rol' && 
      req.url !== '/api/v1/comic/uploadpdf' && req.url !== '/api/v1/comic/uploadthumbnail') ){
      let token = (req.method === 'POST' || req.method === 'PUT') ? req.body.token : req.query.token
      JWToken.verifyJWTToken(token).then((decodedToken) => {
        req.user = decodedToken.data
        next();
      }).catch((err) => {
        res.status(400).json({message: "Invalid auth token provided."});
      });
    }else{
      next();
    }

  }
});

router.post('/api/v1/token', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.username != 'undefined' && typeof req.body.refreshToken != 'undefined'){

    let token = JWToken.refreshJWToken(req, res, {
      "username": req.body.username,
      "refreshToken": req.body.refreshToken
    }).then((token) => {
      res.json({"status": 200, "error": null, "response": token});
    }).catch((err) => {
      res.status(400).json({message: "Invalid refresh token provided."});
    })
    
  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CCTool API' });
});

module.exports = router;
