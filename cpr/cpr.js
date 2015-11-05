var $ = require('jquery');
var tinycolor = require('tinycolor2');

var cpr = function(options) {
  var palette = options.palette || [];

  var root = $('<div/>');
  root.addClass('cpr-container');

  document.body.appendChild(root.get()[0]);

  for (var i = 0; i < palette.length; i++) {
    var color = tinycolor(palette[i]);

    var block = $('<div/>').addClass('cpr-block');
    block.css("background-color", color.toHexString());
    root.append(block);
  }

  $(document).on('click', '.cpr-container .cpr-block', function() {
    var color = $(this).css('background-color');
    if (options.click !== undefined) {
      options.click(tinycolor(color));
    }
  });
};

module.exports = cpr;