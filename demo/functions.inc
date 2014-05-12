<?php
/**
 * @file
 * Functions for server.php
 *
 */
function node_load_all() {
  $nodes = array();
  if (file_exists('database.json')
    && ($data = trim(file_get_contents('database.json')))) {
    $data = (array) json_decode($data);
    foreach ($data as $d) {
      $nodes[$d->id] = $d;
    }
  }
  
  return $nodes;
}

function node_save_all($nodes) {
  return file_put_contents('database.json', json_encode($nodes));
}

function node_load($nid) {
  $nodes = node_load_all();
  
  return isset($nodes[$nid]) ? $nodes[$nid] : FALSE;
}

/**
 * Update an existing node
 *
 * @param  string $id   [description]
 * @param  [type] $data [description]
 *
 * @return bool       
 */
function node_save($data, $nid = NULL) {
  $nodes = node_load_all();
  if ($nid && !isset($nodes[$nid])) {
    return FALSE;
  }
  elseif (!$nid) {
    $nid = 0;
    foreach ($nodes as $node) {
      $nid = max($nid, $node->id);
    }
    $nid += 1;
  }
  $node = (object) $data;
  $node->id = $nid;
  $node->field_area_json = json_decode($node->field_area_json);
  $node->field_area_json->id = $nid;
  unset($node->field_area_json->flags->selected);
  unset($node->field_area_json->flags->changed);
  $nodes[$nid] = $node;
  node_save_all($nodes);

  return $nid;
}

function node_delete($nid) {
  $nodes = node_load_all();
  unset($nodes[$nid]);
  node_save_all($nodes);
}

function write_to_log($method, $args, $data) {
  $line = (object) array(
    'method' => $method, 
    'args' => $args, 
    'response' => $data, 
  );
  $file = 'log.json';
  if (!file_exists($file) || !($json = json_decode(file_get_contents($file)))) {
    $json = array();
  }
  $json[] = $line;
  file_put_contents($file, json_encode($json));
}

function render_form($node = array(), $id = NULL) {
  $fields = array(
    'title' => array('Title', 'textfield', "Displayed on the ad as the product title.<br><strong>Note</strong>: This title <em>is</em> public facing."),
    'field_product[und][0][target_id]' => array('Product', 'textfield', "Enter the product's name here."),
    'field_area_json' => array('', 'hidden', ''),
    'field_description[und][0][value]' => array('Description', 'textfield',  'Displayed on the ad as the product title.<br><strong>Note</strong>: This title <em>is</em> public facing.'),
    'field_price[und][0][value]' => array('Price', 'textfield', '<strong>Examples:</strong><br>
$3.99/ea.<br>
$2.99 when you buy 4<br>
$.79/lb.'),
    
  );
  $output   = array();
  $output[] = '<form class="node-form node-product_display-form" action="/node/add/product-display" method="post" id="product-display-node-form" accept-charset="UTF-8">';
  foreach ($fields as $name => $item) {
    $value = '';
    list($label, $type, $description) = $item;
    if (!empty($node->{$name})) {
      $value = $node->{$name};
    }

    $name = preg_replace('/[^\-a-z0-9]/', '-', $name);
    $name = trim(preg_replace('/\-{2,}/', '-', $name), '-');
    $id = "edit-$name";
    switch ($type) {
      case 'hidden':
        $output[] = "<input type=\"hidden\" name=\"$name\" id=\"$id\"/>";
        break;

      case 'textarea':
        $output[] = "<div class=\"form-item\"><label for=\"$id\">$label <textarea name=\"$name\" id=\"$id\"/>$value</textarea></label></div>";
        break;

      case 'textfield':
        $output[] = "<div class=\"form-item\"><label for=\"$id\">$label <input type=\"text\" value=\"$value\" name=\"$name\" id=\"$id\"/ class=\"form-text\"></label></div>";
        break;
    }
    if ($description) {
      $output[] = '<div class="description">' . $description . '</div>';
    }
    
  }

  // if ($id) {
  //   $output[] = '<input type="button" value="Delete" name="delete" id="delete" />';
  //   $output[] = '<input type="button" value="Update" name="update" id="update" />';    
  // }
  // else {
  //   $output[] = '<input type="button" value="Save" name="save" id="save" />';
  // }
  $output[] = '</form>';
  
  return implode(PHP_EOL, $output);
}