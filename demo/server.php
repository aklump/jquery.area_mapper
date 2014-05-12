<?php
/**
 * @file
 * A mock server backend
 *
 */
require_once dirname(__FILE__) . '/functions.inc';


$method = strtoupper($_SERVER['REQUEST_METHOD']);
$id     = isset($_GET['id']) ? $_GET['id'] : NULL;

$defaults = array('x' => 124, 'y' => 41, 'w' => 124, 'h' => 125);
$areas = array(
  (object) (array('id' => 'as1199', 'x' => 14) + $defaults),
  (object) (array('id' => 'pr599', 'x' => 175) + $defaults),
  (object) (array('id' => 'vc349', 'x' => 340) + $defaults),
);

$response = new stdClass;
switch ($method) {
  case 'DELETE':
    node_delete($id);
    $response = (object) array(
      'title' => 'New Product Display',
      'form' => render_form(),
    );
    break;

  case 'POST':
    $request = $_POST;
    $nid = node_save($request);
    $response = (object) array(
      'items' => array(node_load($nid)),
      'title' => 'New Product Display',
      'form' => render_form(),
    );
    break;

  case 'PUT':
    $request = $_POST;
    node_save($request, $id);
    $response = (object) array(
      'items' => array(node_load($id)),
      'title' => 'New Product Display',
      'form' => render_form(),
    );
    break;

  case 'GET':
    $response = (object) array(
      'items' => node_load_all(),
      'title' => 'New Product Display',
      'form' => render_form(),
    );
    if ($id) {
      if (!($node = node_load($id))) {
        $response->items = array();
      }
      else {
        $response = new \stdClass;
        $response->title = 'Edit ' . $node->title;
        $response->items = array($node->nid => $node);
        $response->form = render_form($node, $id);      
      }
    }
    break;
  
  default:
    # code...
    break;
}
write_to_log($method, $_GET, $response);

// sleep(1);

header('Content Type: application/json');
print json_encode($response);
exit;
