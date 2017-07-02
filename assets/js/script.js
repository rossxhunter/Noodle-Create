function setDimensions(editor) {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var editorContainer = document.getElementById("editorContainer").style.height;
    document.getElementById("editorBorderDiv").style.height = (height - 102) * 0.68 + 'px';
    document.getElementById("editorContainer").style.height = (height - 102) * 0.68 + 'px';
    document.getElementById("toolbarDiv").style.height = (height - 102) * 0.64 + 'px';
    var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
    var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight);
    editor.setOption("maxLines", numberOfLines);
    editor.setOption("minLines", numberOfLines);
    document.getElementById("errorsBorderDiv").style.height = (height - 102) * 0.16 + 2 + 'px';
    var editorHeight = parseInt(document.getElementById("editorContainer").style.height);
    var errorsHeight = parseInt(document.getElementById("errorsBorderDiv").style.height);
    document.getElementById("outputBorderDiv").style.height = editorHeight + errorsHeight + 1 + 'px';
}

function settingsClick() {
    document.getElementById('myModal').style.display = "block";
}

function done() {
    var theme = document.getElementById('themeSelect').value;
    var fontSize = document.getElementById('fontSizeSelect').value;
    if (fontSize >= 8 && fontSize <= 20) {
        document.getElementById('myModal').style.display = "none";
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

function fullScreen() {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    if (document.getElementById("mainBody").style.paddingTop != '0px') {
        $('#navbar').fadeOut('slow', function() {
            $("#mainBody").css("padding-top", "0px");
            $("#outputBorderDiv").css("height", "100%");
            $("#editorBorderDiv").css("height", "80%");
            $("#editorDiv").css("height", "80%");

            var numberOfLines = Math.round(height / 1.26 / editor.renderer.lineHeight);
            editor.setOption("maxLines", numberOfLines);
            editor.setOption("minLines", numberOfLines);
            document.getElementById("editorBorderDiv").style.height = height * 0.8 + 'px';
            document.getElementById("editorContainer").style.height = height * 0.8 + 'px';
            document.getElementById("toolbarDiv").style.height = height * 0.76 + 'px';
            document.getElementById("errorsBorderDiv").style.height = height * 0.2 - 2 + 'px';
            $("#noodleErrorsBoxContainer").css("height", "20%");
            $("#fullScreen").attr("src", "assets/images/smallScreen.png");
        });
    } else {
        $('#navbar').fadeIn('slow', function() {
            $("#mainBody").css("padding-top", "32px");
            $("#outputBorderDiv").css("height", "100%");
            $("#editorBorderDiv").css("height", "100%");
            document.getElementById("editorBorderDiv").style.height = (height - 102) * 0.8 + 'px';
            document.getElementById("editorContainer").style.height = (height - 102) * 0.8 + 'px';
            document.getElementById("toolbarDiv").style.height = (height - 102) * 0.76 + 'px';
            var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
            var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight);
            editor.setOption("maxLines", numberOfLines);
            editor.setOption("minLines", numberOfLines);
            document.getElementById("errorsBorderDiv").style.height = (height - 102) * 0.2 + 'px';
            $("#noodleErrorsBoxContainer").css("height", "100%");
            var editorHeight = parseInt(document.getElementById("editorBorderDiv").style.height);
            var errorsHeight = parseInt(document.getElementById("errorsBorderDiv").style.height);
            document.getElementById("outputBorderDiv").style.height = editorHeight + errorsHeight + 1 + 'px';
            $("#fullScreen").attr("src", "assets/images/fullScreen.png");
        });
    }
}

var currentMarker;

function noodle(code) {
    variables = [];
    uninitialisedVariables = [];
    var arrayOfLines = code.split(/\r?\n/);
    var blockStack = []
    var isCorrect = errorCheck(arrayOfLines, blockStack);
    if (isCorrect) {
        document.getElementById('noodleOutputBox').value = "";
        var Range = ace.require('ace/range').Range;
        $("#errorIndicator").attr("src", "assets/images/tick.png");
        shouldSkip = false;
        satisfied = false;
        codeBlockStack = [];
        endStack = [];
        finishStack = [];
        loopsLeft = [];
        execute(arrayOfLines, 0);
    }
}

function execute(arrayOfLines, i) {
    for (var j = i; j < arrayOfLines.length; j++) {
        decode(arrayOfLines[j].replace(/^\s+/, ''));
        if (endStack[endStack.length - 1] == true) {
            return j;
        }
        if (codeBlockStack[codeBlockStack.length - 1] == "for" && finishStack[finishStack.length - 1] == true) {
            finishStack.pop();
            finishStack.push(false);
            var inc = parseInt(increment.pop());
            var start = parseInt(currentStepper.pop());
            var end = parseInt(target.pop());
            var stepper = stepperVar[stepperVar.length - 1];
            var l;
            var count = 0;
            var overflow = false;
            var equality;
            if (start <= end) {
                equality = "<";
            } else {
                equality = ">";
            }
            while (equalityHolds(start, end, equality) && !overflow) {
                l = execute(arrayOfLines, j + 1);
                endStack[endStack.length - 1] = false;
                start += inc;
                count += 1;
                if (count > 10000) {
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

function equalityHolds(start, end, equality) {
    switch (equality) {
        case "<":
            return start < end;
        case ">":
            return start > end;

    }
}

function editorClick() {
    editor.session.removeMarker(currentMarker);
}

function findUnVar(varName) {
    for (var i = 0; i < uninitialisedVariables.length; i++) {
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

function setEditor(e) {
    editor = e;
    editor.addEventListener("click", editorClick);
}

var ace;

function setAce(a) {
    ace = a;
}
