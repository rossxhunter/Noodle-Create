function setDimensions(editor) {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var numberOfLines = Math.round(height / 1.7 / editor.renderer.lineHeight);
    editor.setOption("maxLines", numberOfLines);
    editor.setOption("minLines", numberOfLines);
    document.getElementById("editorDiv").style.height = height / 1.7 + 'px';
    document.getElementById("editorBorderDiv").style.height = height / 1.6 + 'px';
    document.getElementById("errorsBorderDiv").style.height = height / 8 + 'px';
    var editorHeight = parseInt(document.getElementById("editorBorderDiv").style.height);
    var errorsHeight = parseInt(document.getElementById("errorsBorderDiv").style.height);
    document.getElementById("outputBorderDiv").style.height = editorHeight + errorsHeight + 14 + 'px';
}

// Get the modal
//var modal = document.getElementById('myModal');

// Get the button that opens the modal
//var settings = document.getElementById("settings");

// Get the <span> element that closes the modal
//var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
function settings() {
    document.getElementById('myModal').style.display = "block";
}

function done() {
    document.getElementById('myModal').style.display = "none";
}

// When the user clicks on <span> (x), close the modal
/*
function close() {
    window.alert("HI!");
    document.getElementById('myModal').style.display = "none";
}
*/
// When the user clicks anywhere outside of the modal, close it
/*
window.onclick = function(event) {
    if (event.target == document.getElementById('myModal')) {
        document.getElementById('myModal').style.display = "none";
    }
}
*/

function fullScreen() {
    if (document.getElementById("mainBody").style.paddingTop != '0px') {
        $('#navbar').fadeOut('slow', function() {
            $("#mainBody").css("padding-top", "0px");
            $("#mainBody").css("top", "50%");
            $("#mainBody").css("position", "absolute");
            $("#mainBody").css("transform", "translate(0%, -50%)");
            $("#fullScreen").attr("src","assets/images/smallScreen.png");
        });
    }
    else {
        $("#mainBody").css("padding-top", "105px");
        $("#mainBody").css("top", "0%");
        $("#mainBody").css("position", "static");
        $("#mainBody").css("transform", "translate(0%, 0%)");
        $('#navbar').fadeIn('slow');
        $("#fullScreen").attr("src","assets/images/fullScreen.png");
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
