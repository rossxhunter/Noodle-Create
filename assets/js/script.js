//Created by Ross Hunter Copyright (c) 2017

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
var outputBox = "";
var unsaved;
var loaded = false;
var executeRet = null;
var learnContent;
var learnTab;

function setDimensions() {
    setSize0();
}

function setSize0() {
    var body = document.body,
        html = document.documentElement;
    var height = body.clientHeight;
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
    document.getElementById("browseOutputBorderDiv").style.height = editorHeight + 'px';
    document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
}


window.addEventListener('resize', function(event) {
    switch (sizeMode) {
        case 0:
            setSize0();
            break;
        case 1:
            setSize1();
            break;
        case 2:
            setSize2();
            break;
    }
});

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
                    document.title = name;
                }
            }
        });
    }
    if (!isValid) {
        window.open("/notfound", '_self', "NotFound");
    } else {
        loadProgramLibrary(code);
        //unsaved = false;
    }
}

function loadProgramLibrary(code) {
    editor.setValue(code, -1);
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
    var tab = document.getElementById("accountSettingsTab");
    tab.focus();
}

function editorSettingsClick() {
    $('#editorSettings').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#programs').css('display', 'none');
    $('#libraries').css('display', 'none');
    var tab = document.getElementById("editorSettingsTab");
    tab.focus();
}

function programsClick() {
    $('#programs').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#editorSettings').css('display', 'none');
    $('#libraries').css('display', 'none');
    $('#programsTab').focus();
}

function librariesClick() {
    $('#libraries').css('display', 'block');
    $('#accountSettings').css('display', 'none');
    $('#programs').css('display', 'none');
    $('#editorSettings').css('display', 'none');
    $('#librariesTab').focus();
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
            document.getElementById('changeTheme').value = res['theme'];
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
        var cell4 = row.insertCell(3);
        cell1.innerHTML = progs[i]['name'];
        cell2.innerHTML = moment(progs[i]['date_created']).format('MMMM Do YYYY');
        cell3.innerHTML = moment(progs[i]['date_last_edited']).fromNow();
        cell4.innerHTML = "<span onclick='openPreview(this)' class='actionButton'>Preview</span>";
        cell4.innerHTML = cell4.innerHTML + "<span onclick='openProgram(this)' class='actionButton'>Open</span>";
        if (progs[i]['username'] == sessionUser) {
            cell4.innerHTML = cell4.innerHTML + "<span onclick='openEdit(this)' class='actionButton'>Edit</span>";
        }
    }
}

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function openEdit(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var description = getDescription(name, sessionUser);
    fileNameCurrentlyEditing = name;
    document.getElementById('editFileName').value = name;
    document.getElementById('editDescription').value = description;
    $('#editModal').css('display', 'block');
    $('#editFileName').keypress(function(e) {
        if (e.keyCode == 13)
            editSave();
    });
}

function getDescription(name, user) {
    var d;
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": "both"
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(r) {
            var res = JSON.parse(r);
            d = res['description'];
        }
    });
    return d;
}

function editSave() {
    var name = $('#editFileName').val();
    var description = $('#editDescription').val();
    if (editFileNameValidate(name)) {
        $.ajax({
            async: false,
            data: {
                "user": sessionUser,
                "name": fileNameCurrentlyEditing,
                "newName": name,
                "description": description
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
    previewEditor.setValue(code, -1);
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
        var cell4 = row.insertCell(3);
        cell1.innerHTML = libs[i]['name'];
        cell2.innerHTML = moment(libs[i]['date_created']).format('MMMM Do YYYY');
        cell3.innerHTML = moment(libs[i]['date_last_edited']).fromNow();
        cell4.innerHTML = "<span onclick='openPreview(this)' class='actionButton'>Preview</span>";
        cell4.innerHTML = cell4.innerHTML + "<span onclick='openProgram(this)' class='actionButton'>Open</span>";
        if (libs[i]['username'] == sessionUser) {
            cell4.innerHTML = cell4.innerHTML + "<span onclick='openEdit(this)' class='actionButton'>Edit</span>";
        }
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
            window.open("/create", '_self', "IndexPage");
            sessionUser = null;
        }
    });
}

function newProgramClick() {
    window.open("/create", '_self', "CreatePage");
}

function newLibraryClick() {
    isLib = true;
    window.open("/create/lib", '_self', "CreatePage");
}

function newFileClick() {
    editor.setValue("func main()\n  //Code here!\nend", 1);
    isNew = true;
    fileName = "";
    window.history.pushState(null, "New", "/create");
    document.getElementById("noodleOutputBox").value = "";
    document.title = "New File";
}

function saveClick() {
    $.ajax({
        async: false,
        url: "/db/session.php",
        success: function(status) {
            if (status == "Login/Register") {
                openLoginRegister();
            } else {
                if (isCodeProgram(editor.getValue())) {
                    saveProgram();
                } else {
                    saveLibrary();
                }
            }
        }
    });
}

function isCodeProgram(code) {
    var lines = code.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim().match(/func\s+main\(\)/) != null) {
            return true;
        }
    }
    return false;
}

