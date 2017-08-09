var linesArray;
var sizeMode = 0;
var startedCoding = false;
var registerValid = true;
var loginValid = true;
var sessionUser;
var isNew;
var fileName;
var fileNameCurrentlyEditing;
var isLib = false;

function setDimensions() {
    setSize0();
}

function setSize0() {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var editorContainer = document.getElementById("editorContainer").style.height;

    document.getElementById("editorBorderDiv").style.height = (height - 102) + 'px';
    document.getElementById("editorContainer").style.height = (height - 102) + 'px';
    document.getElementById("browsePaneBorderDiv").style.height = (height - 102) + 'px';
    document.getElementById("browsePaneContainer").style.height = (height - 102) + 'px';
    document.getElementById("toolbarDiv").style.height = (height - 102) * 0.96 + 'px';
    document.getElementById("browseToolbarDiv").style.height = (height - 102) * 0.96 + 'px';

    var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
    var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight) - 1;
    editor.setOption("maxLines", numberOfLines);
    editor.setOption("minLines", numberOfLines);
    searchEditor.setOption("maxLines", numberOfLines);
    searchEditor.setOption("minLines", numberOfLines);

    var editorHeight = parseInt(document.getElementById("editorContainer").style.height);
    document.getElementById("outputBorderDiv").style.height = editorHeight + 'px';
    document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
}

/*
window.addEventListener('resize', function(event) {
    switch (sizeMode) {
        case 0:
            setSize1();
        case 1:
            setSize2();
        case 2:
            setSize1();
    }
});
*/
function checkSession() {
    $.ajax({
        async: false,
        url: "/db/session.php",
        success: function(status) {
            if (status != "Login/Register") {
                document.getElementById('loginRegTab').innerHTML = status;
                sessionUser = status;
            }
        }
    });
}

function checkUser() {
    var user = GetUserURLParameter('username');
    var exists = false;
    $.ajax({
        async: false,
        data: {
            "user": user
        },
        type: "POST",
        url: "/db/checkUser.php",
        success: function(status) {
            if (status == "success") {
                exists = true;
            }
        }
    });
    if (!exists) {
        $('#userNotFoundDiv').css('visibility', 'visible');
        $('#userMainBody').css('visibility', 'hidden');

    } else {
        $('#userNotFoundDiv').css('visibility', 'hidden');
        $('#userMainBody').css('visibility', 'visible');
        return user;
    }
}

function GetUserURLParameter(sParam) {
    var sPageURL = window.location.href;
    var user = sPageURL.substr(sPageURL.indexOf("user/") + 5);
    return user;
}

function checkProgramLibrary() {
    var user = GetCreateURLParameter('username');
    var name = GetCreateURLParameter('name');
    if (user == null || user == "") {
        isNew = true;
        return;
    }
    isNew = false;
    var isValid = true;
    $.ajax({
        async: false,
        data: {
            "user": user
        },
        type: "POST",
        url: "/db/checkUser.php",
        success: function(status) {
            if (status != "success") {
                isValid = false;
            }
        }
    });
    var code;
    if (!isValid) {
        window.open("/notfound", '_self', "NotFound");
    } else {
        $.ajax({
            async: false,
            data: {
                "user": user,
                "name": name,
                "isProgram": "both"
            },
            type: "POST",
            url: "/db/getProgramLibrary.php",
            success: function(status) {
                if (status == "Not Found") {
                    isValid = false;
                } else {
                    var res = JSON.parse(status);
                    code = res['code'];
                    isNew = false;
                    fileName = name;
                }
            }
        });
    }
    if (!isValid) {
        window.open("/notfound", '_self', "NotFound");
    } else {
        loadProgramLibrary(code);
    }
}

function loadProgramLibrary(code) {
    editor.setValue(code, 1);
}

function GetCreateURLParameter(param) {
    var sPageURL = window.location.href;
    var user = sPageURL.substr(sPageURL.indexOf("create/") + 7);
    var name = user.substr(user.indexOf("/") + 1);
    user = user.substr(0, user.indexOf("/"));
    if (param == "username") {
        return user;
    }
    return name;
}

function accountSettingsClick() {
    $('#accountSettings').css('display', 'block');
    $('#editorSettings').css('display', 'none');
    $('#programs').css('display', 'none');
    $('#libraries').css('display', 'none');
    $('#accountSettingsTab').css('background-color', '#eeeeee');
    $('#editorSettingsTab').css('background-color', '#fbfbfb');
    $('#programsTab').css('background-color', '#fbfbfb');
    $('#librariesTab').css('background-color', '#fbfbfb');
}

