//Global Variables

var currentLevel = 0;
var hasMain = false;
var funcList = [];
var uninitialisedVariables = [];
var structs = [];
var mainFunction;
var keywordList = ["true", "false", "int", "float", "string", "char", "bool", "func", "end", "if", "else", "for", "while", "do", "null", "T", "struct", "define"];
var structStarted = false;
var defineStarted = false;
var globalLines = [];
var validTypes;
var validTypesWithoutArrays;

//Main logic

function errorCheck(arrayOfLines, blockStack) {
    uninitialisedVariables.push(new uninitialisedVariable("T", "null", 1, 0, arrayOfLines.length));
    document.getElementById('noodleOutputBox').value = "";
    getStructs(arrayOfLines);
    var initialCorrect = true;
    for (var i = 0; i < arrayOfLines.length; i++) {
        var line = i + 1;
        if (arrayOfLines[i].search(/\s*func\s+main\s*\(\s*\)\s*/) == 0) {
            if (blockStack.length != 0) {
                addError("Unexpected main function on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("main", i + 1));
            if (!hasMain) {
                hasMain = true;
            } else {
                addError("Unexpected main function on line " + line);
                initialCorrect = false;
            }
            mainFunction = new mainFunc(i + 1, 0);
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/func(\s*\(|\s)/) == 0) {
            if (blockStack.length != 0) {
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
                addError("Unexpected else if on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("else if", i + 1));
        } else if (arrayOfLines[i].trim().search(/^else$/) == 0) {
            var precedingBlock = blockStack.pop();
            if (precedingBlock.type != "else if" && precedingBlock.type != "if") {
                addError("Unexpected else on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("else", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/for\s*\(/) == 0) {
            var precedingBlock = blockStack[blockStack.length - 1];
            if (precedingBlock == "struct") {
                addError("Cannot put for loop in a struct on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("for", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/while\s*\(/) == 0) {
            var precedingBlock = blockStack[blockStack.length - 1];
            if (precedingBlock == "struct") {
                addError("Cannot put while loop in a struct on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("while", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/struct\s+.*/) == 0) {
            if (!checkStruct(arrayOfLines[i], i + 1)) {
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("struct", i + 1));
        } else if (arrayOfLines[i].trim().search(/define/) == 0) {
            if (blockStack.length != 0) {
                addError("Unexpected define on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("define", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').search(/do\s+while\s*\(/) == 0) {
            var precedingBlock = blockStack.pop();
            if (precedingBlock == "struct") {
                addError("Cannot put do while loop in a struct on line " + line);
                initialCorrect = false;
            }
            blockStack.push(new codeBlock("do while", i + 1));
        } else if (arrayOfLines[i].replace(/^\s+/, '').replace(/\s+$/, '').search(/^(return|return\s.*)$/) == 0) {
            if (blockStack[0] == null) {
                addError("Unexpected return statement on line " + line);
                initialCorrect = false;
            }
            if (blockStack[blockStack.length - 1] == "struct") {
                addError("Cannot put return statement in a struct on line " + line);
                initialCorrect = false;
            }
        } else if (arrayOfLines[i].trim().search(/^end$/) == 0) {
            if (blockStack.length != 0) {
                if (blockStack[blockStack.length - 1].type == "main") {
                    mainFunction.end = i + 1;
                }
                blockStack.pop();
            } else {
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

function getStructs(lines) {
    var structList = "";
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim().search(/struct\s+.*/) == 0) {
            if (i != 0) {
                structList += "|";
            }
            var structName = lines[i].substr(lines[i].indexOf(" ")).trim();
            structList += structName;
        }
    }
    var primTypes = /(int|float|string|char|bool|T)/;
    var allTypes = primTypes;
    if (structList != "") {
        var sep = /|/;
        allTypes = new RegExp(primTypes.source.replace(")", '') + sep.source + structList + ")");
    }
    validTypesWithoutArrays = allTypes;
    var arrayRegex = /((\[.*\])?)?\s*/;
    var allTypesWithArrays = new RegExp(allTypes.source + arrayRegex.source);
    validTypes = allTypesWithArrays;
}

function checkLine(line, lineNumber) {
    var isCorrect = true;
    var error = "";
    if (defineStarted && line.search(validTypes) != 0 && line.trim().match(/^end$/) == null) {
        addError("Invalid global variable on line " + lineNumber);
        isCorrect = false;
    }
    if (line.search("print ") == 0) {
        isCorrect = checkPrint(line, lineNumber);
    } else if (line.search(validTypes) == 0) {
        if (!structStarted) {
            isCorrect = checkVarDec(line, lineNumber);
        }
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
    } else if (line.search(/struct\s/) == 0) {
        if (currentLevel != 0) {
            addError("Unexpected struct on line " + lineNumber + ". Must be a top level declaration");
            return false;
        }
        currentLevel += 1;
        structStarted = true;
    } else if (line.trim().search(/^define$/) == 0) {
        currentLevel += 1;
        defineStarted = true;
    } else if (line.replace(/\s/g, '').match(/^end$/) != null) {
        structStarted = false;
        defineStarted = false;
        if (currentLevel == 1) {
            var reqFunc = findFuncByLine(lineNumber);
            if (reqFunc != null) {
                if (reqFunc.type != "void" && reqFunc.returned == false) {
                    addError("No return statement found for non void function after reaching end on line " + lineNumber);
                    isCorrect = false;
                }
                reqFunc.end = lineNumber;
            }
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
        addArgsToVars(args, lineNumber);
        //isCorrect = checkFunc(line, lineNumber);
    } else if (line.match(/^(return|return\s.*)$/) != null) {
        isCorrect = checkReturn(line, lineNumber);
    } else if (line.trim().search(/^.*\(.*\)$/) == 0) {
        isCorrect = checkFuncCall(line, lineNumber);
    }  else {
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
    if (varName.match(/.*\[.*\]/)) {
        var varWithoutIndex = varName.substr(0, varName.indexOf("["));
        var varEntry = findUnVar(varWithoutIndex);
        var index = varName.substr(varName.indexOf("["));
        index = index.substr(1, index.length - 2).replace(/\s/g, '');
        if (!checkBrackets(index, "int")) {
            addError("Invalid array index on line " + lineNumber);
            return false;
        }
        if (!checkReturnType(index, "int", lineNumber)) {
            addError("Invalid array index on line " + lineNumber);
            return false;
        }
    } else if (varName.match(/.*\..*/)) {
        var s = varName.substr(0, varName.indexOf("."));
        var varEntry = findUnVar(s);
        if (varEntry == null) {
            addError("Undeclared variable on line " + lineNumber);
            return false;
        }
        if (!checkBrackets(varName, varEntry.type)) {
            addError("Invalid print statement on line " + lineNumber);
            return false;
        }
    } else {
        var varEntry = findUnVar(varName);
    }
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
                    if (varName.match(/.*\[.*\]/)) {
                        var varWithoutIndex = varName.substr(0, varName.indexOf("["));
                        var varEntry = findUnVar(varWithoutIndex);
                        var index = varName.substr(varName.indexOf("["));
                        index = index.substr(1, index.length - 2).replace(/\s/g, '');
                        if (!checkBrackets(index, "int")) {
                            addError("Invalid array index on line " + lineNumber);
                            return false;
                        }
                        if (!checkReturnType(index, "int", lineNumber)) {
                            addError("Invalid array index on line " + lineNumber);
                            return false;
                        }
                    } else if (varName.match(/.*\..*/)) {
                        var s = varName.substr(0, varName.indexOf("."));
                        var varEntry = findUnVar(s);
                        if (varEntry == null) {
                            addError("Undeclared variable on line " + lineNumber);
                            return false;
                        }
                        if (!checkBrackets(varName, varEntry.type)) {
                            addError("Invalid print statement on line " + lineNumber);
                            return false;
                        }
                    } else {
                        var varEntry = findUnVar(varName);
                    }
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
        if (varType.match(/.*\[.*/) != null) {
            return checkVarDecArray(line, lineNumber);
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
                } else if (isStructType(varType)) {
                    if (!checkStructAssignment(varType, varValue, lineNumber)) {
                        return false;
                    }
                    if (!checkVariableAssignment("", varName, "", true, lineNumber)) {
                        addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                        return false;
                    }
                    if (!defineStarted) {
                        uninitialisedVariables.push(new uninitialisedVariable(varType, varName, lineNumber, currentLevel, 0));
                    } else {
                        uninitialisedVariables.push(new uninitialisedVariable(varType, varName, lineNumber, 0, 0));
                        globalLines.push(lineNumber);
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
    }
    return true;
}

function checkVarDecArray(line, lineNumber) {
    var varTypeWithLength = line.match(/[^\]]+/)[0].concat("]");
    var varTypeWithoutLength = varTypeWithLength.substr(0, varTypeWithLength.indexOf("["));
    var lineWithoutType = line.substr(varTypeWithLength.length + 1, line.length - varTypeWithLength.length + 1);
    var varName = lineWithoutType.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*[^=\s]*/)[0].replace(/\s/g, '');
    var varType = varTypeWithLength.substr(0, varTypeWithLength.indexOf("["));
    var arrayLength = varTypeWithLength.substr(varTypeWithLength.indexOf("["));
    arrayLength = arrayLength.substr(1, arrayLength.length - 2).replace(/\s/g, '');
    if (arrayLength != "") {
        if (!checkBrackets(arrayLength, "int")) {
            addError("Invalid array length on line " + lineNumber);
            return false;
        }
        if (!checkReturnType(arrayLength, "int", lineNumber)) {
            addError("Invalid array length on line " + lineNumber);
            return false;
        }
    }
    if (!checkVariableAssignment("", varName, "", true, lineNumber)) {
        addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
        return false;
    }
    if (!isDefaultValueDeclaring(line)) {
        var varValue = lineWithoutType.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
        if (varValue.match(/\[.*/) != null) {
            if (!checkArrayAssignment(varValue, varTypeWithoutLength, lineNumber)) {
                return false;
            }
        }
    }
    uninitialisedVariables.push(new uninitialisedVariable(varTypeWithLength, varName, lineNumber, currentLevel, 0));
    return true;
}

function checkArrayAssignment(array, type, lineNumber) {
    array = array.substr(1, array.length - 2);
    array = array.split(/,/);
    for (var i = 0; i < array.length; i++) {
        if (type == "bool") {
            if (!checkPredicate("", array[i], lineNumber, true, false)) {
                return false;
            }
        } else {
            if (!checkBrackets(array[i], type)) {
                addError("Syntax error on line " + lineNumber + ". Possibly mismatched brackets or unexpected character");
                return false;
            }
            if (!checkVariableAssignment(type, "", array[i], true, lineNumber)) {
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
    var varName = line.match(/^[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
    if (varName.match(/.*\[/) != null) {
        var varNameWithoutIndex = varName.substr(0, varName.indexOf("["));
        var arrayIndex = varName.substr(varName.indexOf("["));
        arrayIndex = arrayIndex.substr(1, arrayIndex.length - 2);
        //arrayIndex = evaluateExpression(arrayIndex, "int");
        if (!checkBrackets(arrayIndex, "int")) {
            addError("Invalid array length on line " + lineNumber);
            return false;
        }
        if (!checkReturnType(arrayIndex, "int", lineNumber)) {
            addError("Invalid array length on line " + lineNumber);
            return false;
        }
        var variable = findUnVar(varNameWithoutIndex);
        if (variable == null) {
            addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
            return false;
        }
        var arrayType = variable.type;
        if (arrayType != "string") {
            var arrayEntryType = arrayType.substr(0, arrayType.indexOf("["));
        } else {
            arrayEntryType = arrayType;
        }

        if (arrayEntryType == "bool") {
            if (!checkPredicate(varNameWithoutIndex, varValue, lineNumber, false, false)) {
                return false;
            }
        } else {
            if (!checkVariableAssignment(arrayEntryType, varNameWithoutIndex, varValue, false, lineNumber)) {
                addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                return false;
            }

            if (!checkBrackets(varValue, varType)) {
                addError("Mismatched brackets on line " + lineNumber);
                return false;
            }
        }

    } else {
        if (varName.match(/.*\..*/) != null) {
            var m = varName.substr(varName.indexOf(".") + 1);
            var s = varName.substr(0, varName.indexOf("."));
            var struct = findUnVar(s);
            if (struct == null) {
                addError("Struct not declared on line " + lineNumber);
                return false;
            }
            var t = findMemberType(struct.type, m);
            if (t == null) {
                addError("Invalid member of struct on line " + lineNumber);
                return false;
            }
            varName = s;
        }
        if (findUnVar(varName) == null) {
            addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
            return false;
        }
        var varType = findUnVar(varName).type;
        if (t != null) {
            varType = t;
        }
        if (varType.match(/.*\[/) == null) {
            if (varType == "bool") {
                if (!checkPredicate(varName, varValue, lineNumber, false, false)) {
                    return false;
                }
            } else if (isStructType(varType)) {
                if (!checkStructAssignment(varType, varValue, lineNumber)) {
                    return false;
                }
                if (!checkVariableAssignment("", varName, "", false, lineNumber)) {
                    addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                    return false;
                }
            } else {
                if (!checkVariableAssignment(varType, varName, varValue, false, lineNumber)) {
                    addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                    return false;
                }
                if (!checkBrackets(varValue, varType)) {
                    addError("Mismatched brackets on line " + lineNumber);
                    return false;
                }
            }
        } else {
            var arrayLength = varType.substr(varType.indexOf("["));
            arrayLength = arrayLength.substr(1, arrayLength.length - 2).replace(/\s/g, '');
            var varTypeWithoutLength = varType.substr(0, varType.indexOf("["));
            if (!checkArrayAssignment(varValue, varTypeWithoutLength, lineNumber)) {
                return false;
            }
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
            if (varEntry.level == 0) {
                addError("Stepper variable already in use on line " + lineNumber);
                return false;
            }
            var f = findFuncByLine(lineNumber);
            var start = findFuncByLine(varEntry.start).start;
            if (f.start == start) {
                addError("Stepper variable already in use on line " + lineNumber);
                return false;
            }
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
            if (!checkBrackets(end, "int")) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
        } else if (loopParts.length == 3) {
            var start = loopParts[1];
            if (!checkBrackets(start, "int")) {
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
            if (!checkBrackets(end, "int")) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
        } else {
            var start = loopParts[1];
            if (!checkBrackets(start, "int")) {
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
            if (!checkBrackets(end, "int")) {
                addError("Invalid expression in for loop on line " + lineNumber);
                return false;
            }
            var inc = loopParts[3].substr(0, loopParts[3].length - 1);
            if (!checkBrackets(end, "int")) {
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

function checkStruct(line, lineNumber) {
    if (!isValid("struct", line)) {
        addError("Invalid struct on line " + lineNumber);
        return false;
    }
    var structName = line.substr(line.indexOf(" ")).trim();
    if (isPrimitiveName(structName)) {
        addError("Cannot give a struct a primitive name on line " + lineNumber);
        return false;
    }
    if (isStructNameTaken(structName)) {
        addError("Duplicate struct name on line " + lineNumber);
        return false;
    }
    var newStruct = new struct(structName, [], []);
    var i = lineNumber;
    var blanksAndComments = 0;
    while (i < linesArray.length && linesArray[i].trim() != "end") {
        var member = linesArray[i].trim();
        if (member == "" || member.match(/^\/\/.*$/) != null) {
            blanksAndComments += 1;
        } else {
            if (!isValid("member", member)) {
                var l = i + 1;
                addError("Invalid struct member on line " + l);
                return false;
            }
            var memberType = member.match(/[^\s]+/)[0];
            var memberName = member.match(/\s.*/)[0].trim();
            var index = i - lineNumber - blanksAndComments;
            newStruct.memberTypes[index] = memberType;
            newStruct.memberNames[index] = memberName;
        }
        i += 1;
    }
    if (i - blanksAndComments == lineNumber) {
        addError("Struct has no members on line " + lineNumber);
        return false;
    }
    structs.push(newStruct);
    return true;
}

function checkFunc(line, lineNumber) {
    if (!isValid("func", line)) {
        addError("Invalid function on line " + lineNumber);
        return false;
    }
    var type = "void";
    var name;
    if (line.search(/func\s+[a-zA-Z_]/) != 0) {
        var typeStart = /\(\s*/;
        var typeEnd = /\s*\)/;
        var typeRegex = new RegExp(typeStart.source + validTypes.source + typeEnd.source);
        type = line.match(typeRegex)[0];
        type = type.replace(")", '');
        type = type.replace("(", '');
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
    return true;
}

function checkFuncCall(line, lineNumber) {
    if (!isValid("funcCall", line)) {
        addError("Invalid function call on line " + lineNumber);
        return false;
    }
    var funcName = line.substr(0, line.indexOf("("));
    if (!allDeclared([funcName], [line], lineNumber)) {
        addError("Invalid function call on line " + lineNumber);
        return false;
    }
    return true;
}

function checkReturn(line, lineNumber) {
    if (!isValid("return", line)) {
        addError("Invalid return statement on line " + lineNumber);
        return false;
    }
    var func = findFunc();
    if (func.type == "void" && !isValid("returnVoid", line)) {
        addError("Void function cannot return a value but line " + lineNumber + " is returning a value.");
        return false;
    }
    var returnValue = line.substr(line.indexOf("n"));
    returnValue = returnValue.substr(1, returnValue.length - 1).replace(/\s/g, '');
    if (!checkReturnType(returnValue, func.type, lineNumber)) {
        addError("Value returned on line " + lineNumber + " does not match return type of function.");
        return false;
    }
    func.returned = true;
    return true;
}

function checkPredicate(varName, pred, lineNumber, isDeclaring, isIf) {
    if (!isIf && varName != "") {
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
    var varTypes = getTypeOfVarsAndLits(varList, funcs, lineNumber);
    var newExp = pred.replace(/\(*(true|false)\)*/g, '{');
    newExp = newExp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(.*?\)/g, '}');
    newExp = newExp.replace(/[a-zA-Z_][a-zA-Z0-9_]*((\[.*?\])?)?/g, '@v');
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
            case "T":
                newExp = newExp.replace(/\@v/, '@T');
                break;
            default:
                addError("Invalid types on line " + lineNumber);
                return false;
        }
    }
    for (var i = 0; i < funcs.length; i++) {
        var f = findFuncByName(funcNames[i], funcs, lineNumber);
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
            case "T":
                newExp = newExp.replace(/\@p/, '@T');
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
            if (typeList[j] != current && typeList[j] != "@T" && current != "@T") {
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

function checkStructAssignment(varType, varValue, lineNumber) {
    varValue = varValue.trim();
    var structRegex = /\(\s*(.*)\s*(,\s*(.*))*\s*\)/;
    if (varValue.match(structRegex) == null) {
        addError("Invalid struct assignment on line " + lineNumber);
        return false;
    }
    varValue = varValue.substr(1, varValue.length - 2);
    var members = varValue.split(",");
    var struct = findStruct(varType);
    if (members.length != struct.memberTypes.length) {
        addError("Incorrect number of members provided for struct on line " + lineNumber);
        return false;
    }
    if (!memberTypesMatch(members, struct.memberTypes, lineNumber)) {
        addError("Incorrect member types for struct on line " + lineNumber);
        return false;
    }
    return true;
}

function memberTypesMatch(members, reqTypes, lineNumber) {
    for (var i = 0; i < members.length; i++) {
        if (!checkBrackets(members[i], reqTypes[i])) {
            addError("Syntax error on line " + lineNumber + ". Possibly mismatched brackets or unexpected character");
            return false;
        }
        if (!checkReturnType(members[i], reqTypes[i], lineNumber)) {
            return false;
        }
    }
    return true;
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
    newExp = newExp.replace(/\(*([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*(\(.*\))|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)|[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)|[a-zA-Z_][a-zA-Z0-9_]*)\)*/g, '@');
    newExp = newExp.replace(/@\.@/, '@');
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
    if (!checkTypesMatch(expList, type, funcs, lineNumber)) {
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

function checkVariableAssignment(varType, varName, varValue, isDeclaring, lineNumber) {
    var varEntry = findUnVar(varName);
    if (varEntry == null && !isDeclaring) {
        return false;
    }
    if (varEntry != null && isDeclaring) {
        if (varEntry.level == 0) {
            return false;
        }
        var f = findFuncByLine(lineNumber);
        var start = findFuncByLine(varEntry.start).start;
        if (f.start == start) {
            return false;
        }
    }
    var funcs = varValue.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var arrays = varValue.match(/[a-zA-Z_][a-zA-Z0-9_]*\[.*?\]/g);
    if (arrays == null) {
        arrays = [];
    }
    var expWithoutFuncsAndArrays = varValue.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g, '');
    expWithoutFuncsAndArrays = expWithoutFuncsAndArrays.replace(/[a-zA-Z_][a-zA-Z0-9_]*\[.*?\]/g, '');
    var expList = expWithoutFuncsAndArrays.toString().split(/\+|-|\*|\/|\(|\)|&&|\|\|/);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames).concat(arrays);
    litList = getLiteralExpListWithoutOperatorsAndVars(expList);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        return false;
    }
    if (varName != "" && varType != "" && isDeclaring) {
        if (defineStarted) {
            var newVar = new uninitialisedVariable(varType, varName, lineNumber, 0, 0);
            globalLines.push(lineNumber);
        } else {
            var newVar = new uninitialisedVariable(varType, varName, lineNumber, currentLevel, 0);
        }
        uninitialisedVariables.push(newVar);
        varEntry = newVar;
    }
    if (!checkTypesMatch(expList, varType, funcs, lineNumber)) {
        return false;
    }
    if (varType == "string") {
        for (var i = 0; i < litList.length; i++) {
            if (!checkEscape(litList[i], lineNumber)) {
                return false;
            }
        }
    }

    return true;
}

function checkTypesMatch(expList, type, fs, lineNumber) {
    var typeList = getTypeOfVarsAndLits(expList, fs, lineNumber);
    typeList = removeArrayLengths(typeList);
    for (var i = 0; i < typeList.length; i++) {
        if (type == "T" && typeList[i].match(/.*\[\]/) == null) {
            return true;
        } else if (type == "T[]" && typeList[i].match(/.*\[\]/) != null) {
            return true;
        }
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
            if (expList[i].match(/^('(.|\\n)'|[a-zA-Z_][a-zA-Z0-9_]*(\[.*\])?)$/) == null) {
                return false;
            }
        } else if (typeList[i] == "void") {
            addError("A void function cannot be used in this context. It does not return a value.");
            return false;
        } else if (typeList[i].match(/.*\[\]/)) {
            if (typeList[i] != type) {
                return false;
            }
        } else {
            if (typeList[i] != type) {
                return false;
            }
        }
    }
    return true;
}

function allDeclared(vs, fs, lineNumber) {
    for (var i = 0; i < vs.length; i++) {
        var varWithoutIndex = vs[i];
        if (vs[i].match(/.*\[.*\]/) != null) {
            varWithoutIndex = varWithoutIndex.substr(0, varWithoutIndex.indexOf("["));
            var index = vs[i].substr(vs[i].indexOf("["));
            index = index.substr(1, index.length - 2);
            if (!checkBrackets(index, "int")) {
                addError("Invalid array length on line " + lineNumber);
                return false;
            }
            if (!checkReturnType(index, "int", lineNumber)) {
                addError("Invalid array length on line " + lineNumber);
                return false;
            }
        } else if (vs[i].match(/.*\..*/)) {
            var parts = vs[i].split(".");
            var structV = findUnVar(parts[0]);
            var s;
            if (structV != null) {
                s = findStruct(structV.type);
            }
            if (s != null && !isMember(parts[1], s)) {
                addError(parts[1] + " is not a member of struct " + parts[0] + " on line " + lineNumber);
                return false;
            }
            varWithoutIndex = parts[0];
        }
        var v = findUnVar(varWithoutIndex);
        if (v == null) {
            v = findVar(varWithoutIndex);
        }
        if (v == null) {
            v = findFuncByName(vs[i], fs, lineNumber);
            if (v == null) {
                return false;
            }
            var args = findFuncInVar(v.name, fs);
            if (args == null) {
                addError("Undeclared variable(s) on line " + lineNumber);
                return false;
            }
            if (getTypeOfArgs(args, v.args, lineNumber)) {
                functionFound = true;
            }


        } else {
            var f = findFuncByLine(lineNumber);
            var varFunc = findFuncByLine(v.start);
            /*
            if (v.name != "null" && ((v.end < lineNumber && v.end != 0 && findFuncByName(v, fs, lineNumber) != null) || (varFunc != null && f.start != varFunc.start))) {
                addError("Variable out of scope on line " + lineNumber);
                return false;
            }
            */
        }
    }
    return true;
}
