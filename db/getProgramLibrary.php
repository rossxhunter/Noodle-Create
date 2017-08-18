<?php
    //Created by Ross Hunter Copyright (c) 2017
    include("connect.php");
    $username = $_POST['user'];
    $name = $_POST['name'];
    $isProgram = $_POST['isProgram'];
    if ($isProgram == "true") {
        $data = "SELECT * FROM program WHERE username = '$username' AND name = '$name'";
    }
    else {
        $data = "SELECT * FROM library WHERE username = '$username' AND name = '$name'";
    }
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
    if (empty($result)) {
        if ($isProgram == "both") {
            $data = "SELECT * FROM program WHERE username = '$username' AND name = '$name'";
            $q = mysqli_query($con, $data);
            $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
            if (empty($result)) {
                die("Not Found");
            }
            else {
                echo json_encode($result);
            }
        }
        else {
            die("Not Found");
        }
    }
    else {
        echo json_encode($result);
    }
?>
