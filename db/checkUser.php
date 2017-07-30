<?php
    include("connect.php");
    $username = $_POST['user'];
    $data = "SELECT * FROM user WHERE username = '$username'";
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("Username not found");
    }
    else {
        echo "success";
    }
?>
