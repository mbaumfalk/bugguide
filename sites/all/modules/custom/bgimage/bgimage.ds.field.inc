<?php
/**
 * @file
 * Display suite callbacks for bgimage module.
 */
/**
 * Callback to render photo number.
 */
function _bgimage_field_photo_number($field) {
  $node = $field['entity'];
  return 'Photo #' . $node->nid;
}

/**
 * Callback to render a copyright statement.
 */
function _bgimage_field_copyright($field) {
  $node = $field['entity'];
  if (!isset($node->uid)) {
    return;
  }
  $user_wrapper = entity_metadata_wrapper('user', $node->uid);
  if (!$user_wrapper) {
    return;
  }
  return 'Copyright &copy; ' . l($user_wrapper->field_user_full_name->value(), 'user/' . $node->uid);
}

/**
 * Callback to render related images.
 */
function _bgimage_field_related_images($field) {
  $node = $field['entity'];

  // First, check if there are related images.
  $result = db_query('SELECT nid, series FROM {bgimage_series} WHERE nid = :nid', array(':nid' => $node->nid))->fetchAssoc();
  if (!count($result)) {
    return;
  }

  // Then, find out if the series is based on this nid or a different one.
  $nid = $result['nid'];
  if ($nid != $result['series']) {
    $nid = $result['series'];
  }

  // Next, extract the whole series of nids.
  $nids = db_query('SELECT nid FROM {bgimage_series} WHERE series = :nid', array(':nid' => $nid))->fetchCol();

  // Render as a list of image teasers.
  $output = '<div class="field-label">Images of this individual:</div>';
  $output .= '<ul class="item-list hlist">';
  $nodes = node_load_multiple($nids);
  foreach ($nodes as $node) {
    $field_view = field_view_field('node', $node, 'field_bgimage_image', 'teaser');
    $output .= '<li>' . render($field_view) . '</li>';
  }
  return $output . '</ul><div style="clear:both;"></div>';
}