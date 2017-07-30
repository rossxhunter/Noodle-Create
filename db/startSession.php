<?php
    include("connect.php");
    session_start();
    $username = $_POST['username'];
    $_SESSION['username'] = $username;
    echo $username;
?>
