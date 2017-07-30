<?php
    include("connect.php");
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $insert = "INSERT INTO user (username, email, password) VALUES ('$username', '$email', '$password')";
    $prefs = "INSERT INTO preferences (user) VALUES ('$username')";
    $q1 = mysqli_query($con, $insert);
    $q2 = mysqli_query($con, $prefs);
    if (!$q1 || !$q2) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
    mysqli_close($con);
?>
