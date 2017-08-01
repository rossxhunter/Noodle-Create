<?php
    include("connect.php");
    $username = $_POST['user'];
    $data = "SELECT * FROM library WHERE username = '$username'";
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_all($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("Username not found");
    }
    else {
        echo json_encode($result);
    }
?>
