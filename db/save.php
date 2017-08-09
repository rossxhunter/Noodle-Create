<?php
    include("connect.php");
    $user = $_POST['user'];
    $name = $_POST['name'];
    $code = $_POST['code'];
    $isProgram = $_POST['isProgram'];
    $isNew = $_POST['isNew'];
    if ($isProgram == "true") {
        $data = "SELECT * FROM program WHERE name = '$name' AND username = '$user'";
    }
    else {
        $data = "SELECT * FROM library WHERE name = '$name' AND username = '$user'";
    }
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
    if (!empty($result)) {
        if ($isNew == "true") {
            die("Duplicate");
        }
        else {
            if ($isProgram == "true") {
                $update = "UPDATE program SET code = '$code' WHERE name = '$name' AND username = '$user'";
            }
            else {
                $update = "UPDATE library SET code = '$code' WHERE name = '$name' AND username = '$user'";
            }
            $updateQ = mysqli_query($con, $update);
            if ($updateQ) {
                echo "success";
            }
            else {
                die(mysqli_error($con));
            }
        }
    }
    else {
        if ($isProgram == "true") {
            $insert = "INSERT INTO program (name, username, code) VALUES ('$name', '$user', '$code')";
        }
        else {
            $insert = "INSERT INTO library (name, username, code) VALUES ('$name', '$user', '$code')";
        }
        $insertQ = mysqli_query($con, $insert);
        if (!$insertQ) {
            die(mysqli_error($con));
        }
        else {
            echo "success";
        }
    }
?>
