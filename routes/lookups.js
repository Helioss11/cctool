var express = require('express');
var router = express.Router();

router.get('/country/:lang?', function(req, res, next) {
  
  let select = (req.params.lang && req.params.lang == 'en') ? " country_en country " : " country ";


  res.locals.pool.query(`SELECT id, ${select} FROM lu_contry_types WHERE status = 1 order by country`, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.get('/category/', function(req, res, next) {
  
  res.locals.pool.query(`SELECT id, category FROM lu_category_types WHERE status = 1`, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

router.get('/rol/', function(req, res, next) {
  
  res.locals.pool.query(`SELECT id, rol FROM lu_rol_types WHERE status = 1`, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
    }
  });
    
});

module.exports = router;
