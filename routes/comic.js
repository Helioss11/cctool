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

// TODO comics en galería

module.exports = router;