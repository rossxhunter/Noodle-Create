function setupEditor() {
    // setup paths
    require.config({
        paths: {
            "ace": "ace/lib/ace"
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
            useSoftTabs: false
        });
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        editor.session.insert({
            row: 1,
            column: 0
        }, "func main()\n  //Code here!\nend")
        editor.setAutoScrollEditorIntoView(true);
        setDimensions(editor);
    });
}
