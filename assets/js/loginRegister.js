//Created by Ross Hunter Copyright (c) 2017

function register(u, e, p) {
    registerValid = false;
    if (!validateRegister(u, e, p)) {
        return false;
    }
    var data = {
        "username": u,
        "email": e,
        "password": p
    };
    $.ajax({
        data: data,
        async: false,
        type: "POST",
        url: "/db/register.php",
        success: function(status) {
            registerValid = handleRegister(status);
        }
    });
    return registerValid;
}

function registerAjax(data) {
    return
}

function login(u, p) {
    loginValid = false;
    if (!validateLogin(u, p)) {
        return false;
    }
    var data = {
        "username": u,
        "password": p
    };
    $.ajax({
        data: data,
        async: false,
        type: "POST",
        url: "/db/login.php",
        success: function(status) {
            loginValid = handleLogin(status);
        }
    });
    if (loginValid) {
        $.ajax({
            data: {"username":u},
            async: false,
            type: "POST",
            url: "/db/startSession.php",
            success: function(status) {
                document.getElementById('loginRegTab').innerHTML = status;
            }
        });
    }
    return loginValid;
}

function validateUsername() {
    document.getElementById('emailCorrection').style.display = "none";
    document.getElementById('passwordCorrection').style.display = "none";
    if (document.getElementById('loginRegisterButtonText').textContent == "Register") {
        var u = document.getElementById("usernameField").value;
        if (u.length < 3) {
            document.getElementById('usernameCorrection').style.display = "block";
            document.getElementById('usernameCorrection').innerHTML = "Username too short";
        } else if (u.length > 16) {
            document.getElementById('usernameCorrection').style.display = "block";
            document.getElementById('usernameCorrection').innerHTML = "Username too long";
        } else if (u.match(/^[a-zA-Z0-9_-]{3,16}$/) ==null){
            document.getElementById('usernameCorrection').style.display = "block";
            document.getElementById('usernameCorrection').innerHTML = "No special characters";
        }
        else {
            document.getElementById('usernameCorrection').style.display = "none";
        }
    }
    else {
        document.getElementById('usernameCorrection').style.display = "none";
    }
}

function validateEmail() {
    document.getElementById('usernameCorrection').style.display = "none";
    document.getElementById('passwordCorrection').style.display = "none";
    if (document.getElementById('loginRegisterButtonText').textContent == "Register") {
        var e = document.getElementById("emailField").value;
        if (e.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) == null) {
            document.getElementById('emailCorrection').style.display = "block";
            document.getElementById('emailCorrection').innerHTML = "Email not valid";
        }
        else {
            document.getElementById('emailCorrection').style.display = "none";
        }
    }
    else {
        document.getElementById('emailCorrection').style.display = "none";
    }
}

function validatePassword() {
    document.getElementById('emailCorrection').style.display = "none";
    document.getElementById('usernameCorrection').style.display = "none";
    if (document.getElementById('loginRegisterButtonText').textContent == "Register") {
        var p = document.getElementById("passwordField").value;
        if (p.length < 6) {
            document.getElementById('passwordCorrection').style.display = "block";
            document.getElementById('passwordCorrection').innerHTML = "Password too short";
        } else if (p.length > 24) {
            document.getElementById('passwordCorrection').style.display = "block";
            document.getElementById('passwordCorrection').innerHTML = "Password too long";
        } else if (p.match(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,24})/) == null) {
            document.getElementById('passwordCorrection').style.display = "block";
            document.getElementById('passwordCorrection').innerHTML = "Invalid password";
        }
        else {
            document.getElementById('passwordCorrection').style.display = "none";
        }
    }
    else {
        document.getElementById('passwordCorrection').style.display = "none";
    }
}

function validateRegister(u, e, p) {
    if (u == "") {
        document.getElementById('usernameField').style.borderColor = '#b03535';
        document.getElementById('usernameField').placeholder = "Please enter username";
    } else if (e == "") {
        document.getElementById('emailField').style.borderColor = '#b03535';
        document.getElementById('emailField').placeholder = "Please enter email";
    } else if (p == "") {
        document.getElementById('passwordField').style.borderColor = '#b03535';
        document.getElementById('passwordField').placeholder = "Please enter password";
    } else if (u.match(/[a-zA-Z0-9_-]{3,16}/) == null) {
        document.getElementById('usernameField').style.borderColor = '#b03535';
    } else if (e.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) == null) {
        document.getElementById('emailField').style.borderColor = '#b03535';
    } else if (p.match(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,24})/) == null) {
        document.getElementById('passwordField').style.borderColor = '#b03535';
    } else {
        document.getElementById('usernameField').style.borderColor = '#28921f';
        document.getElementById('emailField').style.borderColor = '#28921f';
        document.getElementById('passwordField').style.borderColor = '#28921f';
        return true;
    }
    return false;
}

function validateLogin(u, p) {
    if (u == "") {
        document.getElementById('usernameField').style.borderColor = '#b03535';
        document.getElementById('usernameField').placeholder = "Please enter username";
    } else if (p == "") {
        document.getElementById('passwordField').style.borderColor = '#b03535';
        document.getElementById('passwordField').placeholder = "Please fill in password field";
    } else {
        document.getElementById('usernameField').style.borderColor = '#28921f';
        document.getElementById('passwordField').style.borderColor = '#28921f';
        return true;
    }
    return false;
}

function handleRegister(status) {
    status = status.toString();
    if (status.match(/Duplicate entry '.*' for key 'PRIMARY'/) != null) {
        document.getElementById('usernameCorrection').innerHTML = "Username already taken";
        document.getElementById('usernameCorrection').style.display = "block";
        document.getElementById('usernameCorrection').style.background = "#d45252";
        document.getElementById('usernameField').style.borderColor = '#28921f';
    } else if (status.match(/Duplicate entry '.*' for key 'email'/) != null) {
        document.getElementById('emailCorrection').innerHTML = "Email already taken";
        document.getElementById('emailCorrection').style.display = "block";
        document.getElementById('emailCorrection').style.background = "#d45252";
        document.getElementById('emailField').style.borderColor = '#28921f';
    } else {
        return true;
    }
    return false;
}

function handleLogin(status) {
    status = status.toString();
    if (status == "Username not found") {
        document.getElementById('usernameCorrection').innerHTML = "Username not found";
        document.getElementById('usernameCorrection').style.display = "block";
        document.getElementById('usernameCorrection').style.background = "#d45252";
        document.getElementById('usernameField').style.borderColor = '#28921f';
    } else if (status == "Incorrect password") {
        document.getElementById('passwordCorrection').innerHTML = "Incorrect Password";
        document.getElementById('passwordCorrection').style.display = "block";
        document.getElementById('passwordCorrection').style.background = "#d45252";
        document.getElementById('passwordField').style.borderColor = '#28921f';
    } else {
        return true;
    }
    return false;
}
