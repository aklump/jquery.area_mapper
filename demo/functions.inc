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
    'field_area_json' => array('', 'hidden', ''),
    'field_product' => array('Product', 'textfield', ''),
    'field_price' => array('Price', 'textfield', ''),
    'title' => array('Title', 'textfield', ''),
  );
  $output   = array();
  $output[] = '<form>';
  foreach ($fields as $key => $item) {
    list($label, $type, $value) = $item;
    if (!empty($node->{$key})) {
      $value = $node->{$key};
    }
    switch ($type) {
      case 'hidden':
        $output[] = "<input type=\"hidden\" name=\"$key\" id=\"edit-$key\"/>";
        break;

      case 'textarea':
        $output[] = "<div class=\"form-item\"><label>$label <textarea name=\"$key\" id=\"edit-$key\"/>$value</textarea></label></div>";
        break;

      case 'textfield':
        $output[] = "<div class=\"form-item\"><label>$label <input type=\"text\" value=\"$value\" name=\"$key\" id=\"edit-$key\"/></label></div>";
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