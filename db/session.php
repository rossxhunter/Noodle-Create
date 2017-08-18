<?php
   //Created by Ross Hunter Copyright (c) 2017
   include('connect.php');
   session_start();
   if(!isset($_SESSION['username'])){
      echo "Login/Register";
   }
   else {
       $user_check = $_SESSION['username'];
       $ses_sql = mysqli_query($con,"select username from user where username = '$user_check' ");
       $row = mysqli_fetch_array($ses_sql,MYSQLI_ASSOC);
       $login_session = $row['username'];
       echo $login_session;
   }
?>
