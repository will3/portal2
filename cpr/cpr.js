var $ = require('jquery');
var tinycolor = require('tinycolor2');

function invertColor(hexTripletColor) {
  var color = hexTripletColor;
  color = color.substring(1); // remove #
  color = parseInt(color, 16); // convert to integer
  color = 0xFFFFFF ^ color; // invert three bytes
  color = color.toString(16); // convert to hex
  color = ("000000" + color).slice(-6); // pad with leading zeros
  color = "#" + color; // prepend #
  return color;
}

var cpr = function(options) {
  var palette = options.palette || [];

  var root = $('<div/>');
  root.addClass('cpr-container');

  document.body.appendChild(root.get()[0]);

  for (var i = 0; i < palette.length; i++) {
    var color = tinycolor(palette[i]);

    var block = $('<div/>').addClass('cpr-block');
    block.css('background-color', color.toHexString());
    root.append(block);
  }

  var placeholder = 'ffffff';

  $(document).on('click', '.cpr-container .cpr-block', function() {
    var color = $(this).css('background-color');
    if (options.click !== undefined) {
      options.click(tinycolor(color));
    }
  });
};

module.exports = cpr;