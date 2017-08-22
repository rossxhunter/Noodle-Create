<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $username = $_POST['user'];
    $data = "SELECT * FROM library WHERE username = '$username'";
    $q = mysqli_query($con, $data);
    $result = array();
    while ($res = mysqli_fetch_array($q, MYSQLI_ASSOC)) {
        array_push($result, $res);
    }
    if (empty($result)) {
        die("Username not found");
    }
    else {
        echo json_encode($result);
    }
?>
