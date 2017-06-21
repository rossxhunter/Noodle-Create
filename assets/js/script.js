function setDimensions(editor) {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var numberOfLines = Math.round(height / 1.95 / editor.renderer.lineHeight);
    editor.setOption("maxLines", numberOfLines);
    editor.setOption("minLines", numberOfLines);
    document.getElementById("editorDiv").style.height = height / 1.9 + 'px';
    document.getElementById("noodleOutputBoxContainer").style.height = height / 1.54 + 'px';
    document.getElementById("outputBorderDiv").style.height = height / 1.54 + 'px';
    document.getElementById("editorBorderDiv").style.height = height / 1.8 + 'px';
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
