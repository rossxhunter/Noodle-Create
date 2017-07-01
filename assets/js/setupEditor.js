function setupEditor() {
    // setup paths
    require.config({
        paths: {
            "ace": "ace/lib/ace"
        }
    });
    // load ace and extensions
    require(["ace/ace", "ace/ext/static_highlight"], function(ace) {
        var editor = ace.edit("editor");
        setEditor(editor);
        setAce(ace);
        editor.setTheme("ace/theme/noodle_light");
        editor.session.setOptions({
            mode: "ace/mode/noodle",
            tabSize: 2,
            useSoftTabs: false,
        });
        editor.session.insert({
            row: 1,
            column: 0
        }, "func main()\n  //Code here!\nend")
        editor.setAutoScrollEditorIntoView(true);
        setDimensions(editor);
    });
}
