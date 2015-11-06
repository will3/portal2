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

var makeBlock = function() {
  return $('<div/>').addClass('cpr-block cpr-unselectable');
};



var cpr = function(options) {
  var root = $('<div/>');
  var lastBlock = null;

  var addBlock = function(color) {
    var block = makeBlock();
    block.css('background-color', color);
    if (lastBlock === null) {
      root.append(block);
    } else {
      block.insertAfter(lastBlock);
    }
    lastBlock = block;
  };

  var palette = options.palette || [];

  root.addClass('cpr-container cpr-unselectable');

  document.body.appendChild(root.get()[0]);

  for (var i = 0; i < palette.length; i++) {
    var color = tinycolor(palette[i]).toHexString();
    addBlock(color);
  }

  var preview = makeBlock().attr("id", "cpr-preview");
  root.append(preview);

  root.append($('<br>'));

  var placeholder = 'ffffff';

  var input = $('<input class="cpr-input" placeholder="f6f6f6" type="text"></i></input>');

  root.append(input);

  $(document).on('click', '.cpr-container .cpr-block', function() {
    var color = $(this).css('background-color');
    if (options.click !== undefined) {
      options.click(tinycolor(color));
    }
  });

  input.focus(function() {
    if (options.focus !== undefined) {
      options.focus();
    }
  });

  input.blur(function() {
    if (options.blur !== undefined) {
      options.blur();
    }
  });

  input.on('input', function() {
    var value = input.val();
    var color = tinycolor(value).toHexString();
    if (value.length >= 3) {
      preview.show();
    } else {
      preview.hide();
    }
    $('#cpr-preview').css('background-color', color);
  });

  input.keyup(function(e) {
    if (e.keyCode === 13) {
      var value = input.val();
      addBlock(tinycolor(value).toHexString());
      input.val('');
      preview.hide();
      input.blur();
    }
  });

  preview.hide();
};

module.exports = cpr;