function cancelSave() {
    $('#saveNameModal').css('display', 'none');
}

function saveProgram() {
    if (isNew) {
        openSaveName();
    } else {
        saveProgramToDB(fileName, null, true, false);
    }
}

function saveLibrary() {
    if (isNew) {
        openSaveName();
    } else {
        saveProgramToDB(fileName, null, false, false);
    }
}

function saveProgramToDB(name, description, isProgram, isNew) {
    fileName = name;
    var code = editor.getValue();
    code = code.replace("\\n", "\\\\n");
    $.ajax({
        data: {
            "user": sessionUser,
            "name": name,
            "description": description,
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
                unsaved = false;
                $('#saveNameModal').css('display', 'none');
                document.title = name;
            }
        }
    });
}


function openSaveName() {
    $('#saveNameModal').css('display', 'block');
}

function saveName() {
    var name = $('#fileName').val();
    var description = $('#description').val();
    var code = editor.getValue();
    if (saveNameValidate(name)) {
        saveProgramToDB(name, description, isCodeProgram(code), true);
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
    } else if (name.match(/^[a-zA-Z0-9_-\s]{3,32}$/) == null) {
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
    $('#passwordField').keypress(function(e) {
        if (e.keyCode == 13)
            loginRegisterDone();
    });
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
    $.ajax({
        async: false,
        data: {
            "user": sessionUser
        },
        type: "POST",
        url: "/db/getUserDetails.php",
        success: function(r) {
            var res = JSON.parse(r);
            $('#themeSelect').val(res['theme']);
            $('#fontSizeSelect').val(res['font_size']);
        }
    });
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
            startedCoding = true;
            sessionUser = document.getElementById('usernameField').value;
            $('#welcome').fadeOut('slow', function() {
                $('#mainTableDiv').css('visibility', 'visible').hide().fadeIn('slow');
            });
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
                    sessionUser = null;
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
        setTheme(theme);
        setFontSize(fontSize);
        editor.renderer.updateFontSize();
        setSize0();
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
}

function cleanClick(code) {
    var lines = code.split(/\r?\n/);
    var numBlocks = 0;
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
        var reqTabs = getTabs(numBlocks);
        if (isBlock(lines[i].trim())) {
            numBlocks += 1;
        } else if (lines[i].trim().match(/^end$/) != null) {
            numBlocks -= 1;
            reqTabs = getTabs(numBlocks);
        }
        lines[i] = reqTabs + lines[i];
    }
    lines = concatLines(lines);
    editor.setValue(lines, 1);
}

function isBlock(line) {
    var firstWord = line.match(/([^\s]+)/);
    if (firstWord != null) {
        firstWord = firstWord[0];
    }
    if (isBlockWord(firstWord)) {
        return true;
    }
    return false;
}

function isBlockWord(word) {
    var blockWords = ["func", "import", "if", "else", "struct", "for", "while", "do", "define"];
    for (var i = 0; i < blockWords.length; i++) {
        if (word == blockWords[i]) {
            return true;
        }
    }
    return false;
}

