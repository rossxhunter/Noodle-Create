function variable(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
}

function whileCounter(line, end, ended, count) {
    this.line = line;
    this.end = end;
    this.ended = ended;
    this.count = count;
}

var variables = [];
var shouldReturn = false;
var returnV;
var passedArgs = [];

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

//Unfortunate but necessary globals
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

function decode(line, lineNumber) {
    line = line.trim();
    if (!shouldSkip) {
        if (line.search("print ") == 0) {
            decodePrint(line);
        } else if (line.search(/int |float |string |char |bool/) == 0) {
            decodeVarDec(line);
        } else if (line.match(/^[a-zA-Z][a-zA-Z0-9_]*\s*=\s*.*$/) != null) {
            decodeVarAss(line);
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
            } else if (codeBlockStack[codeBlockStack.length-1] == "func") {
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
        } else if (codeBlockStack[codeBlockStack.length-1] == "func") {
            shouldReturn = true;
        } else {
            codeBlockStack.pop();
            shouldSkip = false;
        }
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

function decodePrint(line) {
    var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
    if (isValid("printVar", line)) {
        output = findVar(output).value;
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
                var varValue = findVar(varName).value;
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

function decodeVarDec(line) {
    var varType = line.match(/[^\s]+/)[0];
    var varName = line.substr(varType.length + 1, line.length - varType.length + 1).match(/[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    if (varValue != null) {
        varValue = varValue[0].match(/[^=\s*].*/)[0];
        varValue = evaluateExpression(varValue, varType);
        varValue = removeSpacesAndParseType(varValue, varType);
    } else {
        varValue = getDefaultValue(varType);
    }
    var newVar = new variable(varType, varName, varValue);
    removeOldVar(varName);
    variables.push(newVar);
    document.getElementById('noodleOutputBox').value += newVar.name;
    document.getElementById('noodleOutputBox').value += newVar.value;
}

function decodeVarAss(line) {
    var varName = line.match(/^[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    var varType = findVar(varName).type;
    varValue = evaluateExpression(varValue[1], varType);
    varValue = removeSpacesAndParseType(varValue, varType);
    updateVarVal(varName, varValue);
    var newVar = findVar(varName);
    document.getElementById('noodleOutputBox').value += newVar.name;
    document.getElementById('noodleOutputBox').value += newVar.value;
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

function addArgsToDecodeVars(args) {
    for (var i = 0; i < args.length; i++) {
        var oldVar = findVar(args[i].name);
        if (oldVar == null) {
            variables.push(new variable(args[i].type, args[i].name, passedArgs[i]));
        }
        else {
            updateVarVal(args[i].name, passedArgs[i]);
        }
    }
}

function decodeReturn(line, lineNumber) {
    var returnValue = line.substr(line.indexOf("n") + 1).trim();
    var func = findFuncByLine(lineNumber + 1);
    returnValue = evaluateExpression(returnValue, func.type);
    returnValue = removeSpacesAndParseType(returnValue, func.type);
    returnV = returnValue;
    shouldReturn = true;
}

function getTargetAndEquality(end) {
    if (end.charAt(0) == "<" || end.charAt(0) == ">" || end.charAt(0) == "!" || end.charAt(0) == "=") {
        var eq = end.charAt(0);
        end = end.substr(1, end.length - 1);
        if (end.charAt(0) == "=") {
            eq = eq.concat(end.charAt(0));
            end = end.substr(1, end.length - 1);
        }
        equalityStack.push(eq);
    }
    return end;
}

function getDefaultValue(varType) {
    switch (varType) {
        case "int":
            return 0;
            break;
        case "float":
            return 0.0;
            break;
        case "string":
            return "";
            break;
        case "char":
            return 'a';
            break;
        case "bool":
            return 'false';
            break;
    }
}

function removeOldVar(varName) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name == varName) {
            variables.splice(i, 1);
        }
    }
}

var operatorList = ["+", "-", "*", "/", "&&", "||", "==", "<=", ">=", "!=", "<", ">"];

function isOperator(char) {
    for (var i = 0; i < operatorList.length; i++) {
        if (char == operatorList[i]) {
            return true;
        }
    }
    return false;
}

function isOperand(char) {
    if (char.toString().match(/^(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false)$/) != null) {
        return true;
    }
    return false;
}

function getLiteralExpList(expList) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperator(expList[i]) || isOperand(expList[i]) || expList[i] == "(" || expList[i] == ")" || expList[i] == "@fc") {
            litExpList.push(expList[i]);

        } else {
            litExpList.push(getVarVal(expList[i]));
        }
    }
    return litExpList;
}

function getVarVal(v) {
    var varEntry = findVar(v);
    var val = varEntry.value;
    if (varEntry.type == "string") {
        val = "\"" + val + "\"";
    } else if (varEntry.type == "char") {
        val = "\'" + val + "\'";
    }
    return val;
}

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

function removeSpaces(expList) {
    for (var i = 0; i < expList.length; i++) {
        expList[i] = expList[i].trim();
    }
    return expList;
}

function getNegativesAndSubraction(expList) {
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] == '-') {
            if (i != 0 && (isOperator(expList[i - 1]) || expList[i - 1] == '(')) {
                expList[i] = expList[i].concat(expList[i + 1]);
                expList.splice(i + 1, 1);
            }
            if (i == 0) {
                expList[i] = expList[i].concat(expList[i + 1]);
                expList.splice(i + 1, 1);
            }
        }
    }
    return expList;
}

