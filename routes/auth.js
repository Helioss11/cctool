var jwt = require('jsonwebtoken');
var _ = require('lodash');

var secret = 'NacmVJ5hNx';
var refreshSecret = 'j6vTKUyjBU';
const tokenList = {};

var verifyJWTToken = function(token){
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decodedToken) => {
      if(err || !decodedToken){
        return reject(err);
      }
      resolve(decodedToken);
    }); 
  });
}

var createJWToken = function(details, res){

  if(typeof details !== 'object'){
    details = {};
  }

  if(!details.maxAge || typeof details.maxAge !== 'number'){
    details.maxAge = 3600;
  }

  details.sessionData = _.reduce(details.sessionData || {}, (memo, val, key) => {
    if(typeof val !== "function" && key !== "password"){
      memo[key] = val;
    }
    return memo;
  }, {});

  let token = jwt.sign({
    data: details.sessionData
  }, secret, {
    expiresIn: details.maxAge,
    algorithm: 'HS256'
  });

  let refreshToken = jwt.sign({
    data: details.sessionData
  }, refreshSecret, {
    expiresIn: 86400
  });

  var t = new Date();
  t.setSeconds(t.getSeconds() + 86400);

  session_tokens = {
    token: refreshToken,
    value: details.sessionData.username,
    expires: t
  }

  res.locals.connection.query('INSERT INTO session_tokens SET ?', session_tokens, function(error, result){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }
  });

  return {"token": token, "refreshToken": refreshToken};

}

var refreshJWToken = function(req, res, details){

  return new Promise((resolve, reject) => {
    res.locals.connection.query(`DELETE FROM session_tokens WHERE expires < NOW()`, function(e, r){
      if(!e){
        res.locals.connection.query(`SELECT * FROM session_tokens WHERE token = '${details.refreshToken}' AND value = '${details.username}'`, function(error, results){
          if(error){
            return reject(error);
          }else{
            
            if(results.length > 0){
              let token = jwt.sign({
                data: { "username": details.username }
              }, secret, {
                expiresIn: 3600,
                algorithm: 'HS256'
              });
          
              tokenList[details.refreshToken] = token;
  
              resolve({"token": token, "refreshToken": details.refreshToken});
            }else{
              return reject({error: "No session_tokens"});
            }

          }
        });
      }
    }); 
  });

}

module.exports = {verifyJWTToken, createJWToken, refreshJWToken};