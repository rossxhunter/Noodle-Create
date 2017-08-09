<?php
    include("connect.php");
    $username = $_POST['user'];
    $name = $_POST['name'];
    $prog = "SELECT * FROM program WHERE username = '$username' AND name = '$name'";
    $progQ = mysqli_query($con, $prog);
    $progRes = mysqli_fetch_array($progQ, MYSQLI_ASSOC);
    if (!empty($progRes)) {
        $delete = "DELETE FROM program WHERE username = '$username' AND name = '$name'";
    }
    else {
        $delete = "DELETE FROM library WHERE username = '$username' AND name = '$name'";
    }
    $q = mysqli_query($con, $delete);
    if (!$q) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
?>
