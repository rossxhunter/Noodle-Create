function variable(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
}

var variables = [];

var operatorList = ["+", "-", "*", "/"];

function isOperator(char) {
    for (var i = 0; i < operatorList.length; i++) {
        if (char == operatorList[i]) {
            return true;
        }
    }
    return false;
}

function isOperand(char) {
    if (char.toString().match(/^([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false)$/) != null) {
        return true;
    }
    return false;
}

function getLiteralExpList(expList) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperator(expList[i]) || isOperand(expList[i]) || expList[i] == "(" || expList[i] == ")") {
            litExpList.push(expList[i]);

        } else {

            litExpList.push(getVarVal(expList[i]));
        }
    }
    return litExpList;
}

function getVarVal(v) {
    var varEntry = findVar(v);
    return varEntry.value;
}

var operatorPrecedences = {
    "-": 0,
    "+": 1,
    "*": 2,
    "/": 3
};



function evaluateExpression(exp, type) {
    var expList = exp.split(/(\+|-|\*|\/|\(|\))/g);
    expList = removeBlankEntries(expList);
    var literalExpList = getLiteralExpList(expList);
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
                operandStack.push(evaluateSingleExpression(op, op1, op2, type));
            }
            operatorStack.push(literalExpList[i]);
        } else if (literalExpList[i] == ")") {
            while (operatorStack[operatorStack.length - 1] != "(") {
                op = operatorStack.pop();
                op1 = operandStack.pop();
                op2 = operandStack.pop();
                operandStack.push(evaluateSingleExpression(op, op1, op2, type));
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
        operandStack.push(evaluateSingleExpression(op, op1, op2, type));
    }

    return operandStack.pop();
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
        switch (op) {
            case "+":
                return "\"".concat(op1.replace(/\"/g, '')).concat(op2.replace(/\"/g, '')).concat("\"");
        }
    }

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
    varValue = varValue.toString().replace(/\s/g, '');
    if (varType == "int") {
        return parseInt(varValue);
    } else if (varType == "float") {
        return parseFloat(varValue);
    } else {
        return varValue;
    }
}

function decode(line) {
    if (line.search("print ") == 0) {
        var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
        output = output.substr(1, output.length - 2);
        document.getElementById('noodleOutputBox').value += output;
    } else if (line.search(/int |float |string |char |bool/) == 0) {
        var varType = line.match(/[^\s]+/)[0];
        var varName = line.substr(varType.length + 1, line.length - varType.length + 1).match(/[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
        var varValue = line.match(/=\s*(.*)$/);
        if (varValue != null) {
            varValue = evaluateExpression(varValue[1].toString().replace(/\s/g, ''), varType);
            varValue = removeSpacesAndParseType(varValue, varType);
        } else {
            varValue = 0;
        }
        var newVar = new variable(varType, varName, varValue);
        variables.push(newVar);
        document.getElementById('noodleOutputBox').value += newVar.name;
        document.getElementById('noodleOutputBox').value += newVar.value;
    } else if (line.match(/^[a-zA-Z][a-zA-Z0-9_]*\s*=\s.*$/) != null) {
        var varName = line.match(/^[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
        var varValue = line.match(/=\s*(.*)$/);
        if (varValue != null) {
            varValue = evaluateExpression(varValue[1].toString().replace(/\s/g, ''), "int");
            varValue = parseInt(varValue.toString().replace(/\s/g, ''));
        } else {
            varValue = 0;
        }
        updateVarVal(varName, varValue);
        var newInt = findVar(varName);
        document.getElementById('noodleOutputBox').value += newInt.name;
        document.getElementById('noodleOutputBox').value += newInt.value;

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