function editorSettingsClick() {
    $('#editorSettings').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#programs').css('display', 'none');
    $('#libraries').css('display', 'none');
    $('#editorSettingsTab').css('background-color', '#eeeeee');
    $('#accountSettingsTab').css('background-color', '#fbfbfb');
    $('#programsTab').css('background-color', '#fbfbfb');
    $('#librariesTab').css('background-color', '#fbfbfb');
}

function programsClick() {
    $('#programs').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#editorSettings').css('display', 'none');
    $('#libraries').css('display', 'none');
    $('#programsTab').css('background-color', '#eeeeee');
    $('#accountSettingsTab').css('background-color', '#fbfbfb');
    $('#editorSettingsTab').css('background-color', '#fbfbfb');
    $('#librariesTab').css('background-color', '#fbfbfb');
}

function librariesClick() {
    $('#libraries').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#programs').css('display', 'none');
    $('#editorSettings').css('display', 'none');
    $('#librariesTab').css('background-color', '#eeeeee');
    $('#accountSettingsTab').css('background-color', '#fbfbfb');
    $('#programsTab').css('background-color', '#fbfbfb');
    $('#editorSettingsTab').css('background-color', '#fbfbfb');
}

function setUserDetails(user) {
    document.getElementById('usernameText').innerHTML = user;
    document.getElementById('usernameChangeField').value = user;
    $.ajax({
        async: false,
        data: {
            "user": user
        },
        type: "POST",
        url: "/db/getUserDetails.php",
        success: function(r) {
            var res = JSON.parse(r);
            document.getElementById('emailChangeField').value = res['email'];
            document.getElementById('passwordChangeField').value = res['password'];
            document.getElementById('changeTheme').value = res['password'];
            document.getElementById('fontSizeChange').value = res['font_size'];
        }
    });
}

function getPrograms() {
    var user = GetUserURLParameter('username');
    $.ajax({
        async: false,
        data: {
            "user": user
        },
        type: "POST",
        url: "/db/getPrograms.php",
        success: function(r) {
            if (r == "Username not found") {
                showNoPrograms();
            } else {
                var res = JSON.parse(r);
                populateProgramTable(res);
            }
        }
    });
}

function showNoPrograms() {
    $('#programNothingHere').css('display', 'block');
    $('#programListDiv').css('display', 'none');
}

function populateProgramTable(progs) {
    $('#programNothingHere').css('display', 'none');
    $('#programListDiv').css('display', 'block');
    var table = document.getElementById("programListTable");
    $("#programListTable").find("tr:gt(0)").remove();
    for (var i = 0; i < progs.length; i++) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = progs[i]['name'];
        cell2.innerHTML = "stuff";
        cell3.innerHTML = "<span onclick='openPreview(this)' class='actionButton'>Preview</span>";
        cell3.innerHTML = cell3.innerHTML + "<span onclick='openProgram(this)' class='actionButton'>Open</span>";
        cell3.innerHTML = cell3.innerHTML + "<span onclick='openEdit(this)' class='actionButton'>Edit</span>";
    }
}

function openEdit(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    fileNameCurrentlyEditing = name;
    document.getElementById('editFileName').value = name;
    $('#editModal').css('display', 'block');
}

function editSave() {
    var name = $('#editFileName').val();
    if (editFileNameValidate(name)) {
        $.ajax({
            async: false,
            data: {
                "user": sessionUser,
                "name": fileNameCurrentlyEditing,
                "newName": name
            },
            type: "POST",
            url: "/db/editFileName.php",
            success: function(r) {
                getPrograms();
                getLibraries();
            }
        });
        $('#editModal').css('display', 'none');
    }
}

function editFileNameValidate(name) {
    if (name.length < 3) {
        document.getElementById('editFileNameCorrection').innerHTML = "Name too short";
        document.getElementById('editFileNameCorrection').style.display = "block";
    } else if (name.length > 32) {
        document.getElementById('editFileNameCorrection').innerHTML = "Name too long";
        document.getElementById('editFileNameCorrection').style.display = "block";
    } else if (name.match(/^[a-zA-Z0-9_-]{3,32}$/) == null) {
        document.getElementById('editFileNameCorrection').innerHTML = "No special characters";
        document.getElementById('editFileNameCorrection').style.display = "block";
    } else {
        document.getElementById('editFileNameCorrection').style.display = "none";
        return true;
    }
    return false;
}

