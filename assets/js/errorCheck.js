function uninitialisedVariable(type, name, start, level, end) {
    this.type = type;
    this.name = name;
    this.start = start;
    this.level = level;
    this.end = end;
}

var uninitialisedVariables = [];
var mainFunction;

function codeBlock(type, line) {
    this.type = type;
    this.line = line;
}

function arg(type, name) {
    this.type = type;
    this.name = name;
}

function mainFunc(start, end) {
    this.start = start;
    this.end = end;
}

function func(name, type, start, end, args, returned) {
    this.name = name;
    this.type = type;
    this.start = start;
    this.end = end;
    this.args = args;
    this.returned = returned;
}

var currentLevel = 0;
var hasMain = false;
var funcList = [];

function errorCheck(arrayOfLines, blockStack) {
    document.getElementById('noodleOutputBox').value = "";
    var initialCorrect = true;
    for (var i = 0; i < arrayOfLines.length; i++) {
        if (arrayOfLines[i].search(/\s*func\s+main\s*\(\s*\)\s*/) == 0) {
            if (blockStack.length != 0) {
                var line = i + 1;
                addError("Unexpected main function on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("main", i + 1));
            if (!hasMain) {
                hasMain = true;
            } else {
                var line = i + 1;
                addError("Unexpected main function on line " + line);
                initialCorrect = false;
            }
            mainFunction = new mainFunc(i + 1, 0);
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/func(\s*\(|\s)/) == 0) {
            if (blockStack.length != 0) {
                var line = i + 1;
                addError("Unexpected function on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("func", i + 1));
            if (!checkFunc(arrayOfLines[i], i + 1)) {
                initialCorrect = false;
            }
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/if\s*\(/) == 0) {
            blockStack.push(new codeBlock("if", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/else\s+if\s*\(/) == 0) {
            var precedingBlock = blockStack.pop();
            if (precedingBlock.type != "else if" && precedingBlock.type != "if") {
                var line = i + 1;
                addError("Unexpected else if on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("else if", i + 1));
        } else if (arrayOfLines[i].trim().search(/^else$/) == 0) {
            var precedingBlock = blockStack.pop();
            if (precedingBlock.type != "else if" && precedingBlock.type != "if") {
                var line = i + 1;
                addError("Unexpected else on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("else", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/for\s*\(/) == 0) {
            blockStack.push(new codeBlock("for", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/while\s*\(/) == 0) {
            blockStack.push(new codeBlock("while", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/do\s+while\s*\(/) == 0) {
            blockStack.push(new codeBlock("do while", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').replace(/\s+$/, '').search(/^(return|return\s.*)$/) == 0) {
            if (blockStack[0] == null) {
                var line = i + 1;
                addError("Unexpected return statement on line " + line);
                initialCorrect = false;
            }
        } else if (arrayOfLines[i].replace(/^\s+/, '').search("end") == 0) {
            if (blockStack[blockStack.length-1].type == "main") {
                mainFunction.end = i + 1;
            }
            if (blockStack.length != 0) {
                blockStack.pop();
            } else {
                var line = i + 1;
                addError("Unexpected end statement on line " + line);
                initialCorrect = false;
            }
        }
        if (!initialCorrect) {
            addRedLine(i + 1);
            return false;
        }
    }
    if (blockStack.length != 0) {
        unendedBlockError(blockStack);
        return false;
    }
    if (!hasMain) {
        addError("Cannot find main function");
        return false;
    }
    var isCorrect = true;
    for (var i = 0; i < arrayOfLines.length; i++) {
        isCorrect = isCorrect && checkLine(arrayOfLines[i].replace(/^\s+/, ''), i + 1);
    }
    return isCorrect;
}

function addRedLine(line) {
    var Range = ace.require('ace/range').Range;
    if (currentMarker != null) {
        editor.session.removeMarker(currentMarker);
    }
    currentMarker = editor.session.addMarker(new Range(line - 1, 0, line - 1, 1), "syntaxError", "fullLine");
    $("#errorIndicator").attr("src", "assets/images/cross.png");
}

function unendedBlockError(blockStack) {
    for (var i = 0; i < blockStack.length; i++) {
        if (blockStack[i].type == "if") {
            addError("Unended if statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "else if") {
            addError("Unended else if statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "else") {
            addError("Unended else statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "for") {
            addError("Unended for loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "while") {
            addError("Unended while loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "do while") {
            addError("Unended do while loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "main") {
            addError("Unended main function on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "func") {
            addError("Unended function on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        }
    }
}

function addError(error) {
    document.getElementById('noodleOutputBox').value += "ERROR: " + error + "\n";
}

function checkLine(line, lineNumber) {
    var isCorrect = true;
    var error = "";
    if (line.search("print ") == 0) {
        isCorrect = checkPrint(line, lineNumber);
    } else if (line.search(/int |float |string |char |bool /) == 0) {
        isCorrect = checkVarDec(line, lineNumber);
    } else if (isValid("var", line)) {
        isCorrect = checkVarAss(line, lineNumber);
    } else if (line.search(/if\s*\(/) == 0) {
        isCorrect = checkIf(line, lineNumber);
    } else if (line.search(/else\s+if\s*\(/) == 0) {
        updateVarScope(lineNumber, false);
        isCorrect = checkIf(line, lineNumber);
    } else if (line.search(/for\s*\(/) == 0) {
        isCorrect = checkFor(line, lineNumber);
    } else if (line.search(/(do\s+)?while\s*\(/) == 0) {
        isCorrect = checkWhile(line, lineNumber);
    } else if (line.replace(/\s/g, '').match(/^end$/) != null) {
        if (currentLevel == 1) {
            var reqFunc = findFuncByLine(lineNumber);
            if (reqFunc.type != "void" && reqFunc.returned == false) {
                addError("No return statement found for non void function after reaching end on line " + lineNumber);
                isCorrect = false;
            }
            reqFunc.end = lineNumber;
        }
        updateVarScope(lineNumber, true);
    } else if (line.replace(/\s/g, '').match(/^else$/) != null) {
        updateVarScope(lineNumber, false);
    } else if (line.match(/^func\s+main\s*\(\s*\)\s*$/) != null) {
        currentLevel += 1;
        funcList.push(new func("main", "void", lineNumber, 0, false));
    } else if (line.match(/^func\s*.*$/) != null) {
        currentLevel += 1;
        var args = getArgs(line);
        addArgsToVars(args, line);
        //isCorrect = checkFunc(line, lineNumber);
    } else if (line.match(/^(return|return\s.*)$/) != null) {
        isCorrect = checkReturn(line, lineNumber);
    } else {
        if (line.replace(/\s/g, '') != "" && line.match(/^\/\/.*$/) == null) {
            isCorrect = false;
            addError("Unrecognised statement on line " + lineNumber);
        }
    }
    if (!isCorrect) {
        addRedLine(lineNumber);
    }
    return isCorrect;
}

function findFuncByLine(line) {
    for (var i = 0; i < funcList.length; i++) {
        if ((funcList[i].end == 0 || funcList[i].end > line) && funcList[i].start < line) {
            return funcList[i];
        }
    }
}

function updateVarScope(lineNumber, isEnd) {
    for (var i = 0; i < uninitialisedVariables.length; i++) {
        if (uninitialisedVariables[i].level == currentLevel && uninitialisedVariables[i].end == 0) {
            uninitialisedVariables[i].end = lineNumber - 1;
            uninitialisedVariables.splice(i, 1);

        }
    }
    if (isEnd) {
        currentLevel -= 1;
    }
}

function checkPrint(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected print statement on line " + lineNumber);
        return false;
    }
    if (isValid("print", line)) {
        if (isValid("printVar", line)) {
            return checkPrintVar(line, lineNumber);
        } else {
            return checkPrintStr(line, lineNumber);
        }
    } else {
        addError("Invalid print statement");
        return false;
    }
}

function checkPrintVar(line, lineNumber) {
    var varName = line.substr(6, line.length - 4).match(/^[a-zA-Z_][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varEntry = findUnVar(varName);
    if (varEntry == null) {
        addError("Undeclared variable on line " + lineNumber);
        return false;
    }
    if (varEntry.end < lineNumber && varEntry.end != 0) {
        addError("Variable out of scope on line " + lineNumber);
        return false;
    }
    return true;
}

function checkPrintStr(line, lineNumber) {
    var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
    output = output.substr(1, output.length - 2);
    var i = 0;
    while (i < output.length) {
        if (output.charAt(i) == '$') {
            if (i != output.length - 1) {
                i += 1;
                var varName = output.substr(i, output.length - i);
                varName = varName.match(/^(.+?)\$/);
                if (varName != null) {
                    varName = varName[1];
                }
                if (varName == null) {
                    addError("Invalid $ use on line " + lineNumber + ". Check that the variable is enclosed in two $ symbols.");
                    return false;
                } else {
                    var varEntry = findUnVar(varName);
                    if (varEntry == null) {
                        addError("Undeclared variable on line " + lineNumber);
                        return false;
                    }
                    if (varEntry.end < lineNumber && varEntry.end != 0) {
                        addError("Variable out of scope on line " + lineNumber);
                        return false;
                    }
                }
                while (output.charAt(i) != '$') {
                    i += 1;
                }
            } else {
                addError("Invalid $ use on line " + lineNumber + ". Check that the variable is enclosed in two $ symbols.");
                return false;
            }
        } else if (output.charAt(i) == '\\') {
            if (i >= output.length - 1) {
                addError("Invalid escape character on line " + lineNumber);
                return false;
            }
            i += 1;
        }
        i += 1;
    }
    return true;
}

function checkVarDec(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected variable declaration on line " + lineNumber);
        return false;
    }
    var varType = line.match(/[^\s]+/)[0];
    if (!isCorrectFormat(line)) {
        addError("Syntax error on line " + lineNumber);
        return false;
    } else {
        var lineWithoutType = line.substr(varType.length + 1, line.length - varType.length + 1);
        var varName = lineWithoutType.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*[^=\s]*/)[0].replace(/\s/g, '');
        if (isKeyword(varName)) {
            addError("Invalid variable name on line " + lineNumber + ". " + varName + " is a keyword. It cannot be used for a variable name.");
            return false;
        }
        if (!isDefaultValueDeclaring(line)) {
            var varValue = lineWithoutType.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
            if (varType == "bool") {
                if (!checkPredicate(varName, varValue, lineNumber, true, false)) {
                    return false;
                }
            } else {
                if (!checkBrackets(varValue, varType)) {
                    addError("Syntax error on line " + lineNumber + ". Possibly mismatched brackets or unexpected character");
                    return false;
                }
                if (!checkVariableAssignment(varType, varName, varValue, true, lineNumber)) {
                    addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                    return false;
                }
            }
        } else {
            if (!checkVariableAssignment(varType, varName, "", true, lineNumber)) {
                addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                return false;
            }
        }
    }
    return true;
}

function checkVarAss(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected variable assignment on line " + lineNumber);
        return false;
    }
    var varName = line.match(/^[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
    if (findUnVar(varName) == null) {
        addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
        return false;
    }
    var varType = findUnVar(varName).type;
    if (varType == "bool") {
        if (!checkPredicate(varName, varValue, lineNumber, false, false)) {
            return false;
        }
    } else {
        if (!checkVariableAssignment(varType, varName, varValue, false, lineNumber)) {
            addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
            return false;
        }
        if (!checkBrackets(varValue)) {
            addError("Mismatched brackets on line " + lineNumber);
            return false;
        }
    }
    return true;
}

function checkIf(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected if statement on line " + lineNumber);
        return false;
    }
    if (line.match(/if\s*\(/) != null) {
        currentLevel += 1;
    }
    if (!isValid("if", line)) {
        addError("Invalid if statement on line " + lineNumber);
        return false;
    }
    var pred = line.substr(line.indexOf("("));
    pred = pred.replace(/\s/g, '');
    if (!checkPredicate("", pred, lineNumber, false, true)) {
        addError("Invalid if statement on line " + lineNumber);
        return false;
    }
    return true;
}

function checkFor(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected for loop on line " + lineNumber);
        return false;
    }
    currentLevel += 1;
    if (!isValid("for", line)) {
        addError("Invalid for statement on line " + lineNumber);
        return false;
    }
    var loopCond = line.substr(line.indexOf("("));
    var loopParts = loopCond.split(/,/g);
    loopParts = removeSpaces(loopParts);
    if (loopParts.length > 1) {
        var stepName = loopParts[0].substr(1, loopParts[0].length - 1);
        if (stepName.match(/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*/) == null) {
            addError("Invalid for statement on line " + lineNumber);
            return false;
        }
        var varEntry = findUnVar(stepName);
        if (varEntry != null && varEntry.end == 0) {
            addError("Stepper variable already in use on line " + lineNumber);
            return false;
        }
        var newVar = new uninitialisedVariable("int", stepName, lineNumber, currentLevel, 0);
        uninitialisedVariables.push(newVar);
        if (loopParts.length == 2) {
            var end = loopParts[1].substr(0, loopParts[1].length - 1);
            if (end.charAt(0) == "<" || end.charAt(0) == ">" || end.charAt(0) == "!" || end.charAt(0) == "=") {
                end = end.substr(1, end.length - 1);
                if (end.charAt(0) == "=") {
                    end = end.substr(1, end.length - 1);
                }
            }
            if (!checkBrackets(end)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
        } else if (loopParts.length == 3) {
            var start = loopParts[1];
            if (!checkBrackets(start)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
            var end = loopParts[2].substr(0, loopParts[2].length - 1);
            if (end.charAt(0) == "<" || end.charAt(0) == ">" || end.charAt(0) == "!" || end.charAt(0) == "=") {
                end = end.substr(1, end.length - 1);
                if (end.charAt(0) == "=") {
                    end = end.substr(1, end.length - 1);
                }
            }
            if (!checkBrackets(end)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
        } else {
            var start = loopParts[1];
            if (!checkBrackets(start)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
            var end = loopParts[2];
            if (end.charAt(0) == "<" || end.charAt(0) == ">" || end.charAt(0) == "!" || end.charAt(0) == "=") {
                end = end.substr(1, end.length - 1);
                if (end.charAt(0) == "=") {
                    end = end.substr(1, end.length - 1);
                }
            }
            if (!checkBrackets(end)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
            var inc = loopParts[3].substr(0, loopParts[3].length - 1);
            if (!checkBrackets(end)) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
        }
    }
    return true;
}

function checkWhile(line, lineNumber) {
    if (currentLevel == 0) {
        addError("Unexpected while loop on line " + lineNumber);
        return false;
    }
    currentLevel += 1;
    if (!isValid("while", line)) {
        addError("Invalid while loop on line " + lineNumber);
        return false;
    }
    var pred = line.substr(line.indexOf("("));
    pred = pred.replace(/\s/g, '');
    if (!checkPredicate("", pred, lineNumber, false, true)) {
        if (line.search("do") == 0) {
            addError("Invalid do while loop on line " + lineNumber);
        } else {
            addError("Invalid while loop on line " + lineNumber);
        }
        return false;
    }
    return true;
}

function checkFunc(line, lineNumber) {
    //currentLevel += 1;
    if (!isValid("func", line)) {
        addError("Invalid function on line " + lineNumber);
        return false;
    }
    var type = "void";
    var name;
    if (line.search(/func\s+[a-zA-Z_]/) != 0) {
        type = line.match(/\(\s*(int|float|string|char|bool)\s*\)/)[1];
        name = line.substr(line.indexOf(")"));
        name = name.substr(0, name.indexOf("("));
        name = name.substr(1, name.length - 1);
        name = name.trim();
    } else {
        name = line.substr(4, line.length - 4);
        name = name.substr(0, name.indexOf("("));
        name = name.substr(1, name.length - 1);
        name = name.trim();
    }
    var args = getArgs(line);
    if (funcExists(name, args)) {
        addError("Duplicate function on line " + lineNumber);
        return false;
    }
    funcList.push(new func(name, type, lineNumber, 0, args, false));
    //addArgsToVars(args, lineNumber);
    return true;
}

function getArgs(line) {
    var args = line;
    if (line.search(/func\s+[a-zA-Z_]/) != 0) {
        args = args.substr(line.indexOf(")"));
    }
    args = args.substr(args.indexOf("("));
    args = args.substr(1, args.length - 2);
    args = args.trim();
    args = args.split(/,/);
    if (args != "") {
        args = getArgsTypeAndName(args);
    } else {
        args = [];
    }
    return args;
}

function checkReturn(line, lineNumber) {
    if (!isValid("return", line)) {
        addError("Invalid function on line " + lineNumber);
        return false;
    }
    var func = findFunc();
    if (func.type == "void" && !isValid("returnVoid", line)) {
        addError("Void function cannot return a value but line " + lineNumber + " is returning a value.");
        return false;
    }
    var returnValue = line.substr(line.indexOf("n"));
    returnValue = returnValue.substr(1, returnValue.length - 1).replace(/\s/g, '');;
    if (!checkReturnType(returnValue, func.type, lineNumber)) {
        addError("Value returned on line " + lineNumber + " does not match return type of function.");
        return false;
    }
    func.returned = true;
    return true;
}

function addArgsToVars(args, line) {
    for (var i = 0; i < args.length; i++) {
        uninitialisedVariables.push(new uninitialisedVariable(args[i].type, args[i].name, line, 1, 0));
    }
}

function getArgsTypeAndName(args) {
    var argsReturn = [];
    for (var i = 0; i < args.length; i++) {
        var singleArg = args[i].split(/\s/);
        singleArg = removeSpaces(singleArg);
        singleArg = removeBlankEntries(singleArg);
        argsReturn.push(new arg(singleArg[0], singleArg[1]));
    }
    return argsReturn;
}

function funcExists(name, args) {
    for (var i = 0; i < funcList.length; i++) {
        if (name == funcList[i].name && sameArgTypes(funcList[i].args, args)) {
            return true
        }
    }
    return false;
}

function sameArgTypes(oldFuncArgs, newFuncArgs) {
    if (oldFuncArgs.length != newFuncArgs.length) {
        return false;
    }
    for (var i = 0; i < oldFuncArgs.length; i++) {
        if (oldFuncArgs[i].type != newFuncArgs[i].type) {
            return false;
        }
    }
    return true;
}

function findFunc() {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].end == 0) {
            return funcList[i];
        }
    }
}

function findFuncByName(name) {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].name == name) {
            return funcList[i];
        }
    }
}

var keywordList = ["true", "false", "int", "float", "string", "char", "bool", "func", "end", "if", "else", "for", "while", "do"];

function isKeyword(name) {
    for (var i = 0; i < keywordList.length; i++) {
        if (name == keywordList[i]) {
            return true;
        }
    }
    return false;
}

function isValid(type, line) {
    switch (type) {
        case "print":
            return line.match(/^print\s+(".*"|[a-zA-Z_][a-zA-Z0-9_]*)\s*$/) != null;
            break;
        case "printVar":
            return line.match(/^print\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null;
            break;
        case "var":
            return line.match(/^[a-zA-Z][a-zA-Z0-9_]*\s*=\s*.*$/) != null;
            break;
        case "if":
            return line.match(/^(if|else\s+if|else)\s*\(.+\)\s*$/) != null;
            break;
        case "for":
            return line.match(/^for\s*\(+\s*.*\s*\)+\s*$/) != null;
            break;
        case "while":
            return line.match(/^(do\s+)?while\s*\(.+\)\s*$/) != null;
            break;
        case "func":
            return line.match(/^func\s*(\(\s*(int|float|string|char|bool)\s*\))?\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(\s*((int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*(\s*,\s*(int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*)*)?\s*\)\s*$/) != null;
            break;
        case "return":
            return line.match(/^return\s*.*$/) != null;
            break;
        case "returnVoid":
            return line.match(/^return\s*$/) != null;
            break;
    }
}

function isCorrectFormat(line) {
    return (line.match(/^(int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*(=\s*.*\s*)?$/) != null);
}

function isDefaultValueDeclaring(line) {
    return (line.match(/^(int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null);
}

var equalityList = ["=", ">", "<"];

function isEquality(char) {
    for (var i = 0; i < equalityList.length; i++) {
        if (char == equalityList[i]) {
            return true;
        }
    }
    return false;
}

function removeMinusSigns(exp) {
    var i = 0;
    while (i < exp.length) {
        if (exp[i] == '-') {
            if (i != 0 && (isOperator(exp[i - 1]) || exp[i - 1] == "(") || isEquality(exp[i - 1])) {
                var part1 = exp.substr(0, i);
                var part2 = exp.substr(i + 1, exp.length - i - 1);
                exp = part1 + part2;
                i -= 1;
            } else if (i == 0) {
                var part1 = exp.substr(0, i);
                var part2 = exp.substr(i + 1, exp.length - i - 1);
                exp = part1 + part2;
                i -= 1;
            }
        }
        i += 1;
    }
    return exp;
}

function checkPredicate(varName, pred, lineNumber, isDeclaring, isIf) {
    if (!isIf) {
        var varEntry = findUnVar(varName);
        if (varEntry == null && !isDeclaring) {
            return false;
        }
        if (varEntry != null && isDeclaring) {
            return false;
        }
    }
    var predList = pred.toString().split(/(\(|\)|&&|\|\||==|<=|>=|!=|<|>)/g);
    predList = removeBlankEntries(predList);

    var funcs = pred.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expWithoutFuncs = pred.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g, '');
    var expList = expWithoutFuncs.toString().split(/(\(|\)|\+|-|\/|\*|&&|\|\||==|!=|<=|>=|<|>)/g);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        addError("Undeclared variable(s) on line " + lineNumber);
        return false;
    }
    if (!isIf && varEntry == null && isDeclaring) {
        var newVar = new uninitialisedVariable("bool", varName, lineNumber, currentLevel, 0);
        uninitialisedVariables.push(newVar);
        varEntry = newVar;
    }
    if ((pred.match(/\(/g) || []).length != (pred.match(/\)/g) || []).length) {
        return false;
    }
    var varTypes = getTypeOfVarsAndLits(varList);
    var newExp = pred.replace(/\(*(true|false)\)*/g, '{');
    newExp = newExp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(.*?\)/g, '}');
    newExp = newExp.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, '@v');
    newExp = newExp.replace(/{/g, '@b');
    newExp = newExp.replace(/}/g, '@p');
    newExp = newExp.replace(/\(*'.*'\)*/g, '@c');
    newExp = newExp.replace(/\(*".*"\)*/g, '@s');
    newExp = newExp.replace(/\(*[0-9]+(\.[0-9]+)\)*/g, '@f');
    newExp = newExp.replace(/[0-9]+/g, '@i');
    newExp = removeMinusSigns(newExp);
    for (var i = 0; i < varTypes.length; i++) {
        switch (varTypes[i]) {
            case "int":
                newExp = newExp.replace(/\@v/, '@i');
                break;
            case "float":
                newExp = newExp.replace(/\@v/, '@f');
                break;
            case "bool":
                newExp = newExp.replace(/\@v/, '@b');
                break;
            case "char":
                newExp = newExp.replace(/\@v/, '@c');
                break;
            case "string":
                newExp = newExp.replace(/\@v/, '@s');
                break;
            case "void":
                addError("The void function on line " + lineNumber + " cannot be used in this context. It does not return a value.");
                return false;
        }
    }
    for (var i = 0; i < funcs.length; i++) {
        var f = findFuncByName(funcNames[i]);
        switch (f.type) {
            case "int":
                newExp = newExp.replace(/\@p/, '@i');
                break;
            case "float":
                newExp = newExp.replace(/\@p/, '@f');
                break;
            case "bool":
                newExp = newExp.replace(/\@p/, '@b');
                break;
            case "char":
                newExp = newExp.replace(/\@p/, '@c');
                break;
            case "string":
                newExp = newExp.replace(/\@p/, '@s');
                break;
            case "void":
                addError("The void function on line " + lineNumber + " cannot be used in this context. It does not return a value.");
                return false;
        }
    }
    var singlePredList = newExp.toString().split(/\(|\)|&&|\|\|/);
    singlePredList = removeBlankEntries(singlePredList);
    if (!checkSinglePredicate(singlePredList, lineNumber)) {
        return false;
    }
    return true;
}

function checkSinglePredicate(singlePredList, lineNumber) {
    for (var i = 0; i < singlePredList.length; i++) {
        if (singlePredList[i] == "@b") {
            return true;
        }
        if (singlePredList[i].match(/(.*(==|!=|<|>|<=|>=).*|@b)/) == null) {
            addError("Invalid predicate on line " + lineNumber);
            return false;
        }
        var newExp = singlePredList[i].replace(/@./g, '@');
        var oldExp = newExp;
        do {
            oldExp = newExp;
            newExp = newExp.replace(/\(*@(\+|-|\*|\/)@\)*/g, '@');
        } while (newExp != oldExp)
        do {
            oldExp = newExp;
            newExp = newExp.replace(/\(*@(==|!=|<=|>=|<|>)@\)*/g, '@');
        } while (newExp != oldExp)
        if (newExp.match(/^@$/) == null) {
            addError("Invalid predicate on line " + lineNumber);
            return false;
        }
        var typeList = singlePredList[i].match(/@./g);
        typeList = castNumbersAndText(typeList);
        var current = typeList[i];
        for (var j = 0; j < typeList.length; j++) {
            if (typeList[j] != current) {
                addError("Mismatched types on line " + lineNumber);
                return false;
            }
        }
        var usedOperators = singlePredList[i].match(/\+|-|\/|\*|&&|\|\|/g);
        var type = getTypeFromAtSymbol(typeList[0]);
        if (usedOperators != null) {
            if (!checkOperators(type, usedOperators)) {
                addError("Invalid expression on line " + lineNumber);
                return false;
            }
        }
    }
    return true;
}

function castNumbersAndText(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] == "@i") {
            list[i] = "@f";
        } else if (list[i] == "@c") {
            list[i] = "@s";
        }
    }
    return list;
}

function getTypeFromAtSymbol(atSym) {
    switch (atSym) {
        case "@s":
            return "string";
            break;
        case "@i":
            return "int";
            break;
        case "@f":
            return "float";
            break;
        case "@c":
            return "char";
            break;
        case "@b":
            return "bool";
            break;
    }
}

function replaceNegativesAndConcat(expList) {
    for (var i = 0; i < expList.length; i++) {
        if (expList[i].match(/-.+/)) {
            expList[i] = '@';
        }
    }
    return expList.join('');
}

function checkBrackets(exp, type) {
    if ((exp.match(/\(/g) || []).length != (exp.match(/\)/g) || []).length) {
        return false;
    }
    var usedOperators = exp.match(/\+|\/|\*|&&|\|\||==|!=|<=|>=|<|>/g);
    if (usedOperators != null) {
        usedOperators = getNegativesAndSubraction(usedOperators);
    }
    if (usedOperators != null) {
        if (!checkOperators(type, usedOperators)) {
            return false;
        }
    }
    var expList = exp.split(/(\+|-|\*|\/|\(|\)|&&|\|\||==|<=|>=|!=|<|>)/g);
    expList = removeSpaces(expList);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    var newExp = replaceNegativesAndConcat(expList);
    newExp = newExp.replace(/\(*([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*(\(.*\))?)\)*/g, '@');
    var oldExp = newExp;
    do {
        oldExp = newExp;
        newExp = newExp.replace(/\(*@(\+|-|\*|\/|&&|\|\||==|!=|<=|>=|<|>)@\)*/g, '@');

    } while (newExp != oldExp)
    if (newExp == "@") {
        return true;
    }
    return false;
}

function checkOperators(type, usedOperators) {
    for (var i = 0; i < usedOperators.length; i++) {
        switch (type) {
            case "string":
                if (usedOperators[i] != "+") {
                    return false;
                }
                break;
            case "char":
                if (usedOperators[i] != "+") {
                    return false;
                }
                break;
            case "bool":
                if (usedOperators[i] != "==" && usedOperators[i] != "!=" &&
                    usedOperators[i] != "<=" && usedOperators[i] != ">=" &&
                    usedOperators[i] != "<" && usedOperators[i] != ">" &&
                    usedOperators[i] != "&&" && usedOperators[i] != "||") {
                    return false;
                }
                break;
        }
    }
    return true;
}

function getLiteralExpListWithoutOperatorsAndVars(expList) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperand(expList[i])) {
            litExpList.push(expList[i]);

        }
    }
    return litExpList;
}

function checkReturnType(exp, type, lineNumber) {
    var funcs = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expWithoutFuncs = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g, '');
    var expList = expWithoutFuncs.toString().split(/\+|-|\*|\/|\(|\)|&&|\|\|/);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames);
    litList = getLiteralExpListWithoutOperatorsAndVars(expList);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        return false;
    }
    if (!checkTypesMatch(expList, type)) {
        return false;
    }
    if (type == "string") {
        for (var i = 0; i < litList.length; i++) {
            if (!checkEscape(litList[i], lineNumber)) {
                return false;
            }
        }
    }
    return true;
}

function removeArgs(funcs) {
    var fs = []
    for (var i = 0; i < funcs.length; i++) {
        fs.push(funcs[i].substr(0, funcs[i].indexOf("(")));
    }
    return fs;
}

function checkVariableAssignment(varType, varName, varValue, isDeclaring, lineNumber) {
    var varEntry = findUnVar(varName);
    if (varEntry == null && !isDeclaring) {
        return false;
    }
    if (varEntry != null && isDeclaring) {
        return false;
    }
    var funcs = varValue.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expWithoutFuncs = varValue.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g, '');
    var expList = expWithoutFuncs.toString().split(/\+|-|\*|\/|\(|\)|&&|\|\|/);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames);
    litList = getLiteralExpListWithoutOperatorsAndVars(expList);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        return false;
    }
    if (varEntry == null && isDeclaring) {
        var newVar = new uninitialisedVariable(varType, varName, lineNumber, currentLevel, 0);
        uninitialisedVariables.push(newVar);
        varEntry = newVar;
    }
    if (!checkTypesMatch(expList, varEntry.type)) {
        return false;
    }
    if (varEntry.type == "string") {
        for (var i = 0; i < litList.length; i++) {
            if (!checkEscape(litList[i], lineNumber)) {
                return false;
            }
        }
    }

    return true;
}

function checkTypesMatch(expList, type) {
    var typeList = getTypeOfVarsAndLits(expList);
    for (var i = 0; i < typeList.length; i++) {
        if (typeList[i] == "float") {
            if (type != "float") {
                return false;
            }
        } else if (typeList[i] == "int") {
            if (type != "float" && type != "int") {
                return false;
            }
        } else if (typeList[i] == "string") {
            if (type != "string") {
                return false;
            }
        } else if (typeList[i] == "bool") {
            if (type != "bool") {
                return false;
            }
        } else if (typeList[i] == "char") {
            if (type != "char" && type != "string") {
                return false;
            }
            if (expList[i].match(/^('(.|\\n)'|[a-zA-Z_][a-zA-Z0-9_]*)$/) == null) {
                return false;
            }
        } else if (typeList[i] == "void") {
            addError("A void function cannot be used in this context. It does not return a value.");
            return false;
        } else {
            return false;
        }
    }
    return true;
}

function checkEscape(str, lineNumber) {
    var i = 0;
    str = str.substr(1, str.length - 2);
    while (i < str.length) {
        if (str.charAt(i) == '\\') {
            if (i >= str.length - 1) {
                addError("Invalid escape character on line " + lineNumber);
                return false;
            }
            i += 1;
        }
        i += 1;
    }
    return true;
}

function allDeclared(vs, fs, lineNumber) {
    for (var i = 0; i < vs.length; i++) {
        var v = findUnVar(vs[i]);
        if (v == null) {
            v = findFuncByName(vs[i]);
            if (v == null) {
                return false;
            }
            var args = findFuncInVar(v.name, fs);
            if (!getTypeOfArgs(args, v.args, lineNumber)) {
                addError("Incorrect arguments types for function on line " + lineNumber);
                return false;
            }
            if (args == null) {
                addError("Undeclared variable(s) on line " + lineNumber);
                return false;
            }
        }
        if (v.end < lineNumber && v.end != 0 && findFuncByName(v) != null) {
            addError("Variable out of scope on line " + lineNumber);
            return false;
        }
    }
    return true;
}

function getTypeOfArgs(args, reqArgs, lineNumber) {
    if (args.length != reqArgs.length) {
        return false;
    }
    for (var i = 0; i < args.length; i++) {
        if (!getTypeOfSingleArg(args[i], reqArgs[i].type, lineNumber)) {
            return false
        }
    }
    return true;
}

function getTypeOfSingleArg(arg, reqType, lineNumber) {
    var funcs = arg.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*((-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|[a-zA-Z_][a-zA-Z0-9_]*)(\s*,\s*(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|[a-zA-Z_][a-zA-Z0-9_]*))*)?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expWithoutFuncs = arg.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*(([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*)(\s*,\s*([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*))*)?\s*\)/g, '');
    var expList = expWithoutFuncs.toString().split(/\+|-|\*|\/|\(|\)|&&|\|\|/);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        return false;
    }
    return checkTypesMatch(expList, reqType);
}

function argTypesMatch(name, args) {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].name == name) {
            if (checkEachArgMatches(funcList[i].args, args)) {
                return true;
            }
        }
    }
    return false;
}

function checkEachArgMatches(args1, args2) {
    if (args1.length != args2.length) {
        return false;
    }
    for (var i = 0; i < args1.length; i++) {
        if (args1[i].type != args2[i]) {
            return false;
        }
    }
    return true;
}

function findFuncInVar(v, fs) {
    for (var i = 0; i < fs.length; i++) {
        var args = fs[i].substr(fs[i].indexOf("("));
        args = args.substr(1, args.length - 2);
        args = args.split(/,/g);
        args = removeSpaces(args);
        if (v == fs[i].substr(0, fs[i].indexOf("(")).trim()) {
            if (args != "") {
                return args;
            }
            return [];
        }
    }
}

function getTypeOfVarsAndLits(es) {
    var evaluatedList = [];
    for (var i = 0; i < es.length; i++) {
        if (isOperand(es[i])) {
            if (es[i].match(/^.*(==|!=|<|>|<=|>=).*$/) != null) {
                evaluatedList.push("pred");
            } else if (es[i].match(/^[0-9]+$/) != null) {
                evaluatedList.push("int");
            } else if (es[i].match(/^[0-9]+(\.[0-9]+)?$/) != null) {
                evaluatedList.push("float");
            } else if (es[i].match(/^".*"$/) != null) {
                evaluatedList.push("string");
            } else if (es[i].match(/^'.*'$/) != null) {
                evaluatedList.push("char");
            } else if (es[i].match(/^(true|false)$/) != null) {
                evaluatedList.push("bool");
            }
        } else {
            var varEntry = findUnVar(es[i]);
            if (varEntry == null) {
                varEntry = findFuncByName(es[i]);
            }
            if (varEntry == null) {
                return;
            }
            evaluatedList.push(varEntry.type);
        }
    }
    return evaluatedList;
}
