(function($) {
  $('document').ready(function(){

    $(document)
    .ajaxStart(function () {
      $('#area-mapper-edit-form-wrapper')
      .addClass('ajaxing');
      clearForm();
      setHelp('Please wait...');
    })
    .ajaxComplete(function () {
      $('#area-mapper-edit-form-wrapper')
      .removeClass('ajaxing');
    });

    function refreshFromServer() {
      $.getJSON('server.php', function (data) {
        for (i in data.items) {
          Map.createArea(data.items[i].id, data.items[i]);
        }
        Map.refreshMap();
        clearForm();
      });
    }

    function serverCreate(data) {
      $.ajax({
        url: 'server.php',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: function(response) {
          Map.createArea(response.id, response);
        }
      });      
    }

    function serverRead(id, json) {
      $.getJSON('server.php?id=' + id, function (data) {
        // It's possible that during the load the selected element has changed
        // if this is the case then we shouldn't fill in the form.
        if (Map.state.selected === id) {
          updateForm(data, json);  
        }        
      });      
    }

    function serverDelete(area) {
      $.ajax({
        url: 'server.php?id=' + area.id,
        type: 'DELETE',
        dataType: 'json',
        success: function() {
          clearForm();
        }
      });
    }

    function setHelp(help) {
      $('#area-mapper-edit-form-wrapper')
      .find('div.help').html(help);
    }

    function clearForm() {
      setHelp('Using mouse drag to define the rectangle area of a product.');
      $('#area-mapper-edit-form-wrapper>form').replaceWith($('<form/>'));
    }

    function updateForm(data, json) {
      var $form = $(data.form);
      $form.prepend($('<textarea id="areaJson" name="areaJson"></textarea>'));
      if (json) {
        $form.find('#areaJson').val(json);  
      };
      $('#area-mapper-edit-form-wrapper>form').replaceWith($form);
      setHelp('');
    }

    // Attach a mapper object to our container
    var Map  = $('#area-mapper').areaMapper({
      "callbacks": {
        "select": function(op, json, data) {
          serverRead(data.id, json);
        },
        "deselect": clearForm,
        "delete": function(op, json, data) {
          serverDelete(data);
        }
      }
    });

    // Load via ajax and create all areas
    refreshFromServer();




  });
})(jQuery);