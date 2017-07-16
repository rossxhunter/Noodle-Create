//Global variables

var variables = [];
var shouldReturn = false;
var returnV;
var passedArgs = [];
var shouldSkip = false;
var satisfied = false;
var codeBlockStack = [];
var endStack = [];
var finishStack = [];
var stepperVar = [];
var currentStepper = [];
var target = [];
var increment = [];
var equalityStack = [];
var whileCount = [];
var operatorList = ["+", "-", "*", "/", "&&", "||", "==", "<=", ">=", "!=", "<", ">"];
var operatorPrecedences = {
    "||": 0,
    "&&": 1,
    "==": 2,
    "!=": 2,
    "<=": 2,
    ">=": 2,
    "<": 2,
    ">": 2,
    "-": 3,
    "+": 3,
    "*": 4,
    "/": 4,
};

//Main logic

function decode(line, lineNumber) {
    line = line.trim();
    if (!shouldSkip) {
        if (line.search("print ") == 0) {
            decodePrint(line, lineNumber + 1);
        } else if (line.search(validTypes) == 0) {
            decodeVarDec(line, lineNumber + 1);
        } else if (line.match(/^([a-zA-Z][a-zA-Z0-9_]*((\[.*\])?)?|[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*)\s*=\s*.*$/) != null) {
            decodeVarAss(line, lineNumber + 1);
        } else if (line.search(/if\s*\(/) == 0) {
            shouldSkip = !decodeIf(line);
            satisfied = !shouldSkip;
            codeBlockStack.push("if");
        } else if (line.search(/else\s+if\s*\(/) == 0) {
            shouldSkip = true;
            codeBlockStack.pop();
            codeBlockStack.push("else if");
        } else if (line.search("else") == 0) {
            shouldSkip = true;
            codeBlockStack.pop();
            codeBlockStack.push("else");
        } else if (line.match(/for\s*\(/) != null) {
            decodeFor(line);
            endStack.push(false);
            finishStack.push(true);
            codeBlockStack.push("for");
        } else if (line.match(/(do\s+)?while\s*\(/) != null) {
            shouldSkip = !decodeWhile(line);
            endStack.push(false);
            codeBlockStack.push("while");
            if (firstWhile(lineNumber)) {
                whileCount.push(new whileCounter(lineNumber, 0, false, 0));
                if (line.match(/do\s+while\s*\(/) != null) {
                    shouldSkip = false;
                }
            }
            if (shouldSkip) {
                whileCount[whileCount.length - 1].ended = true;
            }
        } else if (line.trim().match(/^(return|return\s.*)$/) != null) {
            decodeReturn(line, lineNumber);
        } else if (line.search(/\s*func\s+main\s*\(\s*\)\s*/) == 0) {

        } else if (line.replace(/^\s+/, '').search(/func(\s*\(|\s)/) == 0) {
            decodeFunc(line);
        } else if (line.trim().match(/^end$/) != null) {
            if (codeBlockStack[codeBlockStack.length - 1] == "for") {
                endStack.pop();
                endStack.push(true);

            } else if (codeBlockStack[codeBlockStack.length - 1] == "while") {
                endStack.pop();
                endStack.push(true);
            } else if (codeBlockStack[codeBlockStack.length - 1] == "func") {
                shouldReturn = true;
            } else {
                codeBlockStack.pop();
            }
        }
    } else if (line.trim().match(/^end$/) != null) {
        if (codeBlockStack[codeBlockStack.length - 1] == "for") {
            endStack.pop();
            endStack.push(true);
        } else if (codeBlockStack[codeBlockStack.length - 1] == "while") {
            shouldSkip = false;
            endStack.pop();
            endStack.push(true);
        } else if (codeBlockStack[codeBlockStack.length - 1] == "func") {
            shouldReturn = true;
        } else {
            codeBlockStack.pop();
            if (codeBlockStack.length == 0) {
                shouldSkip = false;
            }
        }
    } else if (line.search(/if\s*\(/) == 0) {
        codeBlockStack.push("if");
    } else if (line.search(/else\s+if\s*\(/) == 0) {
        shouldSkip = !decodeIf(line);
        satisfied = !shouldSkip;
        codeBlockStack.pop();
        codeBlockStack.push("else if");
    } else if (line.trim().match(/^else$/) != null && !satisfied) {
        shouldSkip = false;
        codeBlockStack.pop();
        codeBlockStack.push("else");
    }
}

function decodePrint(line, lineNumber) {
    var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
    if (isValid("printVar", line)) {
        if (output.match(/.*\[.*\]/) != null) {
            var varWithoutIndex = output.substr(0, output.indexOf("["));
            var index = output.substr(output.indexOf("["));
            index = evaluateExpression(index.substr(1, index.length - 2));
            var array = findVar(varWithoutIndex).value;
            if (index >= array.length) {
                addRuntimeError("Array index out of bounds on line " + lineNumber);
            }
            output = array[index];
        } else if (output.match(/.*\..*/) != null) {
            var s = output.substr(0, output.indexOf("."));
            var v = findVar(s);
            var struct = findStruct(v.type);
            var m = getMemberVal(v.value, struct, output.substr(output.indexOf(".") + 1));
            output = m;
        }
        else {
            var v = findVar(output);
            output = v.value;
            if (v.type.match(/.*\[.*\]/) != null) {
                output = "[".concat(output).concat("]");
            }
            else if (isStructType(v.type)) {
                output = "{".concat(output).concat("}");
            }
        }
    } else {
        output = output.substr(1, output.length - 2);
        var i = 0;
        while (i < output.length) {
            if (output.charAt(i) == '$') {
                i += 1;
                var varName = output.substr(i, output.length - i);
                varName = varName.match(/^(.*?)\$/)[1];
                while (output.charAt(i) != '$') {
                    i += 1;
                }

                if (varName.match(/.*\[.*\]/) != null) {
                    var varWithoutIndex = varName.substr(0, varName.indexOf("["));
                    var index = varName.substr(varName.indexOf("["));
                    index = index.substr(1, index.length - 2);
                    index = evaluateExpression(index, "int");
                    var array = findVar(varWithoutIndex).value;
                    if (index >= array.length) {
                        addRuntimeError("Array index out of bounds on line " + lineNumber);
                    }
                    var varValue = array[index];
                } else if (varName.match(/.*\..*/) != null) {
                    var s = varName.substr(0, varName.indexOf("."));
                    var v = findVar(s);
                    var struct = findStruct(v.type);
                    var m = getMemberVal(v.value, struct, varName.substr(varName.indexOf(".") + 1));
                    varValue = m;
                }
                else {
                    var v = findVar(varName);
                    var varValue = v.value;
                    if (v.type.match(/.*\[.*\]/) != null) {
                        varValue = "[".concat(varValue).concat("]");
                    }
                    else if (isStructType(v.type)) {
                        varValue = "{".concat(varValue).concat("}");
                    }
                }

                var replace = "$" + varName + "$";
                var re = new RegExp(escapeRegExp(replace), "g");
                output = output.replace(re, varValue.toString());
                i = i - 2 - varName.length + varValue.toString().length;
            } else if (i < output.length - 1 && output.charAt(i) == '\\') {
                if (output.charAt(i + 1) == 'n') {
                    var line1 = output.substr(0, i);
                    var line2 = output.substr(i + 2, output.length - i - 2);
                    output = line1 + '\n' + line2;
                    i -= 2;
                } else if (output.charAt(i + 1) == '$') {
                    var part1 = output.substr(0, i);
                    var part2 = output.substr(i + 1, output.length - i - 1);
                    output = part1 + part2;
                    i -= 1;
                }
                i += 1;

            }
            i += 1;
        }
    }
    output = output.toString();
    output = output.replace(/\\\\/g, '\\');
    document.getElementById('noodleOutputBox').value += output;
}

function decodeVarDec(line, lineNumber) {
    var varType = line.match(/[^\s]+/)[0];
    var varName = line.substr(varType.length + 1, line.length - varType.length + 1).match(/[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    if (varValue != null) {
        varValue = varValue[1];
    }
    if (varType.match(/.*\[/) != null) {
        var arrayLength = varType.substr(varType.indexOf("["));
        arrayLength = arrayLength.substr(1, arrayLength.length - 2);
        arrayLength = evaluateExpression(arrayLength, "int");
        checkArrayLength(arrayLength, lineNumber);
        if (varValue != null) {
            if (varValue.match(/\[.*/) != null) {
                varValue = createArray(varValue, arrayLength, lineNumber);
            }
            else {
                varValue = evaluateExpression(varValue, varType);
            }
        }
    } else {
        if (varValue != null) {
            if (isStructType(varType)) {
                varValue = decodeStruct(varType, varName, varValue, lineNumber);
            }
            else {
                varValue = evaluateExpression(varValue, varType);
                varValue = removeSpacesAndParseType(varValue, varType);
            }
        } else {
            varValue = getDefaultValue(varType);
        }
    }
    var newVar = new variable(varType, varName, varValue);
    removeOldVar(varName);
    variables.push(newVar);
    document.getElementById('noodleOutputBox').value += newVar.name;
    document.getElementById('noodleOutputBox').value += newVar.value;
}

function decodeStruct(varType, varName, varValue, lineNumber) {
    var vals = [];
    varValue = varValue.substr(1, varValue.length - 2);
    var mems = varValue.split(",");
    var struct = findStruct(varType);
    for (var i = 0; i < mems.length; i++) {
        mems[i] = evaluateExpression(mems[i], struct.memberTypes[i]);
    }
    return mems;
}

function createArray(array, length, line) {
    array = array.substr(1, array.length - 2);
    array = array.split(/,/);
    if (array.length != length) {
        addRuntimeError("Expected " + length + " elements in array but got " + array.length + " on line " + line);
        return;
    }
    var retArray = []
    for (var i = 0; i < array.length; i++) {
        retArray.push(evaluateExpression(array[i]));
    }
    return retArray;
}

function decodeVarAss(line, lineNumber) {
    var varName = line.match(/^[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/)[1];
    if (varName.match(/.*\[/) != null) {

        var varWithoutIndex = varName.substr(0, varName.indexOf("["));
        var index = varName.substr(varName.indexOf("["));
        index = index.substr(1, index.length - 2);
        index = evaluateExpression(index, "int");
        var oldVar = findVar(varWithoutIndex);
        if (index >= oldVar.value.length) {
            addRuntimeError("Array index out of bounds on line " + lineNumber);
        }
        var varType = findVar(varWithoutIndex).type;
        varType = varType.substr(0, varType.indexOf("["));
        varValue = evaluateExpression(varValue, varType);
        varValue = removeSpacesAndParseType(varValue, varType);
        var oldVarValue = oldVar.value;
        oldVarValue = getNewArray(oldVarValue, index, varValue);
        updateVarVal(varWithoutIndex, oldVarValue);
        var newVar = findVar(varWithoutIndex);
        document.getElementById('noodleOutputBox').value += oldVar.name + index;
        document.getElementById('noodleOutputBox').value += oldVar.value[index];
    } else {
        if (varName.match(/.*\..*/) != null) {
            var m = varName.substr(varName.indexOf(".") + 1);
            var s = varName.substr(0, varName.indexOf("."));
            var struct = findVar(s);
            var t = findMemberType(struct.type, m);
            varName = s;
        }
        var varType = findVar(varName).type;
        if (t != null) {
            varType = t;
        }
        if (varType.match(/.*\[/) != null) {
            var arrayLength = varType.substr(varType.indexOf("["));
            arrayLength = arrayLength.substr(1, arrayLength.length - 2);
            arrayLength = evaluateExpression(arrayLength, "int");
            checkArrayLength(arrayLength, lineNumber);
            if (varValue != null) {
                varValue = createArray(varValue, arrayLength, lineNumber);
            }
        } else {
            if (varValue != null) {
                if (isStructType(varType)) {
                    varValue = decodeStruct(varType, varName, varValue, lineNumber);
                }
                else {
                    varValue = evaluateExpression(varValue, varType);
                    varValue = removeSpacesAndParseType(varValue, varType);
                }
            } else {
                varValue = getDefaultValue(varType);
            }
        }
        if (t != null) {
            updateStructMem(varName, m, varValue);
        }
        else {
            updateVarVal(varName, varValue);
        }
        var newVar = findVar(varName);
        document.getElementById('noodleOutputBox').value += newVar.name;
        document.getElementById('noodleOutputBox').value += newVar.value;
    }


}

function decodeIf(line) {
    var pred = line.substr(line.indexOf("("));
    var evaluatedPred = evaluateExpression(pred, "bool");
    evaluatedPred = evaluatedPred == true || evaluatedPred == "true";
    document.getElementById('noodleOutputBox').value += evaluatedPred;
    return evaluatedPred;
}

function decodeFor(line) {
    var loopCond = line.substr(line.indexOf("("));
    var loopParts = loopCond.split(/,/g);
    loopParts = removeSpaces(loopParts);
    if (loopParts.length == 1) {
        currentStepper.push(0);
        target.push(evaluateExpression(loopParts[0], "int"));
        increment.push(1);
        stepperVar.push("");
    } else if (loopParts.length == 2) {
        currentStepper.push(0);
        var end = loopParts[1].substr(0, loopParts[1].length - 1);
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int");
        target.push(end);
        increment.push(1);
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), 0));
    } else if (loopParts.length == 3) {
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        var start = evaluateExpression(loopParts[1], "int");
        var end = loopParts[2].substr(0, loopParts[2].length - 1);
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int");
        currentStepper.push(start);
        target.push(end);
        if (parseInt(start) <= parseInt(end)) {
            increment.push(1);
        } else {
            increment.push(-1);
        }
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), parseInt(start)));
    } else {
        var start = evaluateExpression(loopParts[1], "int");
        currentStepper.push(start);
        var end = loopParts[2];
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int");
        target.push(end);
        var inc = evaluateExpression(loopParts[3].substr(0, loopParts[3].length - 1), "int");
        increment.push(inc);
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), parseInt(start)));
    }
}

function decodeWhile(line) {
    var pred = line.substr(line.indexOf("("));
    var evaluatedPred = evaluateExpression(pred, "bool");
    evaluatedPred = evaluatedPred == true || evaluatedPred == "true";
    document.getElementById('noodleOutputBox').value += evaluatedPred;
    return evaluatedPred;
}

function decodeFunc(line) {
    var args = getArgs(line);
    addArgsToDecodeVars(args);
}

function decodeReturn(line, lineNumber) {
    var returnValue = line.substr(line.indexOf("n") + 1).trim();
    var func = findFuncByLine(lineNumber + 1);
    returnValue = evaluateExpression(returnValue, func.type);
    returnValue = removeSpacesAndParseType(returnValue, func.type);
    returnV = returnValue;
    shouldReturn = true;
}

function evaluateExpression(exp, type) {
    var funcs = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var arrays = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*\[.*?\]/g);
    if (arrays == null) {
        arrays = [];
    }
    var expWithoutFuncsAndArrays = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g, '');
    expWithoutFuncsAndArrays = expWithoutFuncsAndArrays.replace(/[a-zA-Z_][a-zA-Z0-9_]*\[.*?\]/g, '');
    var expList = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g, '@fc');
    expList = expList.replace(/[a-zA-Z_][a-zA-Z0-9_]*\[.*?\]/g, '@a');
    expList = expList.split(/(\+|-|\*|\/|\(|\)|&&|\|\||==|<=|>=|!=|<|>)/g);
    expList = removeSpaces(expList);
    expList = removeBlankEntries(expList);
    expList = putArraysBackInExpList(expList, arrays);
    expList = getNegativesAndSubraction(expList);

    var literalExpList = getLiteralExpList(expList, type == "bool");
    literalExpList = replaceFuncsWithVals(literalExpList, funcNames, funcs);
    if (literalExpList.length == 1) {
        return literalExpList[0];
    }
    var i = 0;
    var operandStack = [];
    var operatorStack = [];
    while (i < literalExpList.length) {
        if (isOperand(literalExpList[i])) {
            operandStack.push(literalExpList[i]);
        } else if (literalExpList[i] == "(") {
            operatorStack.push(literalExpList[i]);
        } else if (isOperator(literalExpList[i])) {
            while (operatorPrecedences[operatorStack[operatorStack.length - 1]] >=
                operatorPrecedences[literalExpList[i]]) {
                var op = operatorStack.pop();
                var op1 = operandStack.pop();
                var op2 = operandStack.pop();
                op1 = castOp(op1);
                op2 = castOp(op2);
                if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
                } else if (type == "bool" && op != "&&" && op != "||") {
                    var expType = getTypeOfVarsAndLits([op1.toString()])[0];
                    operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
                } else {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, type));
                }
            }
            operatorStack.push(literalExpList[i]);
        } else if (literalExpList[i] == ")") {
            while (operatorStack[operatorStack.length - 1] != "(") {
                op = operatorStack.pop();
                op1 = operandStack.pop();
                op2 = operandStack.pop();
                op1 = castOp(op1);
                op2 = castOp(op2);
                if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
                } else if (type == "bool" && op != "&&" && op != "||") {
                    var expType = getTypeOfVarsAndLits([op1.toString()])[0];
                    operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
                } else {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, type));
                }
            }
            if (operatorStack[operatorStack.length - 1] == "(") {
                operatorStack.pop();
            }
        }
        i += 1;
    }
    while (operatorStack.length > 0) {
        var op = operatorStack.pop();
        var op1 = operandStack.pop();
        var op2 = operandStack.pop();
        op1 = castOp(op1);
        op2 = castOp(op2);
        if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
            operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
        } else if (type == "bool" && op != "&&" && op != "||") {
            var expType = getTypeOfVarsAndLits([op1.toString()])[0];
            operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
        } else {
            operandStack.push(evaluateSingleExpression(op, op1, op2, type));
        }
    }
    result = operandStack.pop();
    if (type == "string") {
        result = result.substr(1, result.length - 2);
        result = replaceEscapes(result);
    } else if (type == "char") {
        result = result.substr(1, result.length - 2);
        if (result == "\\n") {
            result = '\n';
        }
    }
    return result;
}