function deleteFile() {
    $('#deleteConfirmModal').css('display', 'block');
}

function cancelDelete() {
    $('#deleteConfirmModal').css('display', 'none');
}

function deleteDelete() {
    $.ajax({
        async: false,
        data: {
            "user": sessionUser,
            "name": fileNameCurrentlyEditing
        },
        type: "POST",
        url: "/db/deleteFile.php",
        success: function(s) {
            $('#deleteConfirmModal').css('display', 'none');
            getPrograms();
            getLibraries();
            $('#editModal').css('display', 'none');
        }
    });
}

function openPreview(cell) {
    var user = GetUserURLParameter('username');
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var isProgram = document.getElementById("programs").style.display == "block";
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": isProgram
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(r) {
            var res = JSON.parse(r);
            openPreviewModal(res['code']);
        }
    });
}

function openPreviewModal(code) {
    $('#previewModal').css('display', 'block');
    //document.getElementById("previewCode").innerHTML = code;
    previewEditor.setValue(code, 1);
}

function previewClose() {
    $('#previewModal').css('display', 'none');
}

function openProgram(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    isNew = false;
    window.open("/create/" + sessionUser + "/" + name, '_self', "Program");
}

function getLibraries() {
    var user = GetUserURLParameter('username');
    $.ajax({
        async: false,
        data: {
            "user": user
        },
        type: "POST",
        url: "/db/getLibraries.php",
        success: function(r) {
            if (r == "Username not found") {
                showNoLibraries();
            } else {
                var res = JSON.parse(r);
                populateLibraryTable(res);
            }
        }
    });
}

function showNoLibraries() {
    $('#libraryNothingHere').css('display', 'block');
    $('#libraryListDiv').css('display', 'none');
}

function populateLibraryTable(libs) {
    $('#libraryNothingHere').css('display', 'none');
    $('#libraryListDiv').css('display', 'block');
    var table = document.getElementById("libraryListTable");
    $("#libraryListTable").find("tr:gt(0)").remove();
    for (var i = 0; i < libs.length; i++) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = libs[i]['name'];
        cell2.innerHTML = "stuff";
        cell3.innerHTML = "<span onclick='openPreview(this)' class='actionButton'>Preview</span>";
        cell3.innerHTML = cell3.innerHTML + "<span onclick='openProgram(this)' class='actionButton'>Open</span>";
        cell3.innerHTML = cell3.innerHTML + "<span onclick='openEdit(this)' class='actionButton'>Edit</span>";
    }
}

function updatePreferences() {
    var theme = document.getElementById('changeTheme').value;
    if (theme == "") {
        theme = "noodle_light";
    }
    var fontSize = document.getElementById('fontSizeChange').value;
    if (fontSize < 8) {
        fontSize = 8;
    }
    if (fontSize > 20) {
        fontSize = 20;
    }
    $.ajax({
        async: false,
        type: "POST",
        data: {
            "user": sessionUser,
            "theme": theme,
            "fontSize": fontSize
        },
        url: "/db/updatePreferences.php",
        success: function(status) {}
    });
}

function hideChangeDetails() {
    $('#accountSettingsTR').css('display', 'none');
    $('#editorSettingsTR').css('display', 'none');
    $('#optionsBarDiv').css('height', '125px');
    $('#logoutButton').css('display', 'none');
    programsClick();
}

function logout() {
    $('#logoutModal').css('display', 'block');
}

function cancelLogout() {
    $('#logoutModal').css('display', 'none');
}

function logoutLogout() {
    $.ajax({
        url: "/db/logout.php",
        success: function() {
            window.open("/index", '_self', "IndexPage");
        }
    });
}

function newProgramClick() {
    window.open("/create", '_self', "CreatePage");
}

function newLibraryClick() {
    isLib = true;
    window.open("/create", '_self', "CreatePage");
}

function newFileClick() {
    editor.setValue("func main()\n  //Code here!\nend", 1);
    isNew = true;
    fileName = "";
    window.history.pushState(null, "New", "/create");
}

function saveClick() {
    $.ajax({
        async: false,
        url: "/db/session.php",
        success: function(status) {
            if (status == "Login/Register") {
                openLoginRegister();
            } else {
                if (isProgram(editor.getValue())) {
                    saveProgram();
                } else {
                    saveLibrary();
                }
            }
        }
    });
}

