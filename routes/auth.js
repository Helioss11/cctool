var jwt = require('jsonwebtoken');
var _ = require('lodash');

var secret = 'NacmVJ5hNx';
var refreshSecret = 'j6vTKUyjBU';
const tokenList = {};
// TODO inválido o vencido
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

var createJWToken = function(details, req, res){

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
    expiresIn: 2592000 // 30 días
  });

  var t = new Date();
  t.setSeconds(t.getSeconds() + 2592000);

  session_tokens = {
    user_id: details.userId,
    token: refreshToken,
    value: details.sessionData.username,
    expires: t
  }

  res.locals.connection.query('INSERT INTO session_tokens SET ?', session_tokens, function(error, result){
    if(error){
      // res.json({"status": 500, "error": error, "response": null});
    }
  });

  setUserSession(req, res, {userId: details.userId}, function(error, results){});

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

              setUserSession(req, res, {userId: results[0].user_id}, function(error, results){});
  
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

var setUserSession = function(req, res, data, callback){

  res.locals.connection.query(`SELECT IFNULL(TIMESTAMPDIFF(MINUTE, (select max(ls.date_created) from users_log_session ls where ls.user_id = ${data.userId}), NOW()), 61) minutos`, 
  function(error, result, fields){

    if(!error){
      
      if(result[0].minutos > 60){

        sessionData = {
          user_id: data.userId,
          remote_address: req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        }

        res.locals.connection.query('INSERT INTO users_log_session SET ?', sessionData, function(error, results){
          if(error){
            callback(error, null);
          }else{
            callback(null, result);
          }
        });

      }else{
        callback(null, null);
      }
    }else{
      callback(error, null);
    }

  });

}

module.exports = {verifyJWTToken, createJWToken, refreshJWToken, setUserSession};