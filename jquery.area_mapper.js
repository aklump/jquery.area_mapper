/**
 * Area Mapper jQuery JavaScript Plugin v0.1.2
 * 
 *
 * jQuery plugin providing a CRUD UI for defining areas over an image.
 *
 * Copyright 2013, Aaron Klump
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Thu Oct 23 07:18:23 PDT 2014
 */
;(function($, window, document, undefined) {
"use strict";

// The actual plugin constructor
function AreaMapper(element, options) {
  this.element = element;

  // Holds the image element this is applied to.
  this.element = element;

  // Holds the containing element as a jquery object.
  this.$container = null;

  // An area to hold all the created area objects.
  this.areas = [];

  // Will hold the instance of imgAreaSelect
  this.selector = null;

  // An object to hold various states of the AreaMapper object.
  this.state = {

    // The current operation
    "op": 'create',

    // The id of the currently selected area
    "selected": null,
    
    // hidden, selecting, resizing, 
    "selectorOp": 'hidden',
  };

  // An object to hold render instructions such as dom objects that have
  // been deleted and need to be removed.
  this.render = {
    // An array of jquery selectors to be removed on next refresh.
    "remove": [],

    // An array of elements and flags to remove on next refresh.
    "removeFlag": []
  };

  // jQuery has an extend method that merges the 
  // contents of two or more objects, storing the 
  // result in the first object. The first object 
  // is generally empty because we don't want to alter 
  // the default options for future instances of the plugin
  this.options = $.extend({}, $.fn.areaMapper.defaults, options);  

  this.init();
  this.initControls();
}

AreaMapper.prototype = {

  onSelectStart: function (img, selection) {
    var Map = this;

    if (Map.state.selectorOp === 'hidden') {
      Map.state.selectorOp = 'selecting';
    }

    Map.deselectArea().refreshMap();

    Map.callbackInvoke('onSelectStart', {});

    return this;
  },

  /**
   * onSelectEnd handler for imgareaselect.
   *
   * @param  {jQuery} img       The image that has been subselected.
   * @param  {object} selection An object of selection coordinates.
   *   - x1
   *   - y1   coordinates of the top left corner of the selected area
   *   - x2
   *   - y2   coordinates of the bottom right corner of the selected area
   *   - width  selection width
   *   - height   selection height
   *
   * @return {[type]}           [description]
   */
  onSelectEnd: function (img, selection) {
    var Map = this;

    if (Map.state.selectorOp === 'selecting') {
      Map.state.selectorOp = 'selected';
    }

    Map.showControls().refreshMap();

    var data = {};
    if (typeof selection !== "undefined") {
      data = {
        x: selection.x1,
        y: selection.y1,
        w: selection.width,
        h: selection.height,        
      };
    }

    Map.callbackInvoke('onSelectEnd', data);

    return this;
  },

  // onSelectCancel: function () {
  //   var Map = this;
  //   Map
  //   .deselectArea()
  //   .hideControls()
  //   .selectorCancel()
  // },

  selectorCancel: function () {
    var Map = this;

    Map.selector.cancelSelection();
    
    Map.state.selectorOp = 'hidden';
    Map
    .removeFlagFromAll('resizing')
    .deselectArea()
    .hideControls()    
    .refreshMap();

    Map.callbackInvoke('onSelectCancel', {});    

    return this;
  },

  /**
   * Creats a new area using id from the current selection.
   *
   * @param  {string} id The id of the area about to be created.
   *
   * @return {self}    
   */
  saveAreaFromSelection: function (id) {
    var Map = this;
    var data = Map.readArea(id);
    var callback = 'onUpdate';
    if (data === false) {
      Map.createArea(id, {});
      data = {};
      callback = 'onCreate';
    };

    var coordinates = Map.selector.getSelection();
    data.x = coordinates.x1;
    data.y = coordinates.y1;
    data.w = coordinates.width;
    data.h = coordinates.height;

    Map.state.selectorOp = 'hidden';
    Map
    .updateArea(id, data)
    .refreshMap();

    Map.selector.cancelSelection();

    var area = Map.readArea(id);
    Map.callbackInvoke(callback, area);

    return this;
  },

  /**
   * Return the next numeric insert id
   *
   * @return {int}
   */ 
  getNextId: function () {
    var Map = this;
    var next = 0;
    for (var i in Map.areas) {
      if(parseInt(i, 10) > 0) {      
        next = Math.max(next, i);
      }
    };
    next += 1;

    return next;
  },

  /**
   * Converts an area into a resizing area and sets the selector.
   *
   * @param  {string} id
   *
   * @return {bool}
   */
  activateSelectionFromArea: function (id) {
    var Map = this;
    var data = Map.readArea(id);
    if (data === false) {
      return false;
    };

    Map.selector.setSelection(data.x, data.y, data.x + data.w, data.y + data.h);
    Map.addFlag(id, 'resizing');
    Map.selector.update();

    var options = Map.selector.getOptions();
    options.show = true;
    Map.selector.setOptions(options);

    $(Map.options.controls.updateTrigger).show();
    $(Map.options.controls.updateCancel).show();

    Map.refreshMap();

    return true;
  },

  /**
   * Create (or overwrite) a map area by id.
   *
   * @param  {string} id
   * @param  {object} data
   *   If an area by this idea already exists, it will be deleted first.  Only
   *   the values of data will be written to it.  Constrast this with
   *   this.updateArea, which will merge.
   *
   * @return {this}
   */
  createArea: function (id, data) {
    this.areas[id] = {};

    return this.updateArea(id, data);
  },

  /**
   * Read a map area
   *
   * @param  {string} id
   *
   * @return {object||false}
   */
  readArea: function (id) {
    return typeof this.areas[id] === "undefined" ? false : this.areas[id];
  },

  /**
   * Update a map area by id
   *
   * @param  {string} id   The unique id for the area.
   * @param  {object} area One or more properties to add to the area.
   *   You may pass only the y property to update just that value if you like.
   *   Any value that is not passed will be taken from the previously stored
   *   version; new values will overrite the old.
   *
   * @return {this}
   */
  updateArea: function (id, area) {
    var stored = this.readArea(id);
    if (stored) {
      if (typeof area === "string") {
        area = $.parseJSON(area);
      }
      // area.id = id;
      this.areas[id] = $.extend({
        "x": null,
        "y": null,
        "w": null,
        "h": null,
        "flags": {},
      }, stored, area, {
        "id": id
      });
    }

    return this;
  },

  /**
   * Delete an area by id.
   *
   * @param  {string} id
   *
   * @return {this}
   */
  deleteArea: function(id) {
    var Map = this;
    var area = Map.readArea(id);
    if (area) {
      Map.areas[id] = null;
      Map.render.remove.push($('#' + Map.options.cssPrefix + area.id));
      Map
      .hideControls()
      .callbackInvoke('delete', area);
    }

    return this;
  },

  /**
   * This is different from deleteArea in that it only unsets an area.
   *
   * @param  {int} id 
   *
   * @return {this}    
   */
  unsetArea: function(id) {
    var Map = this;
    Map.areas[id] = null;
    Map.render.remove.push($('#' + Map.options.cssPrefix + id));

    return this;    
  },

  /**
   * Cause a single area to be the selected area, firing callbacks, etc.
   *
   * You will need to call refreshMap at some point to update the DOM.
   *
   * @param  {string} id
   *
   * @return {this}
   */
  selectArea: function (id) {
    var Map = this;
    var area = Map.readArea(id);
    if (area && area.id !== Map.state.selected) {
      var flag = 'selected';
      Map.removeFlagFromAll(flag);
      Map.addFlag(id, flag);
      Map.state.selected = id;
      Map.state.op = 'update';

      Map.showControls();

      Map.callbackInvoke('select', area);
    }

    return this;
  },

  deselectArea: function (id) {
    var Map = this;
    if (typeof id === "undefined") {
      id = Map.state.selected;
    };
    var area = Map.readArea(id);
    Map.removeFlag(id, 'selected');
    Map.state.selected = null;
    Map.state.op = 'create';

    Map.callbackInvoke('deselect', area);

    return this;    
  },


  /**
   * Add an arbitrary flag to an area.
   *
   * @param {string} id
   * @param {string} flag  The flag to remove.
   *
   * @return {this}
   */
  addFlag: function (id, flag) {
    if (this.readArea(id)) {
      this.areas[id].flags[flag] = flag;
    }

    return this;
  },
  
  /**
   * Remove an arbitrary flag from an area.
   *
   * @param  {string} id
   * @param  {string} flag  The flag to remove.
   *
   * @return {this}
   */
  removeFlag: function (id, flag) {
    if (this.readArea(id)) {
      delete this.areas[id].flags[flag];
      this.render.removeFlag.push([id, flag]);
    }

    return this;
  },

  /**
   * Remove a single flag from all areas.
   *
   * @param  {string} flag
   *
   * @return {this}
   */
  removeFlagFromAll: function (flag) {
    for (var id in this.areas) {
      this.removeFlag(id, flag);
    }

    return this;
  },

  /**
   * Refresh the body classes
   *
   */
  refreshBodyClasses: function() {
    var Map = this;

    var prefix = this.options.cssPrefix;

    // Handle this.element classes
    $('body')
    .removeClass(prefix + 'selector-hidden')
    .removeClass(prefix + 'selector-selecting')
    .removeClass(prefix + 'selector-selected')
    .removeClass(prefix + 'selector-resizing')
    .addClass(prefix + 'selector-' + Map.state.selectorOp);

    $('body')
    .removeClass(prefix + 'op-create')
    .removeClass(prefix + 'op-update')
    .removeClass(prefix + 'op-delete')
    .addClass(prefix + 'op-' + Map.state.op);

  },

  /**
   * Refresh DOM objects to reflect the current state of AreaMapper.
   *
   * @return {this}
   */
  refreshMap: function () {
    var Map = this;

    Map.refreshBodyClasses();

    // Remove pending areas from DOM.
    for (var i in Map.render.remove) {
      $(Map.render.remove[i]).remove();
      delete Map.render.remove[i];
    }

    // Update existings areas in the DOM.
    for (var id in Map.areas) {
      var area = Map.readArea(id);
      if (area) {
        Map.renderArea(area);
      }
    }

    return this;
  },

    /**
   * Displays the appropriate selector controls based on Map.state.op
   *
   * @return {this}
   */
  showControls: function() {
    var Map = this;
    switch (Map.state.op) {
      case 'create':
        $(Map.options.controls.updateTrigger + ',' + Map.options.controls.updateCancel + ',' + Map.options.controls.deleteTrigger + ',' + Map.options.controls.deleteCancel).hide();
        $(Map.options.controls.createTrigger + ',' + Map.options.controls.createCancel).show();
        break;

      case 'update':
        $(Map.options.controls.createTrigger + ',' + Map.options.controls.createCancel).hide();
        $(Map.options.controls.updateTrigger + ',' + Map.options.controls.updateCancel + ',' + Map.options.controls.deleteTrigger + ',' + Map.options.controls.deleteCancel).show();
        break;

      case 'delete':
        $(Map.options.controls.deleteTrigger + ',' + Map.options.controls.deleteCancel).show();
        break;
    }

    return this;
  },


  /**
   * Hides all controls associated with the selector tool.
   *
   * @return {self}
   */
  hideControls: function() {
    var Map = this;
    $(Map.options.controls.createTrigger + ',' + Map.options.controls.createCancel + ',' + Map.options.controls.updateTrigger + ',' + Map.options.controls.updateCancel + ',' + Map.options.controls.deleteTrigger + ',' + Map.options.controls.deleteCancel).hide();

    return this;
  },

  /**
   * Render a single area in the DOM.
   *
   * @param  {object} area
   *
   * @return {this}
   */
  renderArea: function(area) {
    var Map = this;

    var prefix = this.options.cssPrefix;

    var cssId = prefix + area.id;
    var $area = $('#' + cssId);
    if ($area.length === 0) {

      // var $deleteButton = $('<a href="#" title="Click to delete this area" class="' + prefix + 'delete"></a>').click(function () {

      //   Map.state.op = 'delete';
      //   Map.refreshBodyClasses();
      //   if (Map.options.confirm("Are you sure you want to delete this area?")) {
      //     Map.deleteArea(area.id)
      //   }
      //   Map.state.op = 'create';
      //   Map.refreshMap();

      // });

      // var $resizeButton = $('<a href="#" title="Click to resize this area" class="' + prefix + 'resize"></a>').click(function () {
      //   Map.state.selectorOp = 'resizing';
      //   Map.activateSelectionFromArea(area.id);
      // });

      $area = $('<div id="' + cssId + '"/>').addClass(prefix + 'area')
      // .html($deleteButton)
      // .append($resizeButton)
      .click(function () {
        if (area.id === Map.state.selected) {
          Map.deselectArea(area.id);
        }
        else {
          Map.state.selectorOp = 'resizing';
          Map
          .selectArea(area.id)
          .activateSelectionFromArea(area.id);
        }
        Map.refreshMap();
      });
      
      $(this.element).after($area);
    }
    $area.css({
      "position": "absolute",
      "left": area.x,
      "top": area.y,
      "width": area.w,
      "height": area.h,
    });

    // Remove any flag-based classes if registered.
    for (var i in this.render.removeFlag) {
      var id    = this.render.removeFlag[i][0];
      var flag  = this.render.removeFlag[i][1];
      $('#' + prefix + id).removeClass(prefix + flag);
      delete this.render.removeFlag[i];
    }

    // Add flags as classes
    for (var flag in area.flags) {
      $area.addClass(prefix + flag);
    }

    return this;
  },

  /**
   * Invoke a callback function
   *
   * @param  {string} op
   * @param  {object} data
   *
   * @return {mixed||false}  The return value of the callback function or true
   *   if there is no callback defined.
   */
  callbackInvoke: function (op, data) {
    if (typeof this.options.callbacks !== 'undefined'
      && typeof this.options.callbacks[op] === 'function') {
      var json = data ? JSON.stringify(data) : '';
      return this.options.callbacks[op](op, json, data);
    }

    return true;
  },


  /**
   * Handle initializing of AreaMapper object.
   */
  init: function () {
    var Map = this;
    var prefix = this.options.cssPrefix;

    $('#convert').hide();
    $('body').addClass(Map.options.cssPrefix + 'processed');

    Map.$container = $(Map.element)
    .addClass(Map.options.cssPrefix + 'processed')

    
    // Wrapper for containing our absolutely positioned elements.
    .wrap('<div class="' + Map.options.cssPrefix + 'container"/>')
    .parent('.' + Map.options.cssPrefix + 'container');

    // Establish connection to imgareaselect plugin.
    var options = Map.options.imgAreaSelect || {};

    // Nobody should be able to hijack this method.
    options.instance = true;
    options.onSelectStart = function(img, coordinates) {
      Map.onSelectStart(img, coordinates);
    };
    options.onSelectEnd = function(img, coordinates) {
      Map.onSelectEnd(img, coordinates);

      // There is not explicit onCancel callback but when we receive
      // coordinates of w an h = 0; that is implied.
      if (coordinates.width === 0 && coordinates.height === 0) {
        Map.selectorCancel();
      };
    };

    Map.selector = $(Map.element).imgAreaSelect(options);

    Map
    .refreshMap()
    .callbackInvoke('init');
  },

  /**
   * Initialize the controls.
   */
  initControls: function() {
    var Map = this;
    var prefix = this.options.cssPrefix;

    //
    // Set up all the control, click-handlers.
    // 
    $(Map.options.controls.createTrigger)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map
      .saveAreaFromSelection(Map.getNextId())
      .hideControls()
      .refreshMap();
      
      return false;
    });

    $(Map.options.controls.updateTrigger)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map
      .removeFlagFromAll('resizing')
      .saveAreaFromSelection(Map.state.selected)
      .deselectArea()
      .hideControls()
      .refreshMap();

      Map.refreshMap();

      return false;
    });

    $(Map.options.controls.deleteTrigger)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map.state.op = 'delete';
      Map.refreshBodyClasses();
      if (Map.options.confirm("Are you sure you want to delete this area?")) {
        Map.state.op = 'create';
        Map
        .deleteArea(Map.state.selected)
        .selectorCancel()
        .refreshMap();
      }

      return false;
    });      

    $(Map.options.controls.createCancel)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map
      .selectorCancel();
      
      return false;
    }); 

    $(Map.options.controls.updateCancel)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map
      .selectorCancel();
      
      return false;
    });

    $(Map.options.controls.deleteCancel)
    .not('.' + prefix + 'processed')
    .addClass(prefix + 'processed')
    .click(function () {
      Map
      .selectorCancel();
      
      return false;
    });    
  }
};