function isProgram(code) {
    var lines = code.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim().match(/func\s+main\(\)/) != null) {
            return true;
        }
    }
    return false;
}

function saveProgram() {
    if (isNew) {
        openSaveName();
    } else {
        saveProgramToDB(fileName, true, false);
    }
}

function saveLibrary() {
    if (isNew) {
        openSaveName();
    } else {
        saveProgramToDB(fileName, false, false);
    }
}

function saveProgramToDB(name, isProgram, isNew) {
    fileName = name;
    var code = editor.getValue();
    code = code.replace("\\n", "\\\\n");
    $.ajax({
        data: {
            "user": sessionUser,
            "name": name,
            "code": code,
            "isProgram": isProgram,
            "isNew": isNew
        },
        async: false,
        type: "POST",
        url: "/db/save.php",
        success: function(status) {
            if (status == "Duplicate") {
                document.getElementById('fileNameCorrection').innerHTML = "Duplicate file name";
                document.getElementById('fileNameCorrection').style.display = "block";
            } else {
                if (isNew) {
                    isNew = false;
                    window.history.pushState(null, "NewFile", "/create/" + sessionUser + "/" + name);
                }
                //openSaveConfirm();
                document.getElementById("save").src = "/assets/images/saveClicked.png";
                $('#saveNameModal').css('display', 'none');
            }
        }
    });
}


function openSaveName() {
    $('#saveNameModal').css('display', 'block');
}

function saveName() {
    var name = $('#fileName').val();
    var code = editor.getValue();
    if (saveNameValidate(name)) {
        saveProgramToDB(name, isProgram(code), true);
        isNew = false;
    }
}

function saveNameValidate(name) {
    if (name.length < 3) {
        document.getElementById('fileNameCorrection').innerHTML = "Name too short";
        document.getElementById('fileNameCorrection').style.display = "block";
    } else if (name.length > 32) {
        document.getElementById('fileNameCorrection').innerHTML = "Name too long";
        document.getElementById('fileNameCorrection').style.display = "block";
    } else if (name.match(/^[a-zA-Z0-9_-]{3,32}$/) == null) {
        document.getElementById('fileNameCorrection').innerHTML = "No special characters";
        document.getElementById('fileNameCorrection').style.display = "block";
    } else {
        document.getElementById('fileNameCorrection').style.display = "none";
        return true;
    }
    return false;
}

function loginRegisterClick() {
    $.ajax({
        url: "/db/session.php",
        success: function(status) {
            if (status == "Login/Register") {
                openLoginRegister();
            } else {
                openUserPage(status);
            }
        }
    });
}

function openUserPage(user) {
    window.open("/user/" + user, '_self', "UserPage");
}

function openLoginRegister() {
    document.getElementById('emailCorrection').style.display = "none";
    document.getElementById('usernameCorrection').style.display = "none";
    document.getElementById('passwordCorrection').style.display = "none";
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    document.getElementById('emailField').setAttribute("pattern", emailRegex.source);
    var passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,24})/;
    document.getElementById('passwordField').setAttribute("pattern", passwordRegex.source);
    document.getElementById('loginTab').style.backgroundColor = "#aee1e1";
    document.getElementById('emailField').style.display = "none";
    document.getElementById('usernameField').value = "";
    document.getElementById('emailField').value = "";
    document.getElementById('passwordField').value = "";
    document.getElementById('loginRegisterModal').style.display = "block";
}

function showLogin() {
    document.getElementById('emailField').style.display = "none";
    document.getElementById('registerTab').style.backgroundColor = "#79cdcd";
    document.getElementById('loginTab').style.backgroundColor = "#aee1e1";
    document.getElementById('loginRegisterButtonText').textContent = "Login";
}

function showRegister() {
    document.getElementById('emailField').style.display = "block";
    document.getElementById('loginTab').style.backgroundColor = "#79cdcd";
    document.getElementById('registerTab').style.backgroundColor = "#aee1e1";
    document.getElementById('loginRegisterButtonText').textContent = "Register";
}

function settingsClick() {
    document.getElementById('settingsModal').style.display = "block";
}

