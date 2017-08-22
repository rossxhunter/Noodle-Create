<?php
    $con = mysqli_connect("77.104.171.129", "noodlecr_ross", "AccustomCrushEffortSauce6", "noodlecr_main");
    $user = $_POST['user'];
    $sql = "SELECT username, email FROM user WHERE username = '$user'";
    $q = mysqli_query($con, $sql);
    while ($res = mysqli_fetch_array($q, MYSQLI_ASSOC)) {
        $email = ("hello@noodlecreate.com"); //senders e-mail adress
        if((filter_var($email, FILTER_VALIDATE_EMAIL))) {
            $Name = ("Noodle Create"); //senders name
            $mail_body  = "Hi " . $user . ", \r\n";
            $mail_body .= "Thanks for signing up to Noodle Create \r\n";
            $mail_body .= "If you need help contact support@noodlecreate.com. \r\n";
            $mail_body .= "Kind regards, \r\n";
            $mail_body .= "Ross. \r\n";
            $subject = "Welcome to Noodle Create"; //subject
            $header = "From: ". $Name . " <" . $email . ">\r\n"; //optional headerfields
            $header .= "MIME-Version: 1.0\r\n";
            $header .= "Content-Type: text/html; charset=UTF-8\r\n";
            $template = file_get_contents("emailTemplate.html");
            foreach($res as $key => $value)
            {
                $template = str_replace('{{ '.$key.' }}', $value, $template);
            }
            mail($res['email'], $subject, $template, $header); //mail command :)
        }
        else {
            print "You've entered an invalid email address!";
        }
    }
?>
