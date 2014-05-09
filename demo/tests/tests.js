test('callbacks test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');  

  var options = {"callbacks": {}};
  var initTest = false;
  var selectedTest = false;
  var deletedTest = false;
  options.callbacks.init = function () {
    initTest = true;
  }
  options.callbacks.select = function (op, json, data) {
    selectedTest = op === 'select' && typeof json === 'string' && typeof data === 'object';
  }
  options.callbacks.delete = function (op, json, data) {
    deletedTest = op === 'delete' && typeof json === 'string' && typeof data === 'object';
  }

  var Map  = $target.areaMapper(options);
  strictEqual(initTest, true, 'Init callback was called on instantiation.');

  Map.createArea('do', {
    "x": 100,
    "y": 200,
    "w": 300,
    "h": 200,
  })
  .selectArea('do');
  strictEqual(selectedTest, true, 'Select callback was called on selectArea().');

  Map.deleteArea('do');
  strictEqual(deletedTest, true, 'Delete callback was called on deleteArea().');
});

test('flags test', function() {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');  

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };

  var result = Map
  .createArea('do', subject)
  .createArea('re', {
    "x": 100,
    "y": 200,
    "w": 300,
    "h": 200,
  })
  .addFlag('do', 'breakfast'); 
  
  strictEqual(result, Map, 'addFlag() returns self.'); 

  var control = $.extend(subject, {
    "id": "do",
    "flags": {
      "breakfast": "breakfast"
    },
  });
  var area = Map.readArea('do');
  propEqual(area, control, '"breakfast" flag added on selectArea().');
  Map.refreshMap();
  ok($('#area-mapper-do').hasClass('area-mapper-breakfast'), '"breakfast" class appears on #do on refreshMap().');

  result = Map.removeFlag('do', 'breakfast').refreshMap();
  strictEqual(result, Map, 'removeFlag() returns self.'); 
  
  ok(!$('#area-mapper-do').hasClass('area-mapper-breakfast'), '"breakfast" class does not appear on #do on refreshMap().');

  Map
  .addFlag('do', 'bacon')
  .addFlag('re', 'bacon')
  .refreshMap();

  strictEqual($('.area-mapper-bacon').length, 2, 'Two elements have flag "bacon"');
  result = Map.removeFlagFromAll('bacon');
  strictEqual(result, Map, 'removeFlagFromAll() returns self.'); 

  Map.refreshMap();
  strictEqual($('.area-mapper-bacon').length, 0, 'No DOM elements with "bacon" flag after removeFlagFromAll().');
});


test('Select/Deselect test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');  

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };
  var control = $.extend(subject, {
    "id": "do",
    "flags": {},
  });

  var result = Map
  .createArea('do', subject)
  .selectArea('do');

  strictEqual(Map.state.selected, "do", 'state.selected is updated with id.');
  strictEqual(result, Map, 'selectArea() returns self.');

  control.flags.selected = "selected";
  var area = Map.readArea('do');
  propEqual(area, control, '"select" flag added on selectArea().');

  Map.refreshMap();
  ok($('#area-mapper-do').hasClass('area-mapper-selected'), 'selected class appears on #do on refreshMap().');

  // Select another area
  Map.createArea('re', {
    "x": 50,
    "y": 70,
    "w": 300,
    "h": 200,
  })
  .selectArea('re');
  strictEqual(Map.state.selected, "re", 'state.selected is updated with new element id on selectArea().');

  delete control.flags.selected;
  var area = Map.readArea('do');
  propEqual(area, control, '"select" flag was removed when new element selected.');

  Map.refreshMap();
  ok(!$('#area-mapper-do').hasClass('area-mapper-selected'), '"selected" class removed from #do on refreshMap().');
  ok($('#area-mapper-re').hasClass('area-mapper-selected'), '"selected" class appears on #re on refreshMap().');

  result = Map.deselectArea('re').refreshMap();
  strictEqual(result, Map, 'deselectArea() returns self.');
  strictEqual(Map.state.selected, null, 'state.selected is null after deselectArea().');
  strictEqual($('#area-mapper-selected').length, 0, "No DOM elements remain selected after deselectArea().");
});

test('CRUD area test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');  

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };
  var control = $.extend(subject, {
    "id": "do",
    "flags": {},
  });

  var result = Map.createArea('do', subject);
  strictEqual(result, Map, 'createArea() returns self.');
  strictEqual($('#area-mapper-do').length, 0, 'DOM element #do not present because not refreshMap().');

  var result = Map.readArea('do');
  propEqual(result, control, 'readArea() returns correct data object by id.');
  strictEqual($('#area-mapper-do').length, 0, 'DOM element #do not present because not refreshMap().');

  Map.refreshMap();
  var $area = $('#area-mapper-do');
  strictEqual($('#area-mapper-do').length, 1, 'DOM element #do appears on refreshMap().');
  equal($area.width(), 300, '#do width is correct.');
  equal($area.height(), 200, '#do height is correct.');
  equal($area.css('left'), "10px", '#do css left is correct.');
  equal($area.css('top'), "20px", '#do css top is correct.');

  subject = {
    "x": 15,
    "y": 25,
    "w": 305,
    "h": 205,
  }
  var result = Map.updateArea('do', subject);
  strictEqual(result, Map, 'createArea() returns self.');  

  equal($area.width(), 300, '#do width is still old value because no refreshMap().');
  
  Map.refreshMap();
  strictEqual($('#area-mapper-do').length, 1, 'DOM element #do is updated not duplicated on refreshMap().');
  equal($area.width(), 305, '#do width is correct.');
  equal($area.height(), 205, '#do height is correct.');
  equal($area.css('left'), "15px", '#do css left is correct.');
  equal($area.css('top'), "25px", '#do css top is correct.');

  var result = Map.deleteArea('do');
  strictEqual(result, Map, 'deleteArea() returns self.'); 

  strictEqual($('#area-mapper-do').length, 1, 'DOM element #do is present because not refreshMap().');
  Map.refreshMap();
  strictEqual($('#area-mapper-do').length, 0, 'DOM element #do was removed on refreshMap().');
});

test('cssPrefix test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');  

  var Map  = $target.areaMapper({
    "cssPrefix": "my-option-"
  });
  ok(Map);
  ok($target.hasClass('my-option-processed'));


  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');

  var rollback = $.fn.areaMapper.defaults;
  $.fn.areaMapper.defaults = {
    "cssPrefix": "my-default-"
  };
  var Map  = $target.areaMapper();
  ok(Map);
  ok($target.hasClass('my-default-processed'));
  $.fn.areaMapper.defaults = rollback;
});

test('instantiation test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit');

  var Map  = $target.areaMapper();
  ok(Map);
  ok($target.hasClass('area-mapper-processed'));
  
  var $wrapper = $('.area-mapper-container');
  ok($wrapper.length > 0);  
});

test('defaults test', function () {
  var defaults = $.fn.areaMapper.defaults;
  ok(defaults.confirm);
  strictEqual(defaults.callbacks.select, null);
  strictEqual(defaults.callbacks.delete, null);
  strictEqual(defaults.cssPrefix, 'area-mapper-');
});

test("version test", function () {
  var version = $.fn.areaMapper.version();
  ok(version);
});

QUnit.testDone(function () {
  // Removes any elements created during the test.
  $('.qunit, .area-mapper-container').remove();
  $('#area-mapper').hide();  
});
