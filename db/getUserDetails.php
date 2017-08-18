<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $username = $_POST['user'];
    $data = "SELECT * FROM user WHERE username = '$username'";
    $prefs = "SELECT * FROM preferences WHERE user = '$username'";
    $q1 = mysqli_query($con, $data);
    $q2 = mysqli_query($con, $prefs);
    $result1 = mysqli_fetch_array($q1, MYSQLI_ASSOC);
    $result2 = mysqli_fetch_array($q2, MYSQLI_ASSOC);
    $finalResult = array_merge($result1, $result2);
    if (empty($result1)) {
        die("Username not found");
    }
    else {
        echo json_encode($finalResult);
    }
?>