function loginRegisterDone() {
    if (document.getElementById('loginRegisterButtonText').textContent == "Login") {
        var validLogin = login(document.getElementById('usernameField').value, document.getElementById('passwordField').value);
        if (validLogin) {
            document.getElementById('loginRegisterModal').style.display = "none";
            startedCoding = true;
            sessionUser = document.getElementById('usernameField').value;
            $('#welcome').fadeOut('slow', function() {
                $('#mainTableDiv').css('visibility', 'visible').hide().fadeIn('slow');
            });
        }
    } else {
        var validRegistration = register(document.getElementById('usernameField').value, document.getElementById('emailField').value, document.getElementById('passwordField').value);
        if (validRegistration) {
            document.getElementById('loginRegisterModal').style.display = "none";
        }
    }
}

function validateChanges() {
    var isValid;
    var username = document.getElementById('usernameChangeField').value;
    var email = document.getElementById('emailChangeField').value;
    var password = document.getElementById('passwordChangeField').value;
    isValid = usernameChangeValid(username);
    if (isValid) {
        isValid = emailChangeValid(email);
    }
    if (isValid) {
        isValid = passwordChangeValid(password);
    }
    if (isValid) {
        $.ajax({
            async: false,
            type: "POST",
            data: {
                "oldUsername": sessionUser,
                "user": username,
                "email": email,
                "password": password
            },
            url: "/db/updateDetails.php",
            success: function(status) {
                if (status != "success") {
                    handleUpdateDetailsError(status);
                } else {
                    $.ajax({
                        async: false,
                        url: "/db/logout.php",
                        success: function() {}
                    });
                    $.ajax({
                        async: false,
                        data: {
                            "username": username
                        },
                        type: "POST",
                        url: "/db/startSession.php",
                        success: function(s) {}
                    });
                    window.open("/user/" + username, '_self', "UserPage");
                }
            }
        });
    }
}

function handleUpdateDetailsError(s) {
    status = s.toString();
    if (status.match(/Duplicate entry '.*' for key 'PRIMARY'/) != null) {
        document.getElementById('usernameChangeCorrection').innerHTML = "Username already taken";
        document.getElementById('usernameChangeCorrection').style.display = "block";
        document.getElementById('usernameChangeCorrection').style.background = "#d45252";
        document.getElementById('usernameChangeField').style.borderColor = '#28921f';
    } else if (status.match(/Duplicate entry '.*' for key 'email'/) != null) {
        document.getElementById('emailChangeCorrection').innerHTML = "Email already taken";
        document.getElementById('emailChangeCorrection').style.display = "block";
        document.getElementById('emailChangeCorrection').style.background = "#d45252";
        document.getElementById('emailChangeField').style.borderColor = '#28921f';
    }
}

function usernameChangeValid(username) {
    document.getElementById('emailChangeCorrection').style.display = "none";
    document.getElementById('passwordChangeCorrection').style.display = "none";
    if (username.length < 3) {
        document.getElementById('usernameChangeCorrection').style.display = "block";
        document.getElementById('usernameChangeCorrection').innerHTML = "Username too short";
    } else if (username.length > 16) {
        document.getElementById('usernameChangeCorrection').style.display = "block";
        document.getElementById('usernameChangeCorrection').innerHTML = "Username too long";
    } else if (username.match(/^[a-zA-Z0-9_-]{3,16}$/) == null) {
        document.getElementById('usernameChangeCorrection').style.display = "block";
        document.getElementById('usernameChangeCorrection').innerHTML = "No special characters";
    } else {
        document.getElementById('usernameChangeCorrection').style.display = "none";
        return true;
    }
    return false;
}

function emailChangeValid(email) {
    document.getElementById('usernameChangeCorrection').style.display = "none";
    document.getElementById('passwordChangeCorrection').style.display = "none";
    if (email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) == null) {
        document.getElementById('emailChangeCorrection').style.display = "block";
        document.getElementById('emailChangeCorrection').innerHTML = "Email not valid";
    } else {
        document.getElementById('emailChangeCorrection').style.display = "none";
        return true;
    }
    return false;
}

function passwordChangeValid(password) {
    document.getElementById('emailChangeCorrection').style.display = "none";
    document.getElementById('usernameChangeCorrection').style.display = "none";
    if (password.length < 6) {
        document.getElementById('passwordChangeCorrection').style.display = "block";
        document.getElementById('passwordChangeCorrection').innerHTML = "Password too short";
    } else if (password.length > 24) {
        document.getElementById('passwordChangeCorrection').style.display = "block";
        document.getElementById('passwordChangeCorrection').innerHTML = "Password too long";
    } else if (password.match(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,24})/) == null) {
        document.getElementById('passwordChangeCorrection').style.display = "block";
        document.getElementById('passwordChangeCorrection').innerHTML = "Password not valid";
    } else {
        document.getElementById('passwordChangeCorrection').style.display = "none";
        return true;
    }
    return false;
}

