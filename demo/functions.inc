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
      $nodes[$d->nid] = $d;
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
      $nid = max($nid, $node->nid);
    }
    $nid += 1;
  }
  $node = new \stdClass;
  $node->nid = $nid;

  foreach ($data as $key => $value) {
    $key = str_replace('edit_', '', $key);
    $node->{$key} = $value;
  }

  if (isset($node->field_area_json)) {
    $node->field_area_json = json_decode($node->field_area_json);
    $node->field_area_json->id = $nid;
    unset($node->field_area_json->flags->selected);
    unset($node->field_area_json->flags->changed);
  }

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
    'field_product[und][0][target_id]' => array(
      'Product', 'textfield', "Enter the product's name here."
    ),
    'title' => array(
      'Title', 'textfield', "Displayed on the ad as the product title.<br><strong>Note</strong>: This title <em>is</em> public facing."
    ),
    'field_description[und][0][value]' => array(
      'Description', 'textfield',  '<strong>Example:</strong> Selected 1.75 qt. First 2, Please'
    ),
    'field_price[und][0][value]' => array(
      'Price', 'textfield', '<strong>Examples:</strong><br>
$3.99/ea.<br>
$2.99 when you buy 4<br>
$.79/lb.',
    ),
    'field_area_json' => array(
      '', 'hidden', ''
    ),
  );
  $output   = array();
  $output[] = '<form class="node-form node-product_display-form" action="/node/add/product-display" method="post" id="product-display-node-form" accept-charset="UTF-8">';
  foreach ($fields as $name => $item) {
    $value = '';
    list($label, $type, $description) = $item;
    $id = preg_replace('/[^\-a-z0-9]/', '-', $name);
    $id = trim(preg_replace('/\-{2,}/', '-', $id), '-');
    $name = str_replace('-', '_', "edit-$id");
    $node_key = str_replace('-', '_', $id);

    if (!empty($node->{$node_key})) {
      $value = $node->{$node_key};
    }

    switch ($type) {
      case 'hidden':
        $output[] = '<input type="hidden" name="' . $name . '" id="' . $id . '"/>';
        break;

      case 'textarea':
        $output[] = '<div class="form-item"><label for="' . $id . '">' . $label . ' <textarea name="' . $name . '" id="' . $id . '"/>' . $value . '</textarea></label></div>';
        break;

      case 'textfield':
        $output[] = '<div class="form-item"><label for="' . $id . '">' . $label . ' </label><input type="text" value="' . $value . '" name="' . $name . '" id="' . $id . '"/ class="form-text"><div class="description">' . $description . '</div></div>';
        break;
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