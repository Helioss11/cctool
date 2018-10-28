var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/country', function(req, res, next) {
  
  res.locals.connection.query(`SELECT * FROM lu_contry_types`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

module.exports = router;
