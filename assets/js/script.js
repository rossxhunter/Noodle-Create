function setDimensions(editor) {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var editorContainer = document.getElementById("editorContainer").style.height;
    document.getElementById("editorBorderDiv").style.height = (height - 102) * 0.67 + 'px';
    document.getElementById("editorContainer").style.height = (height - 102) * 0.67 + 'px';
    var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
    var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight);
    editor.setOption("maxLines", numberOfLines);
    editor.setOption("minLines", numberOfLines);
    document.getElementById("errorsBorderDiv").style.height = (height - 102) * 0.17 + 2 + 'px';
    var editorHeight = parseInt(document.getElementById("editorContainer").style.height);
    var errorsHeight = parseInt(document.getElementById("errorsBorderDiv").style.height);
    document.getElementById("outputBorderDiv").style.height = editorHeight + errorsHeight + 1 + 'px';
}

function settings() {
    document.getElementById('myModal').style.display = "block";
}

function done() {
    document.getElementById('myModal').style.display = "none";
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
            document.getElementById("editorBorderDiv").style.height = height / 1.26 + 'px';
            document.getElementById("editorContainer").style.height = height / 1.26 + 'px';
            document.getElementById("errorsBorderDiv").style.height = height * 0.2 + 3 + 'px';
            $("#noodleErrorsBoxContainer").css("height", "20%");
            //$("#mainBody").css("top", "50%");
            //$("#mainBody").css("position", "absolute");
            //$("#mainBody").css("transform", "translate(0%, 0%)");
            $("#fullScreen").attr("src","assets/images/smallScreen.png");
        });
    }
    else {
        $('#navbar').fadeIn('slow', function() {
            $("#mainBody").css("padding-top", "32px");
            $("#outputBorderDiv").css("height", "100%");
            $("#editorBorderDiv").css("height", "100%");
            $("#editorDiv").css("height", "80%");
            document.getElementById("editorBorderDiv").style.height = (height - 102) * 0.8 + 'px';
            document.getElementById("editorContainer").style.height = (height - 102) * 0.8 + 'px';
            var editorBorderDiv = parseInt(document.getElementById("editorBorderDiv").style.height);
            var numberOfLines = Math.round(editorBorderDiv / editor.renderer.lineHeight);
            editor.setOption("maxLines", numberOfLines);
            editor.setOption("minLines", numberOfLines);
            document.getElementById("errorsBorderDiv").style.height = (height - 102) * 0.2 - 1 + 'px';
            $("#noodleErrorsBoxContainer").css("height", "100%");
            var editorHeight = parseInt(document.getElementById("editorBorderDiv").style.height);
            var errorsHeight = parseInt(document.getElementById("errorsBorderDiv").style.height);
            document.getElementById("outputBorderDiv").style.height = editorHeight + errorsHeight + 2 + 'px';
            //$("#mainBody").css("top", "0%");
            //$("#mainBody").css("position", "static");
            //$("#mainBody").css("transform", "translate(0%, 0%)");
            $("#fullScreen").attr("src","assets/images/fullScreen.png");
        });
    }
}

function showBoxes() {

    //document.getElementById("welcome").style.visibility = 'collapse';

    //document.getElementById("mainTable").style.visibility = 'visible';
    //$('#mainTable').css('visibility','visible').hide().fadeIn('slow');
}

var currentMarker;

function noodle(code) {
    variables = [];
    uninitialisedVariables = [];
    var arrayOfLines = code.split(/\r?\n/);
    var isCorrect = errorCheck(arrayOfLines);
    if (isCorrect) {
        document.getElementById('noodleOutputBox').value = "";
        var Range = ace.require('ace/range').Range;
        currentMarker = editor.session.addMarker(new Range(0, 0, arrayOfLines.length - 1, 1), "correctSyntax", "fullLine");
        for (var i = 0; i < arrayOfLines.length; i++) {
            decode(arrayOfLines[i].replace(/^\s+/, ''));
        }
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