function settingsDone() {
    var theme = document.getElementById('themeSelect').value;
    var fontSize = document.getElementById('fontSizeSelect').value;
    if (fontSize >= 8 && fontSize <= 20) {
        document.getElementById('settingsModal').style.display = "none";
        var theme = document.getElementById('themeSelect').value;
        var fontSize = document.getElementById('fontSizeSelect').value;
        setTheme(theme);
        setFontSize(fontSize);
    }
}

function setTheme(theme) {
    if (theme == "noodle_light") {
        editor.setTheme("ace/theme/noodle_light");
        $('#editorBorderDiv').css('background-color', '#f5f5f5');
        $('#outputBorderDiv').css('background-color', '#f5f5f5');
        $('#errorsBorderDiv').css('background-color', '#f5f5f5');
        $('#noodleOutputBox').css('color', '#444444');
        $('#noodleErrorsBox').css('color', '#444444');
        $('#outputBorderDiv').css('border-left-color', '#cccccc');
        $('#errorsBorderDiv').css('border-top-color', '#cccccc');

    } else if (theme == "noodle_dark") {
        editor.setTheme("ace/theme/noodle_dark");
        $('#editorBorderDiv').css('background-color', '#1D1F21');
        $('#outputBorderDiv').css('background-color', '#1D1F21');
        $('#errorsBorderDiv').css('background-color', '#1D1F21');
        $('#mainTableDiv').css('background-color', '#1D1F21');
        $('#noodleOutputBox').css('color', '#bbbbbb');
        $('#noodleErrorsBox').css('color', '#bbbbbb');
        $('#outputBorderDiv').css('border-left-color', '#333333');
        $('#errorsBorderDiv').css('border-top-color', '#333333');
    }
}

function setFontSize(fontSize) {
    $('#editorDiv').css('font-size', fontSize + 'pt');
    $('#editor').css('font-size', fontSize + 'pt');
    $('#noodleOutputBox').css('font-size', fontSize + 'pt');
    $('#noodleErrorsBox').css('font-size', fontSize + 'pt');
}


var findShowing = false;

function find() {
    if (findShowing) {
        editor.searchBox.hide();
        findShowing = false;
    } else {
        editor.execCommand("find");
        findShowing = true;
    }
}

