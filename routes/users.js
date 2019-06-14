var express = require('express');
var router = express.Router();

var encryptPassword = require('encrypt-password');
var JWToken = require('./auth');

encryptPassword.secret = 'NacmVJ5hNx';
encryptPassword.min = 4;
encryptPassword.max = 24;
encryptPassword.pattern = /^\w{4,24}$/;

var getUser = function(id, res, callback){

  res.locals.pool.query(`SELECT uu.id userId, uu.name, uu.lastname, uu.email, uu.username, 
  uu.gender, uu.age, uu.tutorial, uu.country_id, cc.country, uu.zorb, 
  uu.rol_id, rr.rol, uu.status, uu.register_at, uu.last_update 
  FROM users uu 
  INNER JOIN lu_contry_types cc on uu.country_id = cc.id
  INNER JOIN lu_rol_types rr on uu.rol_id = rr.id
  WHERE uu.id = ?`, id, function(error, results, fields){

    if(error){
      callback(error, null);
    }else{
      if(results.length > 0)
        callback(null, results);
      else
        callback('No user found', null);
    }

  });

};

var getCourseEvaluations = function(results, res, callback){

  for(let i=0; i<results.length; i++){
    res.locals.pool.query(`SELECT * FROM course_evaluation WHERE user_comic_id = ?`, results[i].user_comic_id, function(error, result, fields){

      if(error){
        callback(error, null);
      }else{
        results[i].evaluation = result[0];
        if(i + 1 == results.length){
          callback(null, results);
        }
      }
  
    });
  }

};

/* GET users listing. */
router.get('/', function(req, res, next) {

  let ands = ' WHERE 1 = 1 ';
  ands += (typeof req.query.rol_id != 'undefined') ? ` AND uu.rol_id IN (${req.query.rol_id}) ` : "";
  ands += (typeof req.query.name != 'undefined') ? ` AND uu.name LIKE '%${req.query.name}%' ` : "";

  res.locals.pool.query(`SELECT uu.id userId, uu.name, uu.lastname, uu.email, uu.username, 
  uu.gender, uu.age, uu.country_id, cc.country, uu.zorb, uu.color,
  uu.rol_id, rr.rol, uu.status, uu.register_at, uu.last_update 
  FROM users uu 
  INNER JOIN lu_contry_types cc on uu.country_id = cc.id
  INNER JOIN lu_rol_types rr on uu.rol_id = rr.id ${ands} `, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });

});

