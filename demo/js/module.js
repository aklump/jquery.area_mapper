(function($) {
  $('document').ready(function(){

    var ajaxOp = 'Loading';

    $(document)
    .ajaxStart(function () {
      $('body')
      .addClass(Map.options.cssPrefix + 'ajaxing');
      setTitle(ajaxOp + '...');
    })
    .ajaxComplete(function () {
      $('body')
      .removeClass(Map.options.cssPrefix + 'ajaxing');
    });

    function refreshFromServer() {
      ajaxOp = 'Loading';
      $.getJSON('server.php', function (response) {
        for (i in response.items) {
          var json = response.items[i].field_area_json;
          Map.createArea(response.items[i].nid, json);
        }
        Map.refreshMap();
        refreshPage(response);
        defaultText();
      });
    }

    // function serverNewForm(json) {
    //   $.ajax({
    //     url: 'server.php',
    //     type: 'POST',
    //     data: json,
    //     dataType: 'json',
    //     success: function(response) {
    //       updateForm(response, json);
    //     }
    //   });      
    // }
    function serverSave(op, formValues, data) {
      defaultText();
      ajaxOp = 'Saving';
      var type = op === 'create' ? 'POST' : 'PUT';
      var query = op === 'create' ? '' : '?id=' + data.id;
      Map.addFlag(data.id, 'changed');
      $.ajax({
        url: 'server.php' + query,
        type: type,
        data: formValues,
        dataType: 'json',
        success: function(response) {
          refreshPage(response);
          if (typeof response.items[0] !== 'undefined'
            && response.items[0].nid) {
            
            // Juggle a bit and replace with NID.
            Map
            .unsetArea(data.id)
            .createArea(response.items[0].field_area_json.id, response.items[0].field_area_json)
            .removeFlag(response.items[0].field_area_json.id, 'changed');
          }
          // else {
          //   // Map.addFlag(data.id, 'changed');
          //   // Map.state.op = 'create';
          //   // Map.state.selectorOp = 'selected';
          //   // Map
          //   // .showControls()
          //   // .addFlag(data.id, 'changed')
          //   // .selectArea(data.id);
          //   // .activateSelectionFromArea(data.id);

          // }
          Map.refreshMap();
        }
      });      
    }



    function serverRead(id, json) {
      ajaxOp = 'Loading';
      $.getJSON('server.php?id=' + id, function (response) {
        // It's possible that during the load the selected element has changed
        // if this is the case then we shouldn't fill in the form.
        refreshPage(response);
        if (Map.state.selected === id) {
        }        
      });      
    }

    function serverDelete(id) {
      ajaxOp = 'Deleting';
      $.ajax({
        url: 'server.php?id=' + id,
        type: 'DELETE',
        dataType: 'json',
        success: function(response) {
          refreshPage(response)
          defaultText();
        }
      });
    }

    function getForm() {
      return $('#area-mapper-edit-form-wrapper form.am-form');
    }

    function refreshPage(response) {
      setTitle(response.title);

      $('.messages.error').html(response.messages.error);
      $('.messages.warning').html(response.messages.warning);
      $('.messages.status').html(response.messages.status);

      setForm(response.form);
    }

    function setForm(form) {
      $('#area-mapper-edit-form-wrapper')
      .find('.am-form').html(form);
    }

    function setFormJson(json) {
      getForm().find('#field-area-json').val(json);
    }

    function setTitle(title) {
      $('.am-title').html(title);
    }

    function setHelp(help) {
      $('.am-help').html(help);
    }

    function setMessage(message) {
      $('.am-messages').html(message);
    }

    function defaultText() {
      setTitle('Editing Ad Page');
      var help = '';
      help += 'Click and drag to define the boundaries of a new product display.';
      if (Map.areas.length > 0) {
        help += ' Or click on an existing area to edit.';
      };
      setHelp(help);

    }

    function updateForm(data, json) {
      var $form = $(data.form);
      if (json) {
        $form.find().val(json);  
      };
      $('#area-mapper-edit-form-wrapper>form').replaceWith($form);
      setHelp('');
    }

    // Attach a mapper object to our container
    var Map  = $('#area-mapper').areaMapper({
      "callbacks": {
        "onCreate": function(op, json, data) {
          setFormJson(json);
          var formValues = getForm().serialize();
          serverSave('create', formValues, data);
        },
        "onUpdate": function(op, json, data) {
          setFormJson(json);
          var formValues = getForm().serialize();
          serverSave('update', formValues, data);
        },
        "onSelectStart": function(op, json, data) {
          if (Map.state.op === 'create') {
            refreshFromServer();
          };
          setHelp('Fill out and save form, or click Cancel.');
        },
        "onSelectEnd": function(op, json, data) {
          setHelp('Fill out and save form, or click Cancel.');
        },
        "onSelectCancel": function () {
          defaultText();
        },
        "select": function(op, json, data) {
          setHelp('Resize or move the area boundaries or edit the details in the form, then click the Update button. You may also click the Delete button to delete this Product display.');
          serverRead(data.id, json);
        },
        // "deselect": function () {
        //   refreshFromServer();
        //   defaultHelp();
        // },
        "delete": function(op, json, data) {
          serverDelete(data.id);
        }
      }
    });

    refreshFromServer();

    // $('#cancel').click(function () {
      // defaultHelp();
    // });
    //
    //
    var query = queryObj(); 
    var max = 6
    var page = parseInt(query.page, 10) || 0;
    var remains = max - page;

    $('#done-button').click(function () {
      alert('End of demo! :)');
    });
    if (remains >  0) {
      var suffix = remains === 1 ? ' ad page remains' : ' ad pages remain';
      $('.pager .index').html(remains + suffix);  
      $('#done-button').hide();
    }
    
    if (page > 0) {
      $('#prev-page-button')
      .css('visibility', 'visible')
      .click(function () {      
        window.location.search = 'page=' + (page - 1);
      });        
    }
    else {
      $('#prev-page-button').css('visibility', 'hidden');
    }
    if (page < max) {
      $('#next-page-button')
      .css('visibility', 'visible')
      .click(function () {      
        window.location.search = 'page=' + (page + 1);
      });      
    }
    else {
      $('#next-page-button').css('visibility', 'hidden');
    }
  
    function queryObj() {
      var result = {}, queryString = location.search.slice(1),
          re = /([^&=]+)=([^&]*)/g, m;

      while (m = re.exec(queryString)) {
          result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }

      return result;
    }    


  });
})(jQuery);