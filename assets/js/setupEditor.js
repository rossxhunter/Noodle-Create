function setupEditor() {
    // setup paths
    require.config({
        paths: {
            "ace": "/ace/lib/ace"
        }
    });
    // load ace and extensions
    require(["ace/ace", "ace/ext/static_highlight", "ace/ext/language_tools"], function(ace) {
        var editor = ace.edit("editor");
        setEditor(editor);
        setAce(ace);
        editor.setTheme("ace/theme/noodle_light");
        editor.session.setOptions({
            mode: "ace/mode/noodle",
            tabSize: 2,
            useSoftTabs: true
        });
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        editor.session.insert({
            row: 1,
            column: 0
        }, "func main()\n  //Code here!\nend")
        if (isLib) {
            editor.setValue("//Code here!", 1);
        }
        editor.setAutoScrollEditorIntoView(true);
        checkProgramLibrary();
        setDimensions();
    });
}

function setupPreviewEditor() {
    // setup paths
    require.config({
        paths: {
            "ace": "/ace/lib/ace"
        }
    });
    // load ace and extensions
    require(["ace/ace", "ace/ext/static_highlight", "ace/ext/language_tools"], function(ace) {
        var e = ace.edit("previewEditor");
        setPreviewEditor(e);
        setAce(ace);
        e.setTheme("ace/theme/noodle_light");
        e.session.setOptions({
            mode: "ace/mode/noodle",
            tabSize: 2,
            useSoftTabs: true
        });
        e.setAutoScrollEditorIntoView(true);
        e.setOption("maxLines", 15);
        e.setOption("minLines", 15);
        e.setReadOnly(true);
    });
}

function setupSearchEditor() {
    // setup paths
    require.config({
        paths: {
            "ace": "/ace/lib/ace"
        }
    });
    // load ace and extensions
    require(["ace/ace", "ace/ext/static_highlight", "ace/ext/language_tools"], function(ace) {
        var e = ace.edit("searchEditor");
        setSearchEditor(e);
        setAce(ace);
        e.setTheme("ace/theme/noodle_light");
        e.session.setOptions({
            mode: "ace/mode/noodle",
            tabSize: 2,
            useSoftTabs: true
        });
        e.setAutoScrollEditorIntoView(true);
        e.setReadOnly(true);
    });
}
