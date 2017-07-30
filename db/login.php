<?php
    include("connect.php");
    $username = $_POST['username'];
    $password = $_POST['password'];
    $data = "SELECT * FROM user WHERE username = '$username'";
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("Username not found");
    }
    else if ($result['password'] != $password) {
        die("Incorrect password");
    }
    echo json_encode($result);
?>
