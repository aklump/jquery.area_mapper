var result, control = null;

test('getNextId', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');
  var Map  = $target.areaMapper();

  strictEqual(Map.getNextId(), 1, 'Initial getNextId() returns 1.');
  Map.createArea(1, {
    x: 100, y: 100, w: 100, h: 100
  });
  strictEqual(Map.getNextId(), 2, 'getNextId() returns 2.');
  Map.createArea('do', {
    x: 100, y: 100, w: 100, h: 100
  });
  Map.createArea('re', {
    x: 100, y: 100, w: 100, h: 100
  });
  Map.createArea('mi', {
    x: 100, y: 100, w: 100, h: 100
  });  
  strictEqual(Map.getNextId(), 2, 'getNextId() returns 2 when several non-numerics are created.');
  Map.createArea(14, {
    x: 100, y: 100, w: 100, h: 100
  });    
  strictEqual(Map.getNextId(), 15, 'getNextId() returns 16.');

});

test('saveAreaFromSelection', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var newTest = false;
  var options = {"callbacks": {"new": function (op, json, data) {
    newTest = op === 'new' && typeof json === 'string' && typeof data === 'object';
  }}};
  var Map  = $target.areaMapper(options);

  Map.selector.setSelection(45, 55, 65, 80);
  options = Map.selector.getOptions();
  options.show = true;
  Map.selector.setOptions(options);
  Map.selector.update();
  ok($('.imgareaselect-selection:visible').length, "Selector is visible in the DOM.");

  result = Map.saveAreaFromSelection('do');
  // strictEqual(result.id, 'do', 'saveAreaFromSelection() returns area object with correct id.');
  strictEqual(result, Map, 'saveAreaFromSelection() returns self.');

  ok(!$('.imgareaselect-selection:visible').length, "Selector is not visible in the DOM.");

  control = {"x": 45, "y": 55, "w": 20, "h": 25, "id": "do", "flags": {}};
  //   "changed": "changed",
  //   "selected": "selected"
  // }};
  propEqual(Map.readArea('do'), control, "Do area was created with correct params.")

  strictEqual(newTest, true, "new callback was called correctly.");

});

test('selecting test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var Map  = $target.areaMapper();

  ok(!$('.imgareaselect-selection:visible').length, "Selector is not visible in the DOM.");
  equal(Map.state.selectorOp, 'hidden', "selectorOp is 'hidden'");
  ok(!$('body').hasClass('am-selector-resizing'), "body doesn't have class selector-resizing.");
  ok(!$('body').hasClass('am-selector-selecting'), "body doesn't have class selector-selecting.");

  // Simulate the click and drag of creating new area
  Map.createArea('do', {
    x: 100, y: 100, w: 100, h: 100
  })
  .activateSelectionFromArea('do');
  result = Map.onSelectStart();
  strictEqual(result, Map, 'onSelectStart() returns self');
  Map.refreshMap();

  ok($('.imgareaselect-selection:visible').length, "Selector is visible");
  ok($('body').hasClass('am-selector-selecting'), 'body has class selector-selecting.');
  equal(Map.state.selectorOp, 'selecting', 'selectorOp is "selecting".')

  Map.state.selectorOp = 'resizing';
  Map.refreshMap();
  ok($('body').hasClass('am-selector-resizing'), 'body has class selector-resizing.');

  result = Map.onSelectEnd();
  strictEqual(result, Map, 'onSelectEnd() returns self');

  Map.selector.cancelSelection();
});

test('activateSelectionFromArea test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var Map  = $target.areaMapper();

  strictEqual(Map.activateSelectionFromArea('missing'), false, "Bad id returns false");
  Map
  .createArea('do', {
    "x": 75,
    "y": 85,
    "w": 95,
    "h": 105,
  });
  
  result = Map.activateSelectionFromArea('do');
  strictEqual(result, true, "Successful activation returns true."); 

  result = Map.selector.getSelection();
  control = {
    height: 105,
    width: 95,
    x1: 75,
    y1: 85,
    x2: 170,
    y2: 190,
  };
  propEqual(result, control);

  ok($('#am-do').hasClass('am-resizing'));
  ok($('.imgareaselect-selection:visible').length);

  result = Map.selectorCancel();
  strictEqual(result, Map, "selectorCancel() returns self.");

  strictEqual($('.am-resizing').length, 0, "No DOM elements have resizing class");
  ok(!$('.imgareaselect-selection:visible').length, "Selector is not visible in the DOM.");

});

