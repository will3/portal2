var alphaNumeric = require('../utils/alphanumeric');
var fs = require('fs');
var libPath = require('path');
var vox = require('vox.js');
var parser = new vox.Parser();

module.exports = function(req, res) {

  console.log(req.params);
  var user = req.params['user'];
  var name = req.params['name'];

  if (!alphaNumeric.test(user)) {
    throw new Error('invalid user: ' + user);
  }

  if (!alphaNumeric.test(name)) {
    throw new Error('invalid name: ' + name);
  }

  var basePath = libPath.join(__dirname, '../.store');
  var path = libPath.join(basePath, escape(user), escape(name));

  fs.readFile(path, 'utf8', function(err, data) {
    if (err) {
      console.log(err);
      data = '';
    }

    var formdata = {
      data: data,
      name: name,
      user: user
    };

    res.render('index', {
      formdata: JSON.stringify(formdata)
    });
  });

};