function getTabs(numBlocks) {
    var result = "";
    for (var i = 0; i < numBlocks; i++) {
        result = result + "  ";
    }
    return result;
}

function concatLines(lines) {
    var result = "";
    for (var i = 0; i < lines.length; i++) {
        result += lines[i];
        if (i < lines.length - 1) {
            result += '\n';
        }
    }
    return result;
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

function findClick() {
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
    var height = body.clientHeight;
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
        document.getElementById("browseOutputBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("toolbarDiv").style.height = height * 0.96 + 'px';
        document.getElementById("browseToolbarDiv").style.height = height * 0.96 + 'px';
    });
}

function setSize2() {
    var body = document.body,
        html = document.documentElement;
    var height = body.clientHeight;
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
        document.getElementById("browseOutputBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("browseSelectBorderDiv").style.height = editorHeight + 'px';
        document.getElementById("toolbarDiv").style.height = (height - 102) * 0.96 + 'px';
        document.getElementById("browseToolbarDiv").style.height = (height - 102) * 0.96 + 'px';
    });
}

function fullScreenClick() {
    if (document.getElementById("mainBody").style.paddingTop != '0px') {
        sizeMode = 1;
        setSize1();
    } else {
        sizeMode = 2;
        setSize2();
    }
}

function deleteAccount() {
    $('#deleteAccountConfirmModal').css('display', 'block');
}

function cancelAccountDelete() {
    $('#deleteAccountConfirmModal').css('display', 'none');
}

function deleteAccountDelete() {
    $('#deleteAccountConfirmModal').css('display', 'none');
    $.ajax({
        async: false,
        url: "/db/logout.php",
        success: function(status) {}
    });
    $.ajax({
        async: false,
        url: "/db/deleteAccount.php",
        data: {
            "user": sessionUser
        },
        type: "POST",
        success: function(status) {
            window.open("/create", '_self', "Home");
        }
    });
}

function libraryClick() {
    $('#mainTableDiv').css('display', 'none');
    $('#browseDiv').css('display', 'block');
    var searchBar = document.getElementById("searchBar");
    searchBar.addEventListener("input", searchResultsUpdate);
}

function descriptionClose() {
    $('#descriptionModal').css('display', 'none');
}

function legalClose() {
    $('#legalModal').css('display', 'none');
}

function aboutClose() {
    $('#aboutModal').css('display', 'none');
}

function legalOpen() {
    $('#legalModal').css('display', 'block');
}

function aboutOpen() {
    $('#aboutModal').css('display', 'block');
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
        var isProgram = getIsProgram(res[i]['name'], res[i]['username']);
        cell1.innerHTML = res[i]['name'];
        cell2.innerHTML = "<a id='userPageLink' href='/user/" + res[i]['username'] + "'>" + res[i]['username'] + "</a>";
        if (isProgram) {
            var imgSrc = "/assets/images/progCircle.png";
        } else {
            var imgSrc = "/assets/images/libCircle.png";
        }
        cell3.innerHTML = "<img id='libProgCircle' src='" + imgSrc + "' />";
        cell4.innerHTML = "<span onclick='viewSearchCode(this)' class='actionButton'>Code</span>";
        cell4.innerHTML = cell4.innerHTML + "<span onclick='openDescription(this)' class='actionButton'>Description</span>";
        if (isProgram) {
            cell4.innerHTML = cell4.innerHTML + "<span onclick='runSearchProgram(this)' class='actionButton'>Run</span>";
        } else {
            cell4.innerHTML = cell4.innerHTML + "<span onclick='importSearchLib(this)' class='actionButton'>Import</span>";
        }
    }
    if (res.length == 0) {
        $("#searchResultsDiv").css('display', 'none');
        $("#searchNothingHere").css('display', 'block');
    } else {
        $("#searchResultsDiv").css('display', 'block');
        $("#searchNothingHere").css('display', 'none');
    }
}

