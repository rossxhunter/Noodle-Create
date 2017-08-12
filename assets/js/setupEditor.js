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
        if (sessionUser == null) {
            editor.setTheme("ace/theme/noodle_light");
        }
        else {
            $.ajax({
                async: false,
                data: {
                    "user": sessionUser
                },
                type: "POST",
                url: "/db/getUserDetails.php",
                success: function(r) {
                    var res = JSON.parse(r);
                    setTheme(res['theme']);
                    setFontSize(res['font_size']);
                    editor.renderer.updateFontSize();
                    setSize0();
                }
            });
        }
        editor.session.setOptions({
            mode: "ace/mode/noodle",
            tabSize: 2,
            useSoftTabs: true
        });
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        if (window.location.href.match(/.*\/create\/lib/) != null) {
            window.history.pushState(null, "LibRemove", "/create");
            editor.session.insert({
                row: 1,
                column: 0
            }, "//Code here!")
        }
        else {
            editor.session.insert({
                row: 1,
                column: 0
            }, "func main()\n  //Code here!\nend")
        }
        editor.commands.addCommand({
            name: 'new',
            bindKey: {
                win: 'Ctrl-Shift-N',
                mac: 'Command-Shift-N'
            },
            exec: function() {
                newFileClick();
            },
            readOnly: true
        });
        editor.setAutoScrollEditorIntoView(true);
        checkProgramLibrary();
        setDimensions();
        window.onbeforeunload = function(e) {
            if (unsaved) {
                return "Unsaved changes";
            }
        };
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
