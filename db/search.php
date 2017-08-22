<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $name = $_POST['name'];
    $data = "SELECT * FROM library WHERE name LIKE '%{$name}%' COLLATE 'latin1_general_ci' UNION SELECT *  FROM program WHERE name LIKE '%{$name}%' COLLATE 'latin1_general_ci'";
    $q = mysqli_query($con, $data);
    if (!$q) {
        die(mysqli_error($con));
    }
    $result = array();
    while ($res = mysqli_fetch_array($q, MYSQLI_ASSOC)) {
        array_push($result, $res);
    }
    if (empty($result)) {
        die("None");
    }
    else {
        echo json_encode($result);
    }
?>