function openDescription(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var user = cell.parentNode.parentNode.cells[1].innerHTML;
    user = user.substr(user.indexOf(">") + 1);
    user = user.substr(0, user.indexOf("<"));
    var isProgram = getIsProgram(name, user);
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": isProgram
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(status) {
            var desc;
            if (status == "Not Found") {
                desc = "";
            } else {
                var res = JSON.parse(status);
                desc = res['description'];
            }
            document.getElementById("descriptionModalText").innerHTML = desc;
        }
    });
    $('#descriptionModal').css('display', 'block');
}

function runSearchProgram(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var user = cell.parentNode.parentNode.cells[1].innerHTML;
    user = user.substr(user.indexOf(">") + 1);
    user = user.substr(0, user.indexOf("<"));
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": true
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(status) {
            var res = JSON.parse(status);
            outputBox = "browseOutputBox";
            noodle(res['code'], false);
        }
    });
    $("#browseOutputBoxContainer").css("display", "block");
    $("#browseSelectBoxContainer").css("display", "none");
}

function importSearchLib(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var user = cell.parentNode.parentNode.cells[1].innerHTML;
    user = user.substr(user.indexOf(">") + 1);
    user = user.substr(0, user.indexOf("<"));
    var code = editor.getValue();
    var lines = code.split(/\r?\n/);
    if (importExists(lines)) {
        addNewImport(lines, name, user);
    } else {
        createImport(lines, name, user);
    }
}

function importExists(lines) {
    importFound = false;
    for (var i = 0; i < lines.length; i++) {
        if (importFound) {
            if (lines[i].trim().match(/^end$/) != null) {
                return true;
            }
        }
        if (lines[i].trim().match(/^import$/) != null) {
            importFound = true;
        }
    }
    return false;
}

function addNewImport(lines, name, user) {
    var importFound = false;
    var finished = false;
    var i = 0;
    var importLine = "  " + user + "/" + name;
    while (i < lines.length && !finished) {
        if (lines[i].trim() == importLine.trim()) {
            finished = true;
        }
        if (importFound) {
            if (lines[i].trim().match(/^end$/) != null) {
                lines.splice(i, 0, importLine);
                finished = true;
            }
        }
        if (lines[i].trim().match(/^import$/) != null) {
            importFound = true;
        }
        i += 1;
    }

    var code = concatLines(lines);
    editor.setValue(code, -1);
}

function createImport(lines, name, user) {
    lines.splice(0, 0, "import");
    var importLine = "  " + user + "/" + name;
    lines.splice(1, 0, importLine);
    lines.splice(2, 0, "end");
    var code = concatLines(lines);
    editor.setValue(code, -1);
}

function getIsProgram(name, user) {
    var isProgram = true;
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name
        },
        type: "POST",
        url: "/db/findLib.php",
        success: function(status) {
            if (status != "Not found") {
                isProgram = false;
            }
        }
    });
    return isProgram;
}

function viewSearchCode(cell) {
    var name = cell.parentNode.parentNode.cells[0].innerHTML;
    var user = cell.parentNode.parentNode.cells[1].innerHTML;
    user = user.substr(user.indexOf(">") + 1);
    user = user.substr(0, user.indexOf("<"));
    var isProgram = getIsProgram(name, user);
    $.ajax({
        async: false,
        data: {
            "user": user,
            "name": name,
            "isProgram": isProgram
        },
        type: "POST",
        url: "/db/getProgramLibrary.php",
        success: function(status) {
            var res = JSON.parse(status);
            displaySearchCode(res['code']);
        }
    });
    $("#browseOutputBoxContainer").css("display", "none");
    $("#browseSelectBoxContainer").css("display", "block");
}

function displaySearchCode(code) {
    searchEditor.setValue(code, -1);
    $("#searchEditorDiv").css('display', 'block');
}

function pencilClick() {
    $('#browseDiv').css('display', 'none');
    $('#mainTableDiv').css('display', 'block');
    editor.setValue(editor.getValue(), -1);
}

function introductionClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#introductionContent').css('display', 'block');
    $('#introductionTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("introductionContent");
    learnTab = document.getElementById("introductionTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function variablesClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#variablesContent').css('display', 'block');
    $('#variablesTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("variablesContent");
    learnTab = document.getElementById("variablesTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function inputOutputClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#inputOutputContent').css('display', 'block');
    $('#inputOutputTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("inputOutputContent");
    learnTab = document.getElementById("inputOutputTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function controlStructuresClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#controlStructuresContent').css('display', 'block');
    $('#controlStructuresTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("controlStructuresContent");
    learnTab = document.getElementById("controlStructuresTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function arraysClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#arraysContent').css('display', 'block');
    $('#arraysTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("arraysContent");
    learnTab = document.getElementById("arraysTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function structsClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#structsContent').css('display', 'block');
    $('#structsTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("structsContent");
    learnTab = document.getElementById("structsTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function functionsClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#functionsContent').css('display', 'block');
    $('#functionsTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("functionsContent");
    learnTab = document.getElementById("functionsTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function importsClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#importsContent').css('display', 'block');
    $('#importsTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("importsContent");
    learnTab = document.getElementById("importsTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function extraClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#extraContent').css('display', 'block');
    $('#extraTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("extraContent");
    learnTab = document.getElementById("extraTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

function contactClick() {
    learnContent.style.display = 'none';
    learnTab.style.borderRightStyle = 'none';
    $('#contactContent').css('display', 'block');
    $('#contactTab').css('border-right-style', 'solid');
    learnContent = document.getElementById("contactContent");
    learnTab = document.getElementById("contactTab");
    document.getElementById("learnContentDiv").scrollTop = 0;
}

var currentMarker;

function noodle(code, isMain) {
    if (isMain) {
        outputBox = "noodleOutputBox";
    }
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
    if (outputBox == "") {
        outputBox = "noodleOutputBox";
    }
    var isCorrect = errorCheck(arrayOfLines, blockStack);
    if (isCorrect) {
        document.getElementById(outputBox).value = "";
        var Range = ace.require('ace/range').Range;
        if (outputBox == "noodleOutputBox") {
            $("#errorIndicator").attr("src", "/assets/images/tick.png");
        }
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
        variables.push(new variable("T", "read", null));
        for (var i = 0; i < globalLines.length; i++) {
            execute(linesArray, globalLines[i] - 1, globalLines[i]);
        }
        execute(linesArray, mainFunction.start - 1, mainFunction.end - 1);
    } else {
        if (outputBox == "noodleOutputBox") {
            $("#errorIndicator").attr("src", "/assets/images/cross.png");
        }
    }
}
/*
function execute(arrayOfLines, i, endLine) {
    if (i == endLine) {
        return;
    }
    var output = decode(arrayOfLines[i].replace(/^\s+/, ''), i);
    if (output != null && output != undefined) {
        document.getElementById(outputBox).value += output;
        //setTimeout(function(){
            return continueExecute(arrayOfLines, i, endLine);
        //}, 0);
    }
    else {
        return continueExecute(arrayOfLines, i, endLine);
    }


}

function continueExecute(arrayOfLines, i, endLine) {
    if (i == endLine) {
        return;
    }
    if (shouldReturn) {
        shouldReturn = false;
        return;
    }
    if (endStack[endStack.length - 1] == true) {
        if (codeBlockStack[codeBlockStack.length - 1] == "while") {
            addEndLine(i + 1);
            whileCount[whileCount.length - 1].count += 1;
            if (anyWhilesOverflow()) {
                return;
            }
            if (whileCount[whileCount.length - 1].ended == false) {
                i = whileCount[whileCount.length - 1].line - 1;
            } else {
                whileCount.pop();
            }
            codeBlockStack.pop();
            endStack.pop();
        } else {
            executeRet = i;
            return i;
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
            l = execute(arrayOfLines, i + 1, endLine);
            //l = executeRet;
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
            var line = i + 1
            addError("Stack overflow on line " + line);
            return;
        }
        endStack.pop();
        finishStack.pop();
        codeBlockStack.pop();
        stepperVar.pop();
        i = l;
    }
    return execute(arrayOfLines, i + 1, endLine);
}
*/

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
    if (loaded) {

        unsaved = true;
        document.getElementById("save").src = "/assets/images/save.png";
    } else {
        loaded = true;
    }
}

var ace;

function setAce(a) {
    ace = a;
}
