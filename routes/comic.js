var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){

  res.locals.connection.query(`SELECT id, user_id, title, code, file, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.get('/gallery', function(req, res, next){

  res.locals.connection.query(`SELECT id, user_id, title, code, file, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic WHERE in_gallery = true`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.get('/:id', function(req, res, next){

  res.locals.connection.query(`SELECT id, user_id, title, code, file, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic WHERE id = ?`, req.params.id, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.put('/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined' && typeof req.body.comic_id != 'undefined'){

    res.locals.connection.query(`SELECT * FROM users WHERE id = ?`, req.body.user_id, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(results.length > 0){
          res.locals.connection.query(`SELECT * FROM user_comic WHERE id = ?`, req.body.comic_id, function(error, result, fields){
            if(error){
              res.json({"status": 500, "error": error, "response": null});
            }else{
              if(result.length > 0){

                let lastUpdate = new Date();
                let update = '';

                update += " last_update = " + res.locals.connection.escape(lastUpdate);
                update += ", title = " + (typeof req.body.title != 'undefined' ? res.locals.connection.escape(req.body.title) : result[0].title);
                update += ", code = " + (typeof req.body.code != 'undefined' ? res.locals.connection.escape(req.body.code) : result[0].code);
                update += ", file = " + (typeof req.body.file != 'undefined' ? res.locals.connection.escape(req.body.file) : result[0].file);
                update += ", course_id = " + (typeof req.body.course_id != 'undefined' ? res.locals.connection.escape(req.body.course_id) : result[0].course_id);
                update += ", in_gallery = " + (typeof req.body.in_gallery != 'undefined' ? res.locals.connection.escape(req.body.in_gallery) : result[0].in_gallery);
                update += ", status = " + (typeof req.body.status != 'undefined' ? res.locals.connection.escape(req.body.status) : result[0].status);

                res.locals.connection.query('UPDATE user_comic SET ' + update + ' WHERE id = ' + req.body.comic_id, function(error, result){

                  if(error){
                    res.json({"status": 500, "error": error, "response": null});
                  }else{
                    res.json({"status": 200, "error": null, "response": result});
                  }
          
                });

              }else{
                res.json({"status": 500, "error": "bad comic_id", "response": null});
              }
            }
          });
        }else{
          res.json({"status": 500, "error": "bad user_id", "response": null});
        }
      }
    });

  }

});

module.exports = router;