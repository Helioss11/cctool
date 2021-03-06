var express = require('express');
var router = express.Router();

var path = require('path');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../', '/public/images/uploads'))
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
  
var upload = multer({storage: storage});

router.post('/', upload.single('image'), (req, res, next) => {
  if(typeof req.body != "undefined" && typeof req.body.category_id != "undefined" && typeof req.body.title != "undefined"){

    let assetData = {
      category_id: req.body.category_id,
      title: req.body.title,
      imageuri: 'images/uploads/' + req.file.filename
    };

    res.locals.pool.query('INSERT INTO asset SET ?', assetData, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        result.assetData = assetData;
        result.fileData = req.file;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }
});

router.get('/', function(req, res, next) {

    res.locals.pool.query('SELECT * FROM asset', function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        res.json({"status": 200, "error": null, "response": results});
      }
    });
  
});

router.get('/:id', function(req, res, next) {

    res.locals.pool.query('SELECT * FROM asset WHERE id = ?', req.params.id, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        res.json({"status": 200, "error": null, "response": results[0]});
      }
    });
  
});

router.put('/:id', function(req, res, next){

  res.locals.pool.query('SELECT * FROM asset WHERE id = ?', req.params.id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
        
      let lastUpdate = new Date();
      let update = '';

      update += " last_update = " + res.locals.pool.escape(lastUpdate)
      update += ", status = " + (typeof req.body.status != 'undefined' ? res.locals.pool.escape(req.body.status) : res.locals.pool.escape(results[0].status));
      update += ", category_id = " + (typeof req.body.category_id != 'undefined' ? res.locals.pool.escape(req.body.category_id) : res.locals.pool.escape(results[0].category_id));

      res.locals.pool.query('UPDATE asset SET ' + update + ' WHERE id = ' + req.params.id, function(error, result){

        if(error){
          res.json({"status": 500, "error": error, "response": null});
        }else{
          res.json({"status": 200, "error": null, "response": result});
        }

      });

    }
    });

});

router.delete('/:id', function(req, res, next) {

  res.locals.pool.query('DELETE FROM asset WHERE id = ?', req.params.id, function(error, results, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": results});
      // TODO delete file
    }
  });

});

module.exports = router;