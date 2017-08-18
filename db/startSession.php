<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    session_start();
    $username = $_POST['username'];
    $_SESSION['username'] = $username;
    echo $username;
?>