function evaluateSingleExpression(op, op1, op2, type) {
    switch (type) {
        case "int":
            op1 = parseInt(op1);
            op2 = parseInt(op2);
            break;
        case "float":
            op1 = parseFloat(op1);
            op2 = parseFloat(op2);
            break;
    }
    if (type == "int" || type == "float") {
        switch (op) {
            case "+":
                return op1 + op2;
            case "-":
                return op2 - op1;
            case "/":
                return op2 / op1;
            case "*":
                return op1 * op2;
        }
    } else if (type == "string") {
        op1 = op1.replace(/(\"|\')/g, '');
        op2 = op2.replace(/(\"|\')/g, '');
        switch (op) {
            case "+":
                return "\"".concat(op2).concat(op1).concat("\"");
        }
    } else if (type == "bool") {
        op1 = (op1 == "true") || (op1 == true);
        op2 = (op2 == "true") || (op2 == true);
        switch (op) {
            case "&&":
                return op1 && op2;
            case "||":
                return op1 || op2;
        }
    } else if (type == "pred") {
        if (op1 != null && getTypeOfVarsAndLits([op1.toString()]) == "string") {
            op1 = op1.replace(/(\"|\')/g, '');
            op2 = op2.replace(/(\"|\')/g, '');
        }
        switch (op) {
            case "==":
                return op1 == op2;
            case "!=":
                return op1 != op2;
            case "<=":
                return op2 <= op1;
            case ">=":
                return op2 >= op1;
            case "<":
                return op2 < op1;
            case ">":
                return op2 > op1;
        }
    }

}
