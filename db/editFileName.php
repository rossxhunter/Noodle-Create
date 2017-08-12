<?php
    include("connect.php");
    $user = $_POST['user'];
    $oldName = $_POST['name'];
    $newName = $_POST['newName'];
    $description = $_POST['description'];
    $prog = "SELECT * FROM program WHERE username = '$user' AND name = '$oldName'";
    $progQ = mysqli_query($con, $prog);
    $progRes = mysqli_fetch_array($progQ, MYSQLI_ASSOC);
    if (!empty($progRes)) {
        $update = "UPDATE program SET name = '$newName', description = '$description' WHERE username = '$user' AND name = '$oldName'";
    }
    else {
        $update = "UPDATE library SET name = '$newName', description = '$description' WHERE username = '$user' AND name = '$oldName'";
    }
    $q = mysqli_query($con, $update);
    if (!$q) {
        die(mysqli_error($con));
    }
    else {
        echo "success";
    }
?>
