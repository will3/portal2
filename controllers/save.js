var fs = require('fs');
var libPath = require('path');
var mkdirp = require('mkdirp');
var alphaNumeric = require('../utils/alphanumeric');

module.exports = function(req, res) {
  var body = req.body;
  var user = body.user;
  var name = body.name;
  var data = body.data;

  if (!alphaNumeric.test(user)) {
    throw new Error('invalid user: ' + user);
  }

  if (!alphaNumeric.test(name)) {
    throw new Error('invalid name: ' + name);
  }

  var basePath = libPath.join(__dirname, '../.store');
  var path = libPath.join(basePath, escape(user), escape(name));

  mkdirp(path, function(err) {
    if (err) throw err;
    fs.writeFile(libPath.join(path, 'data'), data, function(err) {
      if (err) throw err;
      res.end('OK');
    });
  });
};