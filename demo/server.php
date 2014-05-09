<?php
/**
 * @file
 * A mock server backend
 *
 */

// if (!function_exists('write_to_log')) {
  function write_to_log($method, $args, $data) {
    $line = (object) array(
      'method' => $method, 
      'args' => $args, 
      'response' => $data, 
    );
    $file = 'log.json';
    if (!($json = json_decode(file_get_contents($file)))) {
      $json = array();
    }
    $json[] = $line;
    file_put_contents($file, json_encode($json));
  }
// }

function render_form($data = array()) {
  if (empty($data)) {
    $data = array(
      'product' => '',
      'price' => '',
      'title' => '',
    );
  }
  $output   = array();
  $output[] = '<form>';
  foreach ($data as $key => $value) {
    $output[] = "<div class=\"form-item\"><label>$key <input type=\"text\" value=\"$value\" name=\"$key\" id=\"$key\"/></label></div>";
  }

  $output[] = '<input type="button" value="Delete" name="delete" id="delete" />';
  $output[] = '<input type="button" value="Update" name="update" id="update" />';
  $output[] = '</form>';
  
  return implode(PHP_EOL, $output);
}

$method = strtoupper($_SERVER['REQUEST_METHOD']);
$id     = isset($_GET['id']) ? $_GET['id'] : NULL;

$defaults = array('x' => 124, 'y' => 41, 'w' => 124, 'h' => 125);
$areas = array(
  (object) (array('id' => 'as1199', 'x' => 14) + $defaults),
  (object) (array('id' => 'pr599', 'x' => 175) + $defaults),
  (object) (array('id' => 'vc349', 'x' => 340) + $defaults),
);

$form_data = array(
  'as1199' => (object) array(
    'product' => 'WASSF',
    'price' => '$11.99/lb',
    'title' => 'Wild, Alaskan Sockeye Salmon Fillets',
  ),
  'pr599' => (object) array(
    'product' => 'FPRF',
    'price' => '$5.99/lb',
    'title' => 'Fresh Pacific Rockfish Fillets',
  ),
  'vc349' => (object) array(
    'product' => 'FVC',
    'price' => '$3.49/lb',
    'title' => 'Fresh Venus Clams',
  ),
);

$response = new stdClass;
switch ($method) {
  case 'GET':
    $response = (object) array(
      'items' => $areas,
      'form' => render_form(),
    );
    if ($id) {
      $response = array();
      foreach ($areas as $area) {
        if ($area->id == $id) {
          $area->form = render_form($form_data[$id]);
          $response = $area;
          break;
        }
      }
    }
    break;
  
  default:
    # code...
    break;
}
write_to_log($method, $_GET, $response);

sleep(1);

header('Content Type: application/json');
print json_encode($response);
exit;
