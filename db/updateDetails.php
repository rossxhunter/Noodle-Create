<?php
    include("connect.php");
    $oldUsername = $_POST['oldUsername'];
    $username = $_POST['user'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $update = "UPDATE user SET username = '$username', email = '$email', password = '$password' WHERE username = '$oldUsername'";
    $q = mysqli_query($con, $update);
    if (!$q) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
?>
