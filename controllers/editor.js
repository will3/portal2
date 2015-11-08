var alphaNumeric = require('../utils/alphanumeric');
var fs = require('fs');
var libPath = require('path');
var vox = require('vox.js');
var parser = new vox.Parser();

module.exports = function(req, res) {
  res.render('index');
};