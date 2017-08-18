<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $username = $_POST['user'];
    $theme = $_POST['theme'];
    $fontSize = $_POST['fontSize'];
    $update = "UPDATE preferences SET theme = '$theme', font_size = '$fontSize' WHERE user = '$username'";
    $q = mysqli_query($con, $update);
    if (!$q) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
?>
