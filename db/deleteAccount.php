<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $username = $_POST['user'];
    $delete = "DELETE FROM user WHERE username = '$username'";
    $q = mysqli_query($con, $delete);
    if (!$q) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
?>
