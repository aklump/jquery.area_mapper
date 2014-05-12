(function($) {
  $('document').ready(function(){

    $(document)
    .ajaxStart(function () {
      $('body')
      .addClass(Map.options.cssPrefix + 'ajaxing');
      setTitle('Please wait...');
    })
    .ajaxComplete(function () {
      $('body')
      .removeClass(Map.options.cssPrefix + 'ajaxing');
    });

    function refreshFromServer() {
      $.getJSON('server.php', function (response) {
        for (i in response.items) {
          var json = response.items[i].field_area_json;
          Map.createArea(response.items[i].id, json);
        }
        Map.refreshMap();
        setTitle(response.title);
        setForm(response.form);
        defaultHelp();
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
    function serverCreate(formValues) {
      $.ajax({
        url: 'server.php',
        type: 'POST',
        data: formValues,
        dataType: 'json',
        success: function(response) {
          if (response.items[0].id) {
            var newId = response.items[0].field_area_json.id;
            var data = response.items[0].field_area_json;
            Map
            .deleteArea(0)
            .createArea(newId, data)
            .refreshMap();

            setTitle(response.title);
            setForm(response.form);            
          };
        }
      });      
    }

    function serverRead(id, json) {
      $.getJSON('server.php?id=' + id, function (response) {
        // It's possible that during the load the selected element has changed
        // if this is the case then we shouldn't fill in the form.
        if (Map.state.selected === id) {
          setTitle(response.title);
          setForm(response.form);   
        }        
      });      
    }

    function serverDelete(area) {
      $.ajax({
        url: 'server.php?id=' + area.id,
        type: 'DELETE',
        dataType: 'json',
        success: function(response) {
          setTitle(response.title);
          setForm(response.form);
          defaultHelp();
        }
      });
    }

    function getForm() {
      return $('#area-mapper-edit-form-wrapper form.am-form');
    }

    function setForm(form) {
      $('#area-mapper-edit-form-wrapper')
      .find('.am-form').html(form);
    }

    function setFormJson(json) {
      getForm().find('#edit-field_area_json').val(json);
    }

    function clearForm() {
      setForm('<form class="am-form"/>');
    }

    function setTitle(title) {
      $('.am-title').html(title);
    }

    function setHelp(help) {
      $('.am-help').html(help);
    }

    function defaultHelp() {
      var help = '';
      help += 'Using mouse drag to define the rectangle area of a product.';
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
        "new": function(op, json, data) {
          setFormJson(json);
          var formValues = getForm().serialize();
          serverCreate(formValues);
        },
        "onSelectEnd": function(op, json, data) {
          setHelp('Fill out and save form, or click Cancel.');
        },
        "select": function(op, json, data) {
          setHelp('Click the purple square to resize, the red square to delete, or the green to cancel.  You may also edit the details in the form then click the Update button.');
          serverRead(data.id, json);
        },
        "deselect": function () {
          refreshFromServer();
          defaultHelp();
        },
        "delete": function(op, json, data) {
          serverDelete(data);
        }
      }
    });

    refreshFromServer();

    $('#cancel').click(function () {
      defaultHelp();
    });


  });
})(jQuery);