function setSize1() {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    $('#navbar').fadeOut('slow', function() {
        $("#fullScreen").attr("src", "/assets/images/smallScreen.png");
        $("#mainBody").css("padding-top", "0px");
        $("#outputBorderDiv").css("height", "100%");
        $("#browseSelectBorderDiv").css("height", "100%");
        $("#editorBorderDiv").css("height", "100%");
        $("#browsePaneBorderDiv").css("height", "100%");
        $("#editorDiv").css("height", "100%");
        $("#browsePaneDiv").css("height", "100%");
        document.getElementById("editorBorderDiv").style.height = height + 'px';
        document.getElementById("editorContainer").style.height = height + 'px';
        document.getElementById("browsePaneBorderDiv").style.height = height + 'px';
        document.getElementById("browsePaneContainer").style.height = height + 'px';
        var numberOfLines = Math.round(height / editor.renderer.lineHeight) - 1;
        editor.setOption("maxLines", numberOfLines);
        editor.setOption("minLines", numberOfLines);
        searchEditor.setOption("maxLines", numberOfLines);
        searchEditor.setOption("minLines", numberOfLines);
        var editorHeight = parseInt(document.getElementById("editorContainer").style.height);
        document.getElementById("outputBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("toolbarDiv").style.height = height * 0.96 + 'px';
        document.getElementById("browseToolbarDiv").style.height = height * 0.96 + 'px';
    });
}

function setSize2() {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    $("#mainBody").css("padding-top", "32px");
    $("#fullScreen").attr("src", "/assets/images/fullScreen.png");
    $('#navbar').fadeIn('slow', function() {
        $("#outputBorderDiv").css("height", "100%");
        $("#browseSelectBorderDiv").css("height", "100%");
        $("#editorBorderDiv").css("height", "100%");
        $("#browsePaneBorderDiv").css("height", "100%");
        document.getElementById("editorBorderDiv").style.height = (height - 102) + 'px';
        document.getElementById("editorContainer").style.height = (height - 102) + 'px';
        document.getElementById("browsePaneBorderDiv").style.height = (height - 102) + 'px';
        document.getElementById("browsePaneContainer").style.height = (height - 102) + 'px';
        var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
        var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight) - 1;
        editor.setOption("maxLines", numberOfLines);
        editor.setOption("minLines", numberOfLines);
        searchEditor.setOption("maxLines", numberOfLines);
        searchEditor.setOption("minLines", numberOfLines);
        var editorHeight = parseInt(document.getElementById("editorBorderDiv").style.height);
        document.getElementById("outputBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("toolbarDiv").style.height = (height - 102) * 0.96 + 'px';
        document.getElementById("browseToolbarDiv").style.height = (height - 102) * 0.96 + 'px';
    });
}

function fullScreen() {
    if (document.getElementById("mainBody").style.paddingTop != '0px') {
        sizeMode = 1;
        setSize1();
    } else {
        sizeMode = 2;
        setSize2();
    }
}

function libraryClick() {
    $('#mainTableDiv').css('display', 'none');
    $('#browseDiv').css('display', 'block');
    var searchBar = document.getElementById("searchBar");
    searchBar.addEventListener("input", searchResultsUpdate);
}

function searchResultsUpdate() {
    var searchQuery = $('#searchBar').val();
    if (searchQuery == "") {
        $("#searchResultsDiv").css('display', 'none');
        $("#searchNothingHere").css('display', 'none');
        return;
    }
    $.ajax({
        async: false,
        data: {
            "name": searchQuery
        },
        type: "POST",
        url: "/db/search.php",
        success: function(status) {
            if (status == "None") {
                populateSearchResults([]);
            }
            var res = JSON.parse(status);
            populateSearchResults(res);
        }
    });
}

function populateSearchResults(res) {
    var table = document.getElementById("searchResultsTable");
    $("#searchResultsTable").find("tr:gt(0)").remove();
    for (var i = 0; i < res.length; i++) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        cell1.innerHTML = res[i]['name'];
        cell2.innerHTML = "<a id='userPageLink' href='/user/" + res[i]['username'] + "'>" + res[i]['username'] + "</a>";
        cell3.innerHTML = "stuff";
        cell4.innerHTML = "<span onclick='viewSearchCode(this)' class='actionButton'>View</span>";
        cell4.innerHTML = cell4.innerHTML + "<span onclick='' class='actionButton'>Run</span>";
        cell4.innerHTML = cell4.innerHTML + "<span onclick='' class='actionButton'>Import</span>";
    }
    if (res.length == 0) {
        $("#searchResultsDiv").css('display', 'none');
        $("#searchNothingHere").css('display', 'block');
    } else {
        $("#searchResultsDiv").css('display', 'block');
        $("#searchNothingHere").css('display', 'none');
    }
}

function viewSearchCode(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var user = cell.parentNode.parentNode.cells[1].innerHTML;
    user = user.substr(user.indexOf(">") + 1);
    user = user.substr(0, user.indexOf("<"));
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": false
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(status) {
            var res = JSON.parse(status);
            displaySearchCode(res['code']);
        }
    });
}

function displaySearchCode(code) {
    searchEditor.setValue(code, 1);
    $("#searchEditorDiv").css('display', 'block');
}

function pencilClick() {
    $('#browseDiv').css('display', 'none');
    $('#mainTableDiv').css('display', 'block');
}

var currentMarker;

function noodle(code) {
    variables = [];
    uninitialisedVariables = [];
    structs = [];
    structStarted = false;
    defineStarted = false;
    globalLines = [];
    var arrayOfLines = code.split(/\r?\n/);
    linesArray = arrayOfLines;
    var blockStack = [];
    currentLevel = 0;
    hasMain = false;
    funcList = [];
    var isCorrect = errorCheck(arrayOfLines, blockStack);
    if (isCorrect) {
        document.getElementById('noodleOutputBox').value = "";
        var Range = ace.require('ace/range').Range;
        $("#errorIndicator").attr("src", "/assets/images/tick.png");
        shouldSkip = false;
        satisfied = false;
        codeBlockStack = [];
        endStack = [];
        finishStack = [];
        loopsLeft = [];
        stepperVar = [];
        whileCount = [];
        target = [];
        currentStepper = [];
        increment = [];
        shouldReturn = false;
        variables.push(new variable("T", "null", null));
        for (var i = 0; i < globalLines.length; i++) {
            execute(linesArray, globalLines[i] - 1, globalLines[i]);
        }
        execute(linesArray, mainFunction.start - 1, mainFunction.end - 1);
    } else {
        $("#errorIndicator").attr("src", "/assets/images/cross.png");
    }
}

