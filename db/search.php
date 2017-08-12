<?php
    include("connect.php");
    $name = $_POST['name'];
    $data = "SELECT *  FROM library WHERE name LIKE '%{$name}%' COLLATE 'latin1_general_ci' UNION SELECT *  FROM program WHERE name LIKE '%{$name}%' COLLATE 'latin1_general_ci'";
    $q = mysqli_query($con, $data);
    if (!$q) {
        die(mysqli_error($con));
    }
    $result = mysqli_fetch_all($q, MYSQLI_ASSOC);
    if (empty($result)) {
        die("None");
    }
    else {
        echo json_encode($result);
    }
?>
