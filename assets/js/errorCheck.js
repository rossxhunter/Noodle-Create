function uninitialisedVariable(type, name) {
    this.type = type;
    this.name = name;
}

var uninitialisedVariables = [];

function errorCheck(arrayOfLines) {
    document.getElementById('noodleErrorsBox').value = "";
    var i = 0;
    while (i != arrayOfLines.length && arrayOfLines[i].match(/\s*func\s+main\s*(\s*)\s*/) == null) {
        i += 1;
    }

    if (i == arrayOfLines.length) {
        addError("Main function not found");
        return false;
    }
    i += 1;
    var isCorrect = true;
    while (i != arrayOfLines.length && arrayOfLines[i].match(/\s*end\s*/) == null) {
        isCorrect = isCorrect && checkLine(arrayOfLines[i].replace(/^\s+/, ''), i+1);
        i += 1;
    }
    if (i == arrayOfLines.length) {
        addError("Main function not ended");
        return false;
    }
    return isCorrect;
}

function addError(error) {
    window.alert(error);
    document.getElementById('noodleErrorsBox').value += "-" + error + "\n";
}

function checkLine(line, lineNumber) {
    var isCorrect = true;
    var error = "";
    if (line.search("print ") == 0) {
        if (line.match(/^print\s+".*"\s*$/) == null) {
            isCorrect = false;
        }
    } else if (line.search(/int |float |string |char |bool/) == 0) {
        var varType = line.match(/[^\s]+/)[0];
        if (!isCorrectFormat(line)) {
            isCorrect = false;
            addError("Syntax error on line " + lineNumber);
        } else {
            var lineWithoutType = line.substr(varType.length + 1, line.length - varType.length + 1);
            var varName = lineWithoutType.match(/^[a-zA-Z_][a-zA-Z0-9_]*[^=\s]*/)[0];
            if (!isDefaultValueDeclaring(line)) {
                var varValue = lineWithoutType.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
                if (!checkVariableAssignment(varType, varName, varValue, true)) {
                    addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
                    isCorrect = false;
                }
                if (!checkBrackets(varValue, varType)) {
                    addError("Syntax error on line " + lineNumber + ". Possibly mismatched brackets or unexpected character");
                    isCorrect = false;
                }
            } else {
                var newVar = new uninitialisedVariable(varType, varName);
                uninitialisedVariables.push(newVar);
            }
        }
    } else if (line.match(/^[a-zA-Z][a-zA-Z0-9_]*\s*=\s.*$/) != null) {
        var varName = line.match(/^[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
        var varValue = line.match(/=\s*(.*)$/)[1].toString().replace(/\s/g, '');
        var varType = findUnVar(varName);
        if (!checkVariableAssignment(varType, varName, varValue, false)) {
            addError("Invalid variable assignment on line " + lineNumber + ". Check that variables are declared and are of the correct type");
            isCorrect = false;
        }
        if (!checkBrackets(varValue)) {
            addError("Mismatched brackets on line " + lineNumber);
            isCorrect = false;
        }
    }
    else {
        if (line.replace(/\s/g,'') != "") {
            isCorrect = false;
            error = "Unrecognised statement on line " + lineNumber;
        }
    }
    var Range = ace.require('ace/range').Range;
    if (currentMarker != null) {
        editor.session.removeMarker(currentMarker);
    }
    if (!isCorrect) {
        currentMarker = editor.session.addMarker(new Range(lineNumber - 1, 0, lineNumber - 1, 1), "syntaxError", "fullLine");
    }
    return isCorrect;
}

function isCorrectFormat(line) {
    return (line.match(/^(int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*(=\s*.*\s*)?$/) != null);
}

function isDefaultValueDeclaring(line) {
    return (line.match(/^(int|float|string|char|bool)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null);
}

function checkBrackets(exp, type) {
    if ((exp.match(/\(/g) || []).length != (exp.match(/\)/g) || []).length) {
        return false;
    }
    var usedOperators = exp.match(/\+|-|\/|\*/g);
    if (type == "string" && usedOperators != null) {
        for (var i = 0; i < usedOperators.length; i++) {
            if (usedOperators[i] != "+") {
                return false;
            }
        }
    }
    var newExp = exp.replace(/\(*([0-9]+(\.[0-9]+)?|"(".*".*)*[^"]*"|'('.*'.*)*[^']*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*)\)*/g, '@');
    var oldExp = newExp;
    do {
        oldExp = newExp;
        newExp = newExp.replace(/\(*@(\+|-|\*|\/)@\)*/g, '@');

    } while (newExp != oldExp)
    if (newExp == "@") {
        return true;
    }
    return false;
}

function checkVariableAssignment(varType, varName, varValue, isDeclaring) {
    var varEntry = findUnVar(varName);
    if (varEntry == null && !isDeclaring) {
        return false;
    }
    if (varEntry != null && isDeclaring) {
        return false;
    }
    if (varEntry == null && isDeclaring) {

        var newVar = new uninitialisedVariable(varType, varName);
        uninitialisedVariables.push(newVar);
        varEntry = newVar;
    }
    var expList = varValue.toString().split(/\+|-|\*|\/|\(|\)/);
    expList = removeBlankEntries(expList);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList)) {
        return false;
    }
    var typeList = getTypeOfVarsAndLits(expList);
    for (var i = 0; i < typeList.length; i++) {
        if (typeList[i] == "float") {
            if (varEntry.type != "float") {

                return false;
            }
        } else if (typeList[i] == "int") {
            if (varEntry.type != "float" && varEntry.type != "int") {
                return false;
            }
        } else if (typeList[i] == "string") {
            if (varEntry.type != "string") {
                return false;
            }
        } else if (typeList[i] == "bool") {
            if (varEntry.type != "bool") {
                return false;
            }
        } else if (typeList[i] == "char") {
            if (varEntry.type != "char") {
                return false;
            }
            if (expList[i].match(/'.'/) == null) {
                return false;
            }
        } else {

            return false;
        }
    }
    return true;
}

function allDeclared(vs) {
    for (var i = 0; i < vs.length; i++) {
        if (findUnVar(vs[i]) == null) {
            return false;
        }
    }
    return true;
}

function getTypeOfVarsAndLits(es) {
    var evaluatedList = [];
    for (var i = 0; i < es.length; i++) {
        if (isOperand(es[i])) {
            if (es[i].match(/^[0-9]+$/) != null) {
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
            evaluatedList.push(varEntry.type);
        }
    }
    return evaluatedList;
}