test('callbacks test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var options = {"callbacks": {}};
  var initTest = false;
  var selectedTest = false;
  var deletedTest = false;
  var onSelectStartTest = false;
  var onSelectEndTest = false;

  options.callbacks.init = function () {
    initTest = true;
  }
  options.callbacks.select = function (op, json, data) {
    selectedTest = op === 'select' && typeof json === 'string' && typeof data === 'object';
  }
  options.callbacks.delete = function (op, json, data) {
    deletedTest = op === 'delete' && typeof json === 'string' && typeof data === 'object';
  }
  options.callbacks.onSelectStart = function (op, json, data) {
    onSelectStartTest = op === 'onSelectStart' && typeof json === 'string' && typeof data === 'object';
  }
  options.callbacks.onSelectEnd = function (op, json, data) {
    onSelectEndTest = op === 'onSelectEnd' && typeof json === 'string' && typeof data === 'object';
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

  result = Map.onSelectStart();
  strictEqual(result, Map);
  strictEqual(onSelectStartTest, true, 'onSelectStart callback was called on onSelectStart().');

  result = Map.onSelectEnd();
  strictEqual(result, Map);
  strictEqual(onSelectEndTest, true, 'onSelectEnd callback was called on onSelectEnd().');

});

test('flags test', function() {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };

  result = Map
  .createArea('do', subject)
  .createArea('re', {
    "x": 100,
    "y": 200,
    "w": 300,
    "h": 200,
  })
  .addFlag('do', 'breakfast'); 
  
  strictEqual(result, Map, 'addFlag() returns self.'); 

  control = $.extend(subject, {
    "id": "do",
    "flags": {
      "breakfast": "breakfast"
    },
  });
  var area = Map.readArea('do');
  propEqual(area, control, '"breakfast" flag added on selectArea().');
  Map.refreshMap();
  ok($('#am-do').hasClass('am-breakfast'), '"breakfast" class appears on #do on refreshMap().');

  result = Map.removeFlag('do', 'breakfast').refreshMap();
  strictEqual(result, Map, 'removeFlag() returns self.'); 
  
  ok(!$('#am-do').hasClass('am-breakfast'), '"breakfast" class does not appear on #do on refreshMap().');

  Map
  .addFlag('do', 'bacon')
  .addFlag('re', 'bacon')
  .refreshMap();

  strictEqual($('.am-bacon').length, 2, 'Two elements have flag "bacon"');
  result = Map.removeFlagFromAll('bacon');
  strictEqual(result, Map, 'removeFlagFromAll() returns self.'); 

  Map.refreshMap();
  strictEqual($('.am-bacon').length, 0, 'No DOM elements with "bacon" flag after removeFlagFromAll().');
 });


test('Select/Deselect test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };
  control = $.extend(subject, {
    "id": "do",
    "flags": {},
  });

  result = Map
  .createArea('do', subject)
  .selectArea('do');

  strictEqual(Map.state.selected, "do", 'state.selected is updated with id.');
  strictEqual(result, Map, 'selectArea() returns self.');

  control.flags.selected = "selected";
  var area = Map.readArea('do');
  propEqual(area, control, '"select" flag added on selectArea().');

  Map.refreshMap();
  ok($('#am-do').hasClass('am-selected'), 'selected class appears on #do on refreshMap().');

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
  ok(!$('#am-do').hasClass('am-selected'), '"selected" class removed from #do on refreshMap().');
  ok($('#am-re').hasClass('am-selected'), '"selected" class appears on #re on refreshMap().');

  result = Map.deselectArea('re').refreshMap();
  strictEqual(result, Map, 'deselectArea() returns self.');
  strictEqual(Map.state.selected, null, 'state.selected is null after deselectArea().');
  strictEqual($('#am-selected').length, 0, "No DOM elements remain selected after deselectArea().");
});

