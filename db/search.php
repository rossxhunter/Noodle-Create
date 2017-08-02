<?php
    include("connect.php");
    $name = $_POST['name'];
    $data = "SELECT * FROM library WHERE name LIKE '%{$name}%'";
    $q = mysqli_query($con, $data);
    $result = mysqli_fetch_all($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("None");
    }
    else {
        echo json_encode($result);
    }
?>
