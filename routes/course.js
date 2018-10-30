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

router.post('/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined' && typeof req.body.name != 'undefined'){

    let pin = calculaPin();
    req.body.pin = pin;

    res.locals.connection.query('INSERT INTO course SET ?', req.body, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        result.courseData = req.body;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }

});

module.exports = router;