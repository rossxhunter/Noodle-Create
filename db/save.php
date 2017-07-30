<?php
    include("connect.php");
    $code = $_POST['code'];
    $name = "functions";
    $username = "john123";
    $update = "UPDATE program SET code = '$code' WHERE name = '$name' AND username = '$username'";
    $updateQ = mysqli_query($con, $update);
    if (!$updateQ) {
        $insert = "INSERT INTO program (name, username, code) VALUES ('$name', '$username', '$code')";
        $insertQ = mysqli_query($con, $insert);
        if (!$insertQ) {
            die(mysqli_error($con));
        }
        else {
            echo "success";
        }
    }
    else {
        echo "success";
    }
    mysqli_close($con);
?>
