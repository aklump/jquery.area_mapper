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

// Default response object.
$response = array(
  'title' => 'Editing Ad Page',
  'form' => render_form(),
  'items' => array(),
  'messages' => (object) array(
    'status' => '',
    'warning' => '',
    'error' => '',
  ),
);
switch ($method) {
  case 'DELETE':
    $node = node_load($id);
    node_delete($id);
    $response['messages']->status = 'Product display <em>' . $node->title . '</em> deleted.';
    break;

  case 'POST':
    $request = $_POST;
    if (empty($request['edit_title'])) {
      header('Status: 406 Title is required.');
      $response['messages']->error = "Title is a required field.";
    }
    else {
      $nid = node_save($request);
      $node = node_load($nid);
      $response['items'] = array($node);
      $response['messages']->status = 'Product display <em>' . $node->title . '</em> created.';    
    }
    break;

  case 'PUT':
    parse_str(file_get_contents("php://input"), $request);
    if (empty($request['edit_title'])) {
      header('Status: 406 Title is required.');
      $response['messages']->error = "Title is a required field.";
    }
    else {    
      $message = 'updated';
      if (!node_save($request, $id)) {
        $id = node_save($request);
        $message = 'created';
      }
      $node = node_load($id);
      $response['items'] = array(node_load($id));
      $response['messages']->status = 'Product display <em>' . $node->title . '</em> ' . $message . '.';
    }
    break;

  case 'GET':
    $response = array(
      'items' => node_load_all(),
    ) + $response;
    if ($id && ($node = node_load($id))) {
      $response['title'] = 'Edit ' . $node->title;
      $response['items'] = array($node->nid => $node);
      $response['form'] = render_form($node, $id);      
    }
    break;
}
write_to_log($method, $_GET, $response);

sleep(1);

header('Content Type: application/json');
print json_encode($response);
exit;
