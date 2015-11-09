var collision = require('../core/systems/collision');
var expect = require('chai').expect;

describe('collision', function() {
  it('should visit same pair of bodies once', function() {
    var c = collision();
    var a = {
      _id: 'a',
      group: 'default',
      masks: ['default']
    };
    var b = {
      _id: 'b',
      group: 'default',
      masks: ['default']
    };

    c.addBody(a);
    c.addBody(b);

    var count = 0;
    c.traverse(function(a, b) {
      count++;
    });

    expect(count).to.equal(1);
  });

  it('should not visit bodies with no matching masks', function() {
    var c = collision();
    var a = {
      _id: 'a',
      group: '1',
      masks: '1'
    };
    var b = {
      _id: 'b',
      group: '2',
      masks: '2'
    };

    c.addBody(a);
    c.addBody(b);

    var count = 0;	
    c.traverse(function(a, b) {
    	count ++;
    });

    expect(count).to.equal(0);
  });

  it('should visit matching masks', function(){
  	var c = collision();
  	var a = {
      _id: 'a',
      group: '1',
      masks: '2'
    };
    var b = {
      _id: 'b',
      group: '2',
      masks: '1'
    };
    
    c.addBody(a);
    c.addBody(b);

    var count = 0;	
    c.traverse(function(a, b) {
    	count ++;
    });

    expect(count).to.equal(1);
  });
});