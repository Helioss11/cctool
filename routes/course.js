var express = require('express');
var router = express.Router();

var calculaPin = function(){

  let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let res = "";

  for(let i =0; i < 6; i++){
    res += chars[Math.floor(Math.random() * (chars.length - 0)) + 0];
  }

  return res.toLowerCase();

}

var getCourse = function(id, res, callback){

  res.locals.connection.query(`SELECT * FROM course WHERE id = ?`, id, function(error, results, fields){

    if(error){
      callback(error, null);
    }else{
      callback(null, results);
    }

  });

};

router.get('/', function(req, res, next) {
  
  res.locals.connection.query(`SELECT * FROM course WHERE status = 1`, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.get('/:id', function(req, res, next) {
  
  res.locals.connection.query(`SELECT * FROM course WHERE id = ?`, req.params.id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.get('/pin/:pin', function(req, res, next) {
  
  res.locals.connection.query(`SELECT * FROM course WHERE pin = ?`, req.params.pin, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.get('/user/:user_id', function(req, res, next) {
  
  res.locals.connection.query(`SELECT * FROM course WHERE user_id = ?`, req.params.user_id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.post('/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined' && typeof req.body.name != 'undefined'){

    let pin = calculaPin();
    req.body.pin = pin;
    delete req.body.token;

    res.locals.connection.query('INSERT INTO course SET ?', req.body, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{

        req.body.course_id = result.insertId;
        getCourse(result.insertId, res, function(error, results){
          if(!error){
            result.courseData = results[0];
            res.json({"status": 200, "error": null, "response": result});
          }
        });

      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.post('/evaluation/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.course_id != 'undefined' && 
  typeof req.body.user_comic_id != 'undefined' &&
  typeof req.body.icon != 'undefined' &&
  typeof req.body.comments != 'undefined' &&
  typeof req.body.stars != 'undefined'){

    res.locals.connection.query(`SELECT * FROM course WHERE id = ?`, req.body.course_id, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        
        if(results.length){
          res.locals.connection.query(`SELECT * FROM user_comic WHERE id = ?`, req.body.user_comic_id, function(error, results, fields){
            if(error){
              res.json({"status": 500, "error": error, "response": null});
            }else{
              
              if(results.length){

                delete req.body.token;
                res.locals.connection.query('INSERT INTO course_evaluation SET ?', req.body, function(error, result){
                  if(error){
                    res.json({"status": 500, "error": error, "response": null});
                  }else{
                    req.body.course_evaluation_id = result.insertId;
                    result.courseEvaluationData = req.body;
                    res.json({"status": 200, "error": null, "response": result});
                  }
                });

              }else{
                res.json({"status": 500, "error": "user_comic_id does not exists", "response": null});
              }
              
            }
          });
        }else{
          res.json({"status": 500, "error": "course_id does not exists", "response": null});
        }
        
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

router.put('/evaluation/:id', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.course_evaluation_id != 'undefined'){

    res.locals.connection.query(`SELECT * FROM course_evaluation WHERE id = ?`, req.body.course_evaluation_id, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(results.length){

          delete req.body.token;
          let lastUpdate = new Date();
          let update = '';

          update += " last_update = " + res.locals.connection.escape(lastUpdate);
          update += ", icon = " + (typeof req.body.icon != 'undefined' ? res.locals.connection.escape(req.body.icon) : result[0].icon);
          update += ", comments = " + (typeof req.body.comments != 'undefined' ? res.locals.connection.escape(req.body.comments) : result[0].comments);
          update += ", stars = " + (typeof req.body.stars != 'undefined' ? res.locals.connection.escape(req.body.stars) : result[0].stars);

          res.locals.connection.query('UPDATE course_evaluation SET ' + update + ' WHERE id = ' + req.body.course_evaluation_id, function(error, result){

            if(error){
              res.json({"status": 500, "error": error, "response": null});
            }else{
              res.json({"status": 200, "error": null, "response": result});
            }
    
          });

        }else{
          res.json({"status": 500, "error": "course_evaluation_id does not exists", "response": null});
        }
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

module.exports = router;