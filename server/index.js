var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = 'KUNew'



app.use(cors())
app.use(express.json())

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'cactus'
  });


app.post('/register', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        connection.execute(
            'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)',
            [req.body.email, hash, req.body.fname, req.body.lname],
            function(err, results, fields) {
                if (err) {
                    res.json({status: 'error', message: err})
                    return
                }
                res.json({status: 'ok'})
            }
        );
    });
})



app.post('/login', jsonParser, function (req, res, next) {
    connection.execute(
        'SELECT * FROM users WHERE email=?',
        [req.body.email],
        function(err, users, fields) {
            if (err) { res.json({status: 'error', message: err}); return }
            if (users.length === 0) { res.json({status: 'error', message: 'no user found'}); return }
            bcrypt.compare(req.body.password, users[0].password, function(err, isLogin) {
                // result == true
                if (isLogin) {
                    var token = jwt.sign({ email: users[0].email }, secret,  { expiresIn: '1h' });
                    res.json({status: 'ok', message: 'login success', token})                   
                } else {
                    res.json({status: 'error', message: 'login fail'})
                }
            });
        }
    );
})

// app.post('/login/admin', jsonParser, function (req, res, next) {
//     connection.execute(
//         'SELECT * FROM admin WHERE email=?',
//         [req.body.email],
//         function(err, users, fields) {
//             if (err) { res.json({status: 'error', message: err}); return }
//             if (users.length === 0) { res.json({status: 'error', message: 'no user found'}); return }
//             bcrypt.compare(req.body.password, users[0].password, function(err, isLogin) {
//                 // result == true
//                 if (isLogin) {
//                     var token = jwt.sign({ email: users[0].email }, secret,  { expiresIn: '1h' });
//                     res.json({status: 'ok', message: 'login success', token})                   
//                 } else {
//                     res.json({status: 'error', message: 'login fail'})
//                 }
//             });
//         }
//     );
// })


app.post('/authen', jsonParser, function (req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1]
        var decoded = jwt.verify(token, secret);
        res.json({status: 'ok', decoded})
    } catch(err) {
        res.json({status: 'error', message: err.message})
    }
})


app.get('/api/protected', (req, res) => {
    const token = req.headers.authorization.split(' ')[1]
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Verify the token.
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token is invalid' });
      }
      res.status(200).json({ message: 'Protected resource accessed', decoded });
    });
  });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/users', function (req, res, next){
    connection.query(
        'SELECT * FROM `users`',
        function(err, results, fields) {
          res.send(results)
        }
    );
})


app.get('/users/:id', function (req, res, next){
    const id = req.params.id;
    connection.query(
        'SELECT * FROM `users` WHERE `id` = ?',
        [id],
        function(err, results) {
            res.json(results);
        }
    );
})

app.put('/update', function (req, res, next) {
    connection.query(
        'UPDATE `users` SET `email`=?, `fname`=?, `lname`=? WHERE id = ?',
        [req.body.email, req.body.fname, req.body.lname, req.body.id],
        function(err, results) {
            res.json(results);
            //res.json({status: 'ok', user: results});
        }
    );
})


app.delete('/delete', function (req, res, next) {
    connection.query(
        'DELETE FROM `users` WHERE id=?',
        [req.body.id],
        function(err, results) {
            res.status(200).send({
                "status": "ok",
                "message": "Delete Success"
              });
        }
    );
})











app.get('/news', function (req, res, next){
    connection.query(
        'SELECT * FROM `news`',
        function(err, results, fields) {
          res.send(results)
        }
    );
})

app.get('/news/:id', function (req, res, next) {
    const id = req.params.id;
    connection.query(
      'SELECT * FROM `news` WHERE `id` = ?',
      [id],
      function(err, results) {
        res.json(results);
      }
    );
  })

app.post('/create/news', function (req, res, next) {
    connection.query(
        'INSERT INTO news (scientific, head, physical, propagation, img) VALUES (?, ?, ?, ?, ?)',
        [req.body.scientific, req.body.head, req.body.physical, req.body.propagation, req.body.img],
        function(err, results) {
            if (err) {
                res.send({status: false, message: 'create fail'})
            } else {
                res.send({status: true, message: 'create success'})
            }
          //res.json(results);
        }
    )
})

app.put('/update/news', function (req, res, next) {
    connection.query(
      'UPDATE `news` SET `scientific`= ?, `head`= ?, `content`= ?, `img`= ? WHERE id = ?',
      [req.body.scientific, req.body.head, req.body.content, req.body.img, req.body.id],
      function(err, results) {
        res.json(results);
      }
    );
  })

  app.delete('/delete/news', function (req, res, next) {
    connection.query(
        'DELETE FROM `news` WHERE id=?',
        [req.body.id],
        function(err, results) {
            res.status(200).send({
                "status": "ok",
                "message": "Delete Success"
              });
        }
    );
})







///////////////////admin
// app.get('/users', function (req, res, next) {
//     const page = parseInt(req.query.page);
//     const per_page = parseInt(req.query.per_page);
//     const start_idx = ( page - 1 ) * per_page;
//     const search = req.query.search;
//     const sort_column = req.query.sort_column;
//     const sort_direction = req.query.sort_direction;
//     var params = [];
//     var sql = 'SELECT * FROM users ';
//     if (search) {
//         sql += ' WHERE fname LIKE ?'
//         params.push('%'+search+'%')
//     }
//     if (sort_column) {
//        sql += ' ORDER BY '+sort_column+' '+sort_direction;
//     } 
//     sql += ' LIMIT ?, ?'
//     params.push(start_idx)
//     params.push(per_page)
//     connection.execute(sql, params,
//             function(err, results, fields) {
//                 console.log(results);         
//                 connection.query(
//                     'SELECT COUNT(id) as total FROM users',
//                     function(err, counts, fields) {
//                         const total = counts[0]['total'];
//                         const total_pages = Math.ceil(total/per_page)
//                         res.json({
//                             page: page,
//                             per_page: per_page,
//                             total: total,
//                             total_pages: total_pages,
//                             data: results
//                         })
//                     }
//                 );
//             }
//         );
//     })


app.listen(3333, jsonParser, function () {
  console.log('CORS-enabled web server listening on port 3333')
})