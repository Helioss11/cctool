var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../', '/public/comics'))
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
  
var upload = multer({storage: storage});

router.post('/uploadthumbnail', upload.single('jpg'), (req, res, next) => {
  if(typeof req.body != 'undefined' && typeof req.body.user_comic_id != 'undefined'){

    let comicData = {
      user_comic_id: req.body.user_comic_id,
      thumbUri: 'comics/' + req.file.filename
    }

    res.locals.pool.query(`UPDATE user_comic SET thumbnail = '${comicData.thumbUri}' WHERE id = ${comicData.user_comic_id}`, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        result.comicData = comicData;
        result.fileData = req.file;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }
});

router.post('/uploadpdf', upload.single('pdf'), (req, res, next) => {
  if(typeof req.body != "undefined" && typeof req.body.user_comic_id != "undefined"){

    let comicData = {
      user_comic_id: req.body.user_comic_id,
      comicuri: 'comics/' + req.file.filename
    };

    res.locals.pool.query(`UPDATE user_comic SET file = '${comicData.comicuri}' WHERE id = ${comicData.user_comic_id}`, function(error, result){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        result.comicData = comicData;
        result.fileData = req.file;
        res.json({"status": 200, "error": null, "response": result});
      }
    });

  }else{
    res.json({"status": 500, "error": "incomplete parameters"});
  }
});

router.get('/', function(req, res, next){

  res.locals.pool.query(`SELECT id, user_id, title, code, file, thumbnail, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic WHERE status = true`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.get('/gallery', function(req, res, next){

  res.locals.pool.query(`SELECT id, user_id, title, code, file, thumbnail, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic 
  WHERE in_gallery = true 
  AND status = true`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.post('/gallery', function(req, res, next){

  let ands = ' uc.status = true ';

  if(typeof req.body != 'undefined'){
    ands += typeof req.body.username != 'undefined' ? ` AND uu.username LIKE '%${req.body.username}%' ` : '';
    ands += typeof req.body.gender != 'undefined' ? ` AND uu.gender = '${req.body.gender}' ` : '';
    ands += typeof req.body.country != 'undefined' ? ` AND cc.country LIKE '%${req.body.country}%' ` : '';
    ands += typeof req.body.comic_title != 'undefined' ? ` AND uc.title LIKE '%${req.body.comic_title}%' ` : '';
    ands += typeof req.body.course_name != 'undefined' ? ` AND co.name LIKE '%${req.body.course_name}%' ` : '';
    ands += typeof req.body.course_pin != 'undefined' ? ` AND co.pin = '${req.body.course_pin}' ` : '';
    ands += typeof req.body.in_gallery != 'undefined' ? ` AND uc.in_gallery = ${req.body.in_gallery} ` : '';
  }

  res.locals.pool.query(`select uc.id user_comic_id, uc.user_id, uu.username, uu.gender, uu.country_id, cc.country,
  uc.title comic_title, uc.file, IFNULL(uc.thumbnail, '') thumbnail, uc.course_id, IFNULL(co.name, '') course_name, 
  IFNULL(co.pin, '') course_pin, uc.in_gallery, uc.code, uc.register_at, uu.last_update
  from user_comic uc
  inner join users uu on uc.user_id = uu.id
  inner join lu_contry_types cc on uu.country_id = cc.id
  left join course co on uc.course_id = co.id
  WHERE ${ands}`, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      if(result.length > 0){
        res.json({"status": 200, "error": null, "response": result});
      }else{
        res.json({"status": 200, "error": "No se encuentra información con los parámetros de búsqueda", "response": result});
      }
    }
  });

});

router.get('/:id', function(req, res, next){

  res.locals.pool.query(`SELECT id, user_id, title, code, file, thumbnail, course_id, in_gallery, status, register_at, last_update 
  FROM user_comic WHERE id = ? AND status = true`, req.params.id, function(error, result, fields){
    if(error){
      res.json({"status": 500, "error": error, "response": null});
    }else{
      res.json({"status": 200, "error": null, "response": result});
    }
  });

});

router.put('/', function(req, res, next){

  if(typeof req.body != 'undefined' && typeof req.body.user_id != 'undefined' && typeof req.body.comic_id != 'undefined'){

    res.locals.pool.query(`SELECT * FROM users WHERE id = ?`, req.body.user_id, function(error, results, fields){
      if(error){
        res.json({"status": 500, "error": error, "response": null});
      }else{
        if(results.length > 0){
          res.locals.pool.query(`SELECT * FROM user_comic WHERE id = ${req.body.comic_id} AND user_id = ${req.body.user_id} AND status = true`, function(error, result, fields){
            if(error){
              res.json({"status": 500, "error": error, "response": null});
            }else{
              if(result.length > 0){

                let lastUpdate = new Date();
                let update = '';
                let status = result[0].status;

                if(typeof req.body.status != 'undefined'){
                  if(req.body.status == "True"){
                    status = true;
                  }else{
                    status = false;
                  }
                }

                update += " last_update = " + res.locals.pool.escape(lastUpdate);
                update += ", title = " + (typeof req.body.title != 'undefined' ? res.locals.pool.escape(req.body.title) : res.locals.pool.escape(result[0].title));
                update += ", code = " + (typeof req.body.code != 'undefined' ? res.locals.pool.escape(req.body.code) : res.locals.pool.escape(result[0].code));
                update += ", file = " + (typeof req.body.file != 'undefined' ? res.locals.pool.escape(req.body.file) : res.locals.pool.escape(result[0].file));
                update += ", course_id = " + (typeof req.body.course_id != 'undefined' && req.body.course_id > 0 ? res.locals.pool.escape(req.body.course_id) : res.locals.pool.escape(result[0].course_id));
                update += ", in_gallery = " + (typeof req.body.in_gallery != 'undefined' ? res.locals.pool.escape(req.body.in_gallery) : res.locals.pool.escape(result[0].in_gallery));
                update += ", status = " + status;

                res.locals.pool.query('UPDATE user_comic SET ' + update + ' WHERE id = ' + req.body.comic_id, function(error, result){

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