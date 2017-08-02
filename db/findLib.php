<?php
    include("connect.php");
    $username = $_POST['user'];
    $name = $_POST['name'];
    $data = "SELECT * FROM library WHERE username = '$username' AND name = '$name'";
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_array($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("Not found");
    }
    else {
        echo json_encode($result);
    }
?>
