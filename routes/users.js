var express = require('express');
var router = express.Router();

var encryptPassword = require('encrypt-password');
var JWToken = require('./auth');

encryptPassword.secret = 'NacmVJ5hNx';
encryptPassword.min = 8;
encryptPassword.max = 24;
encryptPassword.pattern = /^\w{8,24}$/;

var getUser = function(id, res, callback){

  res.locals.connection.query(`SELECT uu.id userId, uu.name, uu.lastname, uu.email, uu.username, 
  uu.gender, uu.age, uu.country_id, cc.country, uu.zorb, 
  uu.rol_id, rr.rol, uu.status, uu.register_at, uu.last_update 
  FROM users uu 
  INNER JOIN lu_contry_types cc on uu.country_id = cc.id
  INNER JOIN lu_rol_types rr on uu.rol_id = rr.id
  WHERE uu.id = ?`, id, function(error, results, fields){

    if(error){
      callback(error, null);
    }else{
      callback(null, results);
    }

  });

};

/* GET users listing. */
router.get('/', function(req, res, next) {

  res.locals.connection.query(`SELECT uu.id userId, uu.name, uu.lastname, uu.email, uu.username, 
  uu.gender, uu.age, uu.country_id, cc.country, uu.zorb,
  uu.rol_id, rr.rol, uu.status, uu.register_at, uu.last_update 
  FROM users uu 
  INNER JOIN lu_contry_types cc on uu.country_id = cc.id
  INNER JOIN lu_rol_types rr on uu.rol_id = rr.id`, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });

});

router.get('/:id', function(req, res, next) {

  getUser(req.params.id, res, function(error, results){

    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results[0]});
    }

  });

});

router.post('/', function(req, res, next){
  
  if(typeof req.body != 'undefined' && typeof req.body.email != 'undefined' && typeof req.body.username != 'undefined' && req.body.password != 'undefined' && 
  typeof req.body.gender != 'undefined' && (req.body.gender == 'm' || req.body.gender == 'f') && typeof req.body.age != 'undefined' && typeof req.body.country_id != 'undefined' && 
  typeof req.body.zorb != 'undefined' && typeof req.body.rol_id != 'undefined'){

    let encPass = encryptPassword(req.body.password, req.body.username);
    req.body.password = encPass;
    
    res.locals.connection.query('INSERT INTO users SET ?', req.body, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        req.body.userId = result.insertId;
        result.userData = req.body;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.post('/auth/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.username != 'undefined' && typeof req.body.password != 'undefined'){

    let encPass = encryptPassword(req.body.password, req.body.username);

    res.locals.connection.query(`SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${encPass}'`, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(results.length > 0){

          let token = JWToken.createJWToken({
            sessionData: { "username": req.body.username },
            maxAge: 3600
          }, res);
          
          results[0].tokenData = token;
          res.json({"status": 200, "error": null, "response": results[0]});

        }else{
          res.json({"status": 200, "error": null, "response": "bad username or password"});
        }
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.put('/:id', function(req, res, next){

  getUser(req.params.id, res, function(error, results){

    if(error){
      res.json({"status": 500, "error": error, "response": "user not exists"});
    }else{
      
      let lastUpdate = new Date();
      let update = '';

      update += " last_update = " + res.locals.connection.escape(lastUpdate)
      update += ", name = " +       (typeof req.body.name != 'undefined' ?       res.locals.connection.escape(req.body.name) :       results[0].name);
      update += ", lastname = " +   (typeof req.body.lastname != 'undefined' ?   res.locals.connection.escape(req.body.lastname) :   results[0].lastname);
      update += ", gender = " +     (typeof req.body.gender != 'undefined' ?     res.locals.connection.escape(req.body.gender) :     results[0].gender);
      update += ", age = " +        (typeof req.body.age != 'undefined' ?        res.locals.connection.escape(req.body.age) :        results[0].age);
      update += ", country_id = " + (typeof req.body.country_id != 'undefined' ? res.locals.connection.escape(req.body.country_id) : results[0].country_id);
      update += ", zorb = " +       (typeof req.body.zorb != 'undefined' ?       res.locals.connection.escape(req.body.zorb) :       results[0].zorb);
      update += ", rol_id = " +     (typeof req.body.rol_id != 'undefined' ?     res.locals.connection.escape(req.body.rol_id) :     results[0].rol_id);

      res.locals.connection.query('UPDATE users SET ' + update + ' WHERE id = ' + req.params.id, function(error, result){

        if(error){
          res.json({"status": 500, "error": error, "response": null});
        }else{
          res.json({"status": 200, "error": null, "response": result});
        }

      });

    }

  });

});

router.get('/comics/:id', function(req, res, next){

  res.locals.connection.query(`SELECT id, user_id, title, code, file, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic WHERE user_id = ?`, req.params.id, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.post('/comic', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined'){
    delete req.body.token;
    res.locals.connection.query('INSERT INTO user_comic SET ?', req.body, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        req.body.comic_id = result.insertId;
        result.comicData = req.body;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

module.exports = router;