function execute(arrayOfLines, i, endLine) {
    for (var j = i; j < endLine; j++) {
        decode(arrayOfLines[j].replace(/^\s+/, ''), j);
        if (shouldReturn) {
            shouldReturn = false;
            return;
        }
        if (endStack[endStack.length - 1] == true) {
            if (codeBlockStack[codeBlockStack.length - 1] == "while") {
                addEndLine(j + 1);
                whileCount[whileCount.length - 1].count += 1;
                if (anyWhilesOverflow()) {
                    return;
                }
                if (whileCount[whileCount.length - 1].ended == false) {
                    j = whileCount[whileCount.length - 1].line - 1;
                } else {
                    whileCount.pop();
                }
                codeBlockStack.pop();
                endStack.pop();
            } else {
                return j;
            }
        }
        if (codeBlockStack[codeBlockStack.length - 1] == "for" && finishStack[finishStack.length - 1] == true) {
            finishStack.pop();
            finishStack.push(false);
            var inc = parseInt(increment.pop());
            var start = parseInt(currentStepper.pop());
            var end = parseInt(target.pop());
            var stepper = stepperVar.pop();
            var l;
            var count = 0;
            var overflow = false;
            var equality = equalityStack.pop();
            if (equality == null) {
                if (start <= end) {
                    equality = "<";
                } else {
                    equality = ">";
                }
            }
            while (equalityHolds(start, end, equality) && !overflow) {
                l = execute(arrayOfLines, j + 1, endLine);
                endStack[endStack.length - 1] = false;
                if (stepper == "") {
                    start += inc;
                } else {
                    start = updateStepper(stepper, inc);
                }
                count += 1;
                if (count > 1000) {
                    overflow = true;
                }
            }
            if (overflow) {
                var line = j + 1
                addError("Stack overflow on line " + line);
                return;
            }
            endStack.pop();
            finishStack.pop();
            codeBlockStack.pop();
            stepperVar.pop();
            j = l;
        }
    }
}

function addEndLine(end) {
    whileCount[whileCount.length - 1].end = end;
}

function incWhileCount(lineNumber) {
    for (var i = 0; i < whileCount.length; i++) {
        if (whileCount[i].line == lineNumber) {
            whileCount[i].count += 1;
        }
    }
}

function anyWhilesOverflow() {
    for (var i = 0; i < whileCount.length; i++) {
        if (whileCount[i].count > 1000) {
            var line = whileCount[i].line + 1;
            addError("Stack overflow on line " + line);
            return true;
        }
    }
    return false;
}

function firstWhile(lineNumber) {
    for (var i = 0; i < whileCount.length; i++) {
        if (whileCount[i].line == lineNumber) {
            return false;
        }
    }
    return true;
}

function updateStepper(stepper, inc) {
    var stepV = findVar(stepper);
    stepV.value += inc;
    return stepV.value;
}

function equalityHolds(start, end, equality) {
    switch (equality) {
        case "<":
            return start < end;
        case ">":
            return start > end;
        case "<=":
            return start <= end;
        case ">=":
            return start >= end;
        case "==":
            return start == end;
        case "!=":
            return start != end;
    }
}

function editorClick() {
    editor.session.removeMarker(currentMarker);
}

function findUnVar(varName) {
    for (var i = uninitialisedVariables.length - 1; i >= 0; i--) {
        if (uninitialisedVariables[i].name == varName) {
            return uninitialisedVariables[i];
        }
    }
    return null;
}

function removeBlankEntries(expList) {
    var newList = []
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] != "") {
            newList.push(expList[i]);
        }
    }
    return newList;
}

var editor;
var previewEditor;
var searchEditor;

function setEditor(e) {
    editor = e;
    editor.addEventListener("click", editorClick);
    editor.addEventListener("input", editorEdited);
    editor.addEventListener('keydown', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    });
}

function setPreviewEditor(e) {
    previewEditor = e;
}

function setSearchEditor(e) {
    searchEditor = e;
}

function editorEdited() {

    document.getElementById("save").src = "/assets/images/save.png";
}

var ace;

function setAce(a) {
    ace = a;
}