router.post('/recover/test', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.zorb != 'undefined' && typeof req.body.username != 'undefined' && typeof req.body.color != 'undefined'){

    req.body.username = req.body.username.trim().toLowerCase();

    res.locals.pool.query(`SELECT uu.id userId, uu.name, uu.lastname, uu.email, uu.username, 
    uu.gender, uu.age, uu.country_id, uu.zorb, uu.color, uu.rol_id, uu.status, uu.register_at, uu.last_update 
    FROM users uu 
    WHERE uu.zorb = ${res.locals.pool.escape(req.body.zorb)} 
    AND uu.username = ${res.locals.pool.escape(req.body.username)} 
    AND uu.color = ${res.locals.pool.escape(req.body.color)}`, function(error, result, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(result.length > 0){

          let token = JWToken.createJWToken({
            userId: result[0].userId,
            sessionData: { "username": result[0].username },
            maxAge: 43200
          }, req, res);
          
          result[0].tokenData = token;
          res.json({"status": 200, "error": null, "response": result[0]});
          
        }else{
          res.json({"status": 500, "error": "No existe el usuario", "response": {}});
        }
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.put('/recover/:id', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.username != 'undefined' && typeof req.body.password != 'undefined'){

    let encPass = encryptPassword(req.body.password.trim().toLowerCase(), req.body.username.trim().toLowerCase());

    res.locals.pool.query(`UPDATE users SET password = '${encPass}' WHERE id = ${req.params.id} AND username = '${req.body.username}'` , function(error, result){

      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        res.json({"status": 200, "error": null, "response": result});
      }

    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

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
  typeof req.body.gender != 'undefined' && (req.body.gender == 'm' || req.body.gender == 'f' || req.body.gender == 'o') && typeof req.body.age != 'undefined' && typeof req.body.country_id != 'undefined' && 
  typeof req.body.zorb != 'undefined' && typeof req.body.rol_id != 'undefined'){

    let encPass = encryptPassword(req.body.password.trim().toLowerCase(), req.body.username.trim().toLowerCase());
    req.body.password = encPass;

    req.body.username = req.body.username.trim().toLowerCase();
    
    res.locals.pool.query('INSERT INTO users SET ?', req.body, function(error, result){
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

router.post('/username', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.username != 'undefined'){

    req.body.username = req.body.username.trim().toLowerCase();

    res.locals.pool.query(`SELECT id, username FROM users WHERE username = '${req.body.username}'`, function(error, result, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(result.length > 0){
          res.json({"status": 200, "error": null, "response": result});
        }else{
          res.json({"status": 404, "error": "username not found"});
        }
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.post('/auth/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.username != 'undefined' && typeof req.body.password != 'undefined'){

    let encPass = encryptPassword(req.body.password.trim().toLowerCase(), req.body.username.trim().toLowerCase());
    req.body.username = req.body.username.trim().toLowerCase();

    res.locals.pool.query(`SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${encPass}'`, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(results.length > 0){

          let token = JWToken.createJWToken({
            userId: results[0].id,
            sessionData: { "username": req.body.username },
            maxAge: 43200 // TODO 12 HRS
          }, req, res);
          
          results[0].tokenData = token;
          res.json({"status": 200, "error": null, "response": results[0]});

        }else{
          res.json({"status": 403, "error": "bad username or password", "response": "bad username or password"});
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

      update += " last_update = " + res.locals.pool.escape(lastUpdate)
      update += ", name = " +       (typeof req.body.name != 'undefined' ?       res.locals.pool.escape(req.body.name) :       res.locals.pool.escape(results[0].name));
      update += ", lastname = " +   (typeof req.body.lastname != 'undefined' ?   res.locals.pool.escape(req.body.lastname) :   res.locals.pool.escape(results[0].lastname));
      update += ", gender = " +     (typeof req.body.gender != 'undefined' ?     res.locals.pool.escape(req.body.gender) :     res.locals.pool.escape(results[0].gender));
      update += ", age = " +        (typeof req.body.age != 'undefined' ?        res.locals.pool.escape(req.body.age) :        res.locals.pool.escape(results[0].age));
      update += ", country_id = " + (typeof req.body.country_id != 'undefined' ? res.locals.pool.escape(req.body.country_id) : res.locals.pool.escape(results[0].country_id));
      update += ", zorb = " +       (typeof req.body.zorb != 'undefined' ?       res.locals.pool.escape(req.body.zorb) :       res.locals.pool.escape(results[0].zorb));
      update += ", color = " +      (typeof req.body.color != 'undefined' ?      res.locals.pool.escape(req.body.color) :      res.locals.pool.escape(results[0].color));
      update += ", rol_id = " +     (typeof req.body.rol_id != 'undefined' ?     res.locals.pool.escape(req.body.rol_id) :     res.locals.pool.escape(results[0].rol_id));
      update += ", tutorial = " +   (typeof req.body.tutorial != 'undefined' ?   res.locals.pool.escape(req.body.tutorial) :   res.locals.pool.escape(results[0].tutorial));

      res.locals.pool.query('UPDATE users SET ' + update + ' WHERE id = ' + req.params.id, function(error, result){

        if(error){
          res.json({"status": 500, "error": error, "response": null});
        }else{
          res.json({"status": 200, "error": null, "response": result});
        }

      });

    }

  });

});

router.post('/sessiontime', function(req, res, next){

  getUser(req.body.user_id, res, function(error, results){

    if(error){
      res.json({"status": 500, "error": error, "response": "user not exists"});
    }else{

      let session = {
        user_id: req.body.user_id,
        session_time: req.body.session_time
      }
      res.locals.pool.query('INSERT INTO user_sessions SET ?', session, function(error, result){
        if(error){
          res.json({"status": 500, "error": error, "response": null});
        }else{

          res.locals.pool.query(`SELECT IFNULL(TIMESTAMPDIFF(MINUTE, (select max(ls.date_created) from users_log_session ls where ls.user_id = '${req.body.user_id}'), NOW()), 61) minutos`, function(error, results, fields){
            if(error){
              res.json({"status": 500, "error": error, "response": null});
            }else{
              if(results.length > 0){
                
                if(results[0].minutos > 60){
                  let data = {
                    user_id: req.body.user_id,
                    remote_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent') || ''
                  }
                  res.locals.pool.query('INSERT INTO users_log_session SET ?', data, function(error, result){
                    if(error){
                      res.json({"status": 500, "error": error, "response": null});
                    }else{
                      res.json({"status": 200, "error": null, "response": result});
                    }
                  });
                }

              }else{
                res.json({"status": 200, "error": null, "response": result});
              }
            }
          });

          res.json({"status": 200, "error": null, "response": result});

        }
      });

    }

  });

});

router.get('/comics/:id', function(req, res, next){

  let ands = '';
  ands += (typeof req.query.course != 'undefined' && req.query.course == 1) ? " AND course_id IS NOT NULL " : "";

  res.locals.pool.query(`SELECT uc.id user_comic_id, uc.user_id, uc.title, uc.code, uc.file, uc.thumbnail, uc.course_id, cc.pin, uc.in_gallery, uc.status, uc.register_at, uc.last_update 
  FROM user_comic uc
  LEFT JOIN course cc ON uc.course_id = cc.id
  WHERE uc.user_id = ? ${ands} AND uc.status = true`, req.params.id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      if(results.length > 0){
        getCourseEvaluations(results, res, function(error, result){
          if(!error){
            res.json({"status": 200, "error": null, "response": result});
          }else{
            res.json({"status": 500, "error": error, "response": null});
          }
        });
      }else{
        res.json({"status": 200, "error": null, "response": results});
      }
    }
  });

});

router.get('/pines/:id', function(req, res, next){

  res.locals.pool.query(`select distinct(cc.pin) pin, cc.id course_id, cc.name, uc.register_at
  from user_comic uc 
  inner join course cc on uc.course_id = cc.id
  where uc.user_id = ?
  and cc.status = true
  and uc.status = true`, req.params.id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      if(results.length > 0){
        let pines = [];
        for(pin in results){
          pines.push(results[pin].pin);
        }
        res.json({"status": 200, "error": null, "response": {"pines": pines, "cursos": results}});
      }else{
        res.json({"status": 500, "error": "No data", "response": null});
      }
    }
  });

});

router.post('/comic', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined'){
    res.locals.pool.query(`SELECT id FROM user_comic WHERE user_id = '${req.body.user_id}' AND title = '${req.body.title}' AND status = true`, function(error, result, fields){
      if(result.length === 0){

        delete req.body.token;
        res.locals.pool.query('INSERT INTO user_comic SET ?', req.body, function(error, result){
          if(error){
            res.json({"status": 500, "error": error, "response": null});
          }else{
            req.body.comic_id = result.insertId;
            result.comicData = req.body;
            res.json({"status": 200, "error": null, "response": result});
          }
        });

      }else{
        res.json({"status": 403, "error": "this comic title is already used"});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

module.exports = router;
