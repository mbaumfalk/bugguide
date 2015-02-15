<?php

/**
 * Implements hook_drush_command().
 */
function bgmigrate_drush_command() {

  $items['bgmigrate-users'] = array(
    'description' => 'Migrate users to D7 fields.',
    'aliases' => array('bgmu'),
  );
  $items['bgmigrate-users-data'] = array(
    'description' => 'Enumerate user data.',
    'aliases' => array('bgmud'),
  );

  return $items;
}

function drush_bgmigrate_users() {
  $result = db_query('SELECT uid FROM {users} WHERE uid > 0');
  foreach ($result as $record) {
    $uid = $record->uid;
    
    $account = user_load($uid);
    if (!isset($account->data)) {
      continue;
    }
    
    $data = $account->data;
    
    $user_full_name = isset($data['full_name']) ? $data['full_name'] : '';
    $account->field_user_full_name[LANGUAGE_NONE][0]['value'] = $user_full_name;
    
    $public_email = isset($data['public_email']) ? $data['public_email'] : '';
    $account->field_email[LANGUAGE_NONE][0]['email'] = $public_email;
    
    $homepage = isset($data['homepage']) ? $data['homepage'] : '';
    $account->field_user_homepage[LANGUAGE_NONE][0]['value'] = $homepage;
    
    // contact
    // $data['contact'] - information on how to contact user
    // This is being replaced by the Contact module which provides
    // anonymous contact.
    
    // location
    $city_state_country = isset($data['location']) ? $data['location'] : '';
    $account->field_user_city_state_country[LANGUAGE_NONE][0] = 
    
    // biography
    $biography = isset($data['biography']) ? $data['biography'] : '';
    $account->field_user_biography[LANGUAGE_NONE][0]['value'] = $biography;
    $account->field_user_biography[LANGUAGE_NONE][0]['format'] = 1;
    
    // license
    
    // license_details
    
    // subscriptions_auto
    // TODO: look in modern subscriptions module to see how this is stored
    
    // subscriptions_subscribe
    // TODO: what is this?
    
    // bugguide_homepage
    $bg_homepage = isset($data['bugguide_homepage']) ? $data['bugguide_homepage'] : '';
    $account->field_user_bg_homepage[LANGUAGE_NONE][0]['value'] = $bg_homepage;
        
    // TODO
    // location code is something like 'IA'
    // Map this into addressfield
    //$location_code = isset($data['location_code']) ? $data['location_code'] : '';
    //$account->field_default_state_country
    
    // county
    $default_county = isset($data['county']) ? $data['county'] : '';
    $account->field_user_default_county[LANGUAGE_NONE][0]['value'] = $default_county;
    
    // fullsize - what is this?
    
    // field_user_breadcrumb_format and field_user_scientific_use are list fields
    
    $breadcrumbs = isset($account->data['guide_breadcrumbs']) ? $data['guide_breadcrumbs'] : '0';
    
    switch($breadcrumbs) {
      case '0':
        $account->field_user_breadcrumb_format[LANGUAGE_NONE][0]['value'] = 'Common name (Scientific name)';
        break;
        
      case '1':
        $account->field_user_breadcrumb_format[LANGUAGE_NONE][0]['value'] = 'Scientific name (Common name)';
        break;
        
      case '2':
        $account->field_user_breadcrumb_format[LANGUAGE_NONE][0]['value'] = 'Common name';
        break;
        
      case '3':
        $account->field_user_breadcrumb_format[LANGUAGE_NONE][0]['value'] = 'Scientific name';
        break;
        
    }
    
    // All users default to this; they can opt-out by unchecking the box.
    $account->field_user_scientific_use[LANGUAGE_NONE][0]['value'] = 1;
   
    user_save($account); 
   }
}

function bgmigrate_user_presave(&$edit, $account, $category) {
  $key = array(
    'biography',
    'block',
    'full_name',
    'public_email',
    'homepage',
    'bugguide_homepage',
    'guide_breadcrumbs',
    'pass1',
    'pass2',
    'session',
  );
  foreach ($keys as $key) {
    unset($edit[$key]);
  }
  
}

function drush_bgmigrate_users_data() {
  $data = array();
  $data['nodata'] = 0;
  
  $blocks = array();
  
  $result = db_query('SELECT uid FROM {users} WHERE uid > 0');
  foreach ($result as $record) {
    $uid = $record->uid;
    $account = user_load($uid);
    if (!isset($account->data)) {
      $data['nodata']++;
      continue;
    }
    
    if (!is_array($account->data)) {
      print "Data is not an array in uid $uid";
    }
    
    if (isset($account->data['location'])) {
      print $account->data['location'];
      print "\r";
    }
    
    //foreach($account->data as $key => $value) {
    //  if (!isset($data[$key])) {
    //    $data[$key] = 0;
    //  }
    //  $data[$key]++;
    //}
    // Every 1000 give some output.
    //if ($uid % 1000 == 0) {
    //  print $uid . " ";
    //}
  }
  print_r($data);
}