function castOp(op) {
    if (getTypeOfVarsAndLits([op.toString()])[0] == "int") {
        return parseFloat(op);
    } else if (getTypeOfVarsAndLits([op.toString()])[0] == "char") {
        op = op.replace(/\'/g, '');
        return "\"".concat(op).concat("\"");
    }
    return op;
}

function getFuncReturnVal(name, args) {
    var func = findFuncByName(name);
    passedArgs = args;
    execute(linesArray, func.start - 1, func.end - 1);
    return returnV;
}

function replaceFuncsWithVals(expList, funcNames, funcs) {
    var j = 0;
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] == "@fc") {
            var args = getArgsFromCall(funcs[j]);
            var f = findFuncByName(funcNames[j]);
            args = evaluateArgs(args, f.args);
            expList[i] = getFuncReturnVal(funcNames[j], args);
            j += 1;
        }
    }
    return expList;
}

function evaluateArgs(args, reqArgs) {
    for (var i = 0; i < args.length; i++) {
        args[i] = evaluateExpression(args[i], reqArgs[i].type);
    }
    return args;
}

function getArgsFromCall(line) {
    var args = line;
    args = args.substr(args.indexOf("("));
    args = args.substr(1, args.length - 2);
    args = args.trim();
    args = args.split(/,/);
    args = removeBlankEntries(args);
    if (args == null) {
        args = [];
    }
    return args;
}

function evaluateExpression(exp, type) {
    var funcs = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expList = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g, '@fc');
    expList = expList.split(/(\+|-|\*|\/|\(|\)|&&|\|\||==|<=|>=|!=|<|>)/g);
    expList = removeSpaces(expList);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    var literalExpList = getLiteralExpList(expList);
    literalExpList = replaceFuncsWithVals(literalExpList, funcNames, funcs);
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
        if (getTypeOfVarsAndLits([op1.toString()]) == "string") {
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

function replaceEscapes(str) {
    var i = 0;
    while (i < str.length) {
        if (i < str.length - 1 && str.charAt(i) == '\\') {
            if (str.charAt(i + 1) == 'n') {
                var line1 = str.substr(0, i);
                var line2 = str.substr(i + 2, str.length - i - 2);
                str = line1 + '\n' + line2;
            }
            i += 1;
        }
        i += 1;
    }
    str = str.replace(/\\\\/g, '\\');
    return str;
}

function findVar(varName) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name == varName) {
            return variables[i];
        }
    }
    return null;
}

function removeSpacesAndParseType(varValue, varType) {
    //varValue = varValue.toString().replace(/\s/g, '');
    if (varType == "int") {
        return parseInt(varValue);
    } else if (varType == "float") {
        return parseFloat(varValue);
    } else {
        return varValue;
    }
}

function updateVarVal(varName, varValue) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name == varName) {
            variables[i].value = varValue;
        }
    }
}

function getVarsFromExp(expList) {
    var varList = [];
    for (var i = 0; i < expList.length; i++) {
        if (!isOperator(expList[i]) && expList[i] != "(" && expList[i] != ")" && !isOperand(expList[i])) {
            varList.push(expList[i]);
        }
    }
    return varList;
}
