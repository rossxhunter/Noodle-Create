<?php
    //Created by Ross Hunter Copyright (c) 2017
    session_start();
    unset($_SESSION["username"]);
    session_destroy();
?>