$.fn.areaMapper = function(options) {
  if (!$.data(this[0], 'plugin_areaMapper')) {
    $.data(this[0], 'plugin_areaMapper',
    new AreaMapper(this[0], options));
  }
  return $.data(this[0], 'plugin_areaMapper');
};

// Be sure to copy the defaults object in it's entirety if you choose to alter
// it's values (don't loos any properties).  Othewise the script may fail.
$.fn.areaMapper.defaults = {
  "confirm": function (prompt) {
    return confirm(prompt);
  },
  "callbacks": {
    "init": null,
    "onCreate": null,
    "onUpdate": null,
    "select": null,
    "delete": null,
    "onSelectStart": null,
    "onSelectEnd": null,
    "onSelectCancel": null,
  },

  // Define the jquery selectors for all our op controls.
  "controls": {
    "createTrigger":    '#am-create',
    "createCancel":     '#am-cancel',
    "updateTrigger":    '#am-update',
    "updateCancel":     '#am-cancel',
    "deleteTrigger":    '#am-delete',
    "deleteCancel":     '#am-cancel'
  },

  // imgareaselect options
  // http://odyniec.net/projects/imgareaselect/usage.html
  "imgAreaSelect": {
    "handles": false,
  },
  
  // A prefix for all css classes
  "cssPrefix"         : 'am-'
};

$.fn.areaMapper.version = function() { return '0.1.2'; };

})(jQuery, window, document);