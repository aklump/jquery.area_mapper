/**
 * Area Mapper jQuery JavaScript Plugin v0.0.1
 * 
 *
 * jQuery plugin providing a CRUD UI for defining areas over an image.
 *
 * Copyright 2013, Aaron Klump
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Fri May  9 17:12:03 PDT 2014
 */
;(function($, window, document, undefined) {
"use strict";

// The actual plugin constructor
function AreaMapper(element, options) {
  this.element = element;

  // jQuery has an extend method that merges the 
  // contents of two or more objects, storing the 
  // result in the first object. The first object 
  // is generally empty because we don't want to alter 
  // the default options for future instances of the plugin
  this.options = $.extend( {}, $.fn.areaMapper.defaults, options) ;

  this.init();
}

AreaMapper.prototype = {

  // An area to hold all the created area objects.
  areas: [],

  // Holds various timers as needed in the object scope.
  timers: {},

  // Will hold the instance of imgAreaSelect
  selector: null,

  // An object to hold various states of the AreaMapper object.
  state: {"selected": null},

  // An object to hold render instructions such as dom objects that have
  // been deleted and need to be removed.
  render: {
    // An array of jquery selectors to be removed on next refresh.
    "remove": [],

    // An array of elements and flags to remove on next refresh.
    "removeFlag": []
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
    $('#convert').show().click(function () {
      Map.createAreaFromSelection();
    });
  },

  createAreaFromSelection: function (id) {
    var Map = this;
    var coordinates = Map.selector.getSelection();
    var data = {
      "x": coordinates.x1,
      "y": coordinates.y1,
      "w": coordinates.width,
      "h": coordinates.height,
    };
    Map
    .createArea(id, data)
    .addFlag(id, 'changed')
    .addFlag(id, 'selected')
    .refreshMap()

    Map.selector.cancelSelection();

    $('#convert').hide();
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
    return typeof this.areas[id] === undefined ? false : this.areas[id];
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
    var area = this.readArea(id);
    if (area) {
      this.areas[id] = null;
      this.render.remove.push($('#' + this.options.cssPrefix + area.id));
      this.callbackInvoke('delete', area);
    }

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
    var area = this.readArea(id);
    if (area && area.id !== this.state.selected) {
      var flag = 'selected';
      this.removeFlagFromAll(flag);
      this.addFlag(id, flag);
      this.state.selected = id;

      this.callbackInvoke('select', area);
    }

    return this;
  },

  deselectArea: function (id) {
    var area = this.readArea(id);
    if (area && area.id === this.state.selected) {
      this.removeFlag(id, 'selected');
      this.state.selected = null;

      this.callbackInvoke('deselect', area);
    }

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
   * Refresh DOM objects to reflect the current state of AreaMapper.
   *
   * @return {this}
   */
  refreshMap: function () {

    // Remove pending areas from DOM.
    for (var i in this.render.remove) {
      $(this.render.remove[i]).remove();
      delete this.render.remove[i];
    }

    // Update existings areas in the DOM.
    for (var id in this.areas) {
      var area = this.readArea(id);
      if (area) {
        this.renderArea(area);
      }
    }

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
    var cssId = this.options.cssPrefix + area.id;
    var $area = $('#' + cssId);
    if ($area.length === 0) {
      
      var $deleteButton = $('<a href="#" title="Click to delete this area" class="' + this.options.cssPrefix + 'delete"></a>').click(function () {

        if (Map.options.confirm("Are you sure you want to delete this area?")) {
          Map.deleteArea(area.id).refreshMap();
        }
      });
      $area = $('<div id="' + cssId + '"/>').addClass(this.options.cssPrefix + 'area')
      .html($deleteButton)
      .click(function () {
        if (area.id === Map.state.selected) {
          Map.deselectArea(area.id);
        }
        else {
          Map.selectArea(area.id);
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
      $('#' + this.options.cssPrefix + id).removeClass(this.options.cssPrefix + flag);
      delete this.render.removeFlag[i];
    }

    // Add flags as classes
    for (var flag in area.flags) {
      $area.addClass(this.options.cssPrefix + flag);
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

    $('#convert').hide();

    $(Map.element)
    .addClass(Map.options.cssPrefix + 'processed')
    
    // Wrapper for containing our absolutely positioned elements.
    .wrap('<div class="' + Map.options.cssPrefix + 'container"/>');

    // Establish connection to imgareaselect plugin.
    var options = Map.options.imgAreaSelect || {};

    // Nobody should be able to hijack this method.
    options.instance = true;
    options.onSelectEnd = function(img, coordinates) {
      Map.onSelectEnd(img, coordinates);
    };
    Map.selector = $(Map.element).imgAreaSelect(options);

    Map.callbackInvoke('init');
  },
};

$.fn.areaMapper = function(options) {
  if (!$.data(this[0], 'plugin_areaMapper')) {
    $.data(this[0], 'plugin_areaMapper',
    new AreaMapper(this[0], options));
  }
  return $.data(this[0], 'plugin_areaMapper');
};

$.fn.areaMapper.defaults = {
  "confirm": function (prompt) {
    return confirm(prompt);
  },
  "callbacks": {
    "init": null,
    "select": null,
    "delete": null,
  },

  // imgareaselect options
  // http://odyniec.net/projects/imgareaselect/usage.html
  "imgAreaSelect": {
    "handles": false,
  },
  
  // A prefix for all css classes
  "cssPrefix"         : 'area-mapper-'
};

$.fn.areaMapper.version = function() { return '0.0.1'; };

})(jQuery, window, document);