test('CRUD area test', function () {
  result;
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test'); 

  var Map  = $target.areaMapper();
  var subject = {
    "x": 10,
    "y": 20,
    "w": 300,
    "h": 200,
  };
  control = $.extend(subject, {
    "id": "do",
    "flags": {},
  });

  result = Map.readArea('do');

  strictEqual(result, false, "Trying to read an area that doesn't exist returns false.");

  result = Map.createArea('do', subject);
  strictEqual(result, Map, 'createArea() returns self.');
  strictEqual($('#am-do').length, 0, 'DOM element #do not present because not refreshMap().');

  result = Map.readArea('do');
  propEqual(result, control, 'readArea() returns correct data object by id.');
  strictEqual($('#am-do').length, 0, 'DOM element #do not present because not refreshMap().');

  Map.refreshMap();
  var $area = $('#am-do');
  strictEqual($('#am-do').length, 1, 'DOM element #do appears on refreshMap().');
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
  result = Map.updateArea('do', subject);
  strictEqual(result, Map, 'createArea() returns self.');  

  equal($area.width(), 300, '#do width is still old value because no refreshMap().');
  
  Map.refreshMap();
  strictEqual($('#am-do').length, 1, 'DOM element #do is updated not duplicated on refreshMap().');
  equal($area.width(), 305, '#do width is correct.');
  equal($area.height(), 205, '#do height is correct.');
  equal($area.css('left'), "15px", '#do css left is correct.');
  equal($area.css('top'), "25px", '#do css top is correct.');

  result = Map.deleteArea('do');
  strictEqual(result, Map, 'deleteArea() returns self.'); 

  strictEqual($('#am-do').length, 1, 'DOM element #do is present because not refreshMap().');
  Map.refreshMap();
  strictEqual($('#am-do').length, 0, 'DOM element #do was removed on refreshMap().');
});

test('cssPrefix test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');  

  var Map  = $target.areaMapper({
    "cssPrefix": "my-option-"
  });
  ok(Map);
  ok($target.hasClass('my-option-processed'));


  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');

  var rollback = $.extend({}, $.fn.areaMapper.defaults);
  $.fn.areaMapper.defaults.cssPrefix = "my-default-";
  var Map  = $target.areaMapper();
  ok(Map);
  ok($target.hasClass('my-default-processed'));
  $.fn.areaMapper.defaults = rollback;
});

test('instantiation test', function () {
  var $target = $('#area-mapper')
  .clone()
  .appendTo($('body'))
  .addClass('qunit-test');

  var Map  = $target.areaMapper();
  ok(Map);
  ok($target.hasClass('am-processed'));
  ok($('body').hasClass('am-processed'));

  ok(Map.$container.hasClass('am-container'), 'Map.$container is holds the wrapper element.');
  
  var $wrapper = $('.am-container');
  ok($wrapper.length > 0);  
});

test('defaults test', function () {
  var defaults = $.fn.areaMapper.defaults;
  ok(defaults.confirm);
  strictEqual(defaults.callbacks.select, null);
  strictEqual(defaults.callbacks.delete, null);
  strictEqual(defaults.cssPrefix, 'am-');
});

test("version test", function () {
  var version = $.fn.areaMapper.version();
  ok(version);
});

QUnit.testStart(function () {
  result = null;
  control = null;
  $('*').data('plugin_areaMapper', '');
});
QUnit.testDone(function () {

  // Destroy the areaMapper object.
  var Map = $('.qunit-test').data('plugin_areaMapper', '');

  // Removes any elements created during the test.
  $('.qunit-test, .am-container').remove();
  $('#area-mapper').hide();  
});
