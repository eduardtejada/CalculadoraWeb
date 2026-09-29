(function () {
    'use strict';

    var STORAGE_KEY = 'calculadora_historial';

    var operationDisplay = document.getElementById('operation-display');
    var currentDisplay = document.getElementById('current-display');
    var historyList = document.getElementById('history-list');
    var historyEmpty = document.getElementById('history-empty');
    var historyCount = document.getElementById('history-count');
    var historyBadge = document.getElementById('history-badge');
    var btnClearHistory = document.getElementById('btn-clear-history');
    var keypad = document.querySelector('.keypad');

    var btnOpenHistory = document.getElementById('btn-open-history');
    var btnCloseHistory = document.getElementById('btn-close-history');
    var historyModalOverlay = document.getElementById('history-modal-overlay');

    var currentOperand = '0';
    var previousOperand = '';
    var operation = null;
    var shouldResetDisplay = false;

    var calculationHistory = [];

    function openHistoryModal() {
        historyModalOverlay.className = 'history-modal-overlay active';
        historyModalOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeHistoryModal() {
        historyModalOverlay.className = 'history-modal-overlay';
        historyModalOverlay.setAttribute('aria-hidden', 'true');
    }

    function isHistoryModalOpen() {
        return historyModalOverlay.className.indexOf('active') !== -1;
    }

    btnOpenHistory.addEventListener('click', function () {
        openHistoryModal();
    });

    btnCloseHistory.addEventListener('click', function () {
        closeHistoryModal();
    });

    historyModalOverlay.addEventListener('click', function (event) {
        if (event.target === historyModalOverlay) {
            closeHistoryModal();
        }
    });

    function fixPrecision(num) {
        return parseFloat(num.toPrecision(12));
    }

    function compute(a, b, op) {
        var num1 = parseFloat(a);
        var num2 = parseFloat(b);

        if (isNaN(num1) || isNaN(num2)) {
            return null;
        }

        var result = 0;
        switch (op) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                if (num2 === 0) {
                    return 'Error: División por 0';
                }
                result = num1 / num2;
                break;
            default:
                return null;
        }

        return fixPrecision(result);
    }

    function getOperatorSymbol(op) {
        switch (op) {
            case '+':
                return '+';
            case '-':
                return '−';
            case '*':
                return '×';
            case '/':
                return '÷';
            default:
                return '';
        }
    }

    function updateDisplay() {
        currentDisplay.textContent = currentOperand;

        if (operation !== null && previousOperand !== '') {
            operationDisplay.textContent = previousOperand + ' ' + getOperatorSymbol(operation);
        } else {
            operationDisplay.textContent = '';
        }
    }

    function appendNumber(number) {
        if (currentOperand === '0' || shouldResetDisplay) {
            currentOperand = number.toString();
            shouldResetDisplay = false;
        } else {
            if (currentOperand.length >= 16) {
                return;
            }
            currentOperand = currentOperand + number.toString();
        }
        updateDisplay();
    }

    function appendDecimal() {
        if (shouldResetDisplay) {
            currentOperand = '0.';
            shouldResetDisplay = false;
            updateDisplay();
            return;
        }

        if (currentOperand.indexOf('.') === -1) {
            currentOperand = currentOperand + '.';
            updateDisplay();
        }
    }

    function handleOperator(nextOperator) {
        if (currentOperand === 'Error: División por 0') {
            allClear();
            return;
        }

        if (operation !== null && !shouldResetDisplay) {
            executeCalculation();
        }

        previousOperand = currentOperand;
        operation = nextOperator;
        shouldResetDisplay = true;
        updateDisplay();
    }

    function executeCalculation() {
        if (operation === null || previousOperand === '') {
            return;
        }

        var result = compute(previousOperand, currentOperand, operation);

        if (result === null) {
            return;
        }

        var expression = previousOperand + ' ' + getOperatorSymbol(operation) + ' ' + currentOperand;

        if (typeof result === 'string') {
            currentOperand = result;
            operationDisplay.textContent = expression + ' =';
            operation = null;
            previousOperand = '';
            shouldResetDisplay = true;
            updateDisplay();
            return;
        }

        operationDisplay.textContent = expression + ' =';
        var resultString = result.toString();

        addHistoryItem(expression, resultString);

        currentOperand = resultString;
        operation = null;
        previousOperand = '';
        shouldResetDisplay = true;
        currentDisplay.textContent = currentOperand;
    }

    function clearEntry() {
        currentOperand = '0';
        updateDisplay();
    }

    function allClear() {
        currentOperand = '0';
        previousOperand = '';
        operation = null;
        shouldResetDisplay = false;
        updateDisplay();
    }

    function backspace() {
        if (shouldResetDisplay || currentOperand === 'Error: División por 0') {
            currentOperand = '0';
            shouldResetDisplay = false;
            updateDisplay();
            return;
        }

        if (currentOperand.length > 1) {
            currentOperand = currentOperand.substring(0, currentOperand.length - 1);
        } else {
            currentOperand = '0';
        }
        updateDisplay();
    }

    function loadHistoryFromStorage() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                calculationHistory = JSON.parse(stored);
                if (!Array.isArray(calculationHistory)) {
                    calculationHistory = [];
                }
            } else {
                calculationHistory = [];
            }
        } catch (e) {
            calculationHistory = [];
        }
        renderHistory();
    }

    function saveHistoryToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(calculationHistory));
        } catch (e) {
            console.error(e);
        }
    }

    function addHistoryItem(expression, result) {
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();

        var formattedTime = (hours < 10 ? '0' + hours : hours) + ':' +
                            (minutes < 10 ? '0' + minutes : minutes) + ':' +
                            (seconds < 10 ? '0' + seconds : seconds);

        var item = {
            id: new Date().getTime(),
            expression: expression,
            result: result,
            timestamp: formattedTime
        };

        calculationHistory.unshift(item);

        if (calculationHistory.length > 50) {
            calculationHistory.pop();
        }

        saveHistoryToStorage();
        renderHistory();
    }

    function clearAllHistory() {
        if (calculationHistory.length === 0) {
            return;
        }

        if (window.confirm('¿Desea eliminar todo el historial de cálculos guardados?')) {
            calculationHistory = [];
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error(e);
            }
            renderHistory();
        }
    }

    function renderHistory() {
        historyList.innerHTML = '';
        var count = calculationHistory.length;
        var countStr = count.toString();
        
        historyCount.textContent = countStr;
        if (historyBadge) {
            historyBadge.textContent = countStr;
        }

        if (count === 0) {
            historyEmpty.style.display = 'block';
            btnClearHistory.disabled = true;
            return;
        }

        historyEmpty.style.display = 'none';
        btnClearHistory.disabled = false;

        for (var i = 0; i < calculationHistory.length; i++) {
            var item = calculationHistory[i];
            var li = document.createElement('li');
            li.className = 'history-item';
            li.setAttribute('title', 'Clic para cargar este resultado');

            var exprDiv = document.createElement('div');
            exprDiv.className = 'history-item-expr';
            exprDiv.textContent = item.expression + ' =';

            var resultDiv = document.createElement('div');
            resultDiv.className = 'history-item-result';
            resultDiv.textContent = item.result;

            var timeSpan = document.createElement('span');
            timeSpan.className = 'history-item-time';
            timeSpan.textContent = item.timestamp;
            resultDiv.appendChild(timeSpan);

            li.appendChild(exprDiv);
            li.appendChild(resultDiv);

            (function (res) {
                li.addEventListener('click', function () {
                    currentOperand = res;
                    shouldResetDisplay = true;
                    updateDisplay();
                    closeHistoryModal();
                });
            })(item.result);

            historyList.appendChild(li);
        }
    }

    keypad.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || target.tagName !== 'BUTTON') {
            return;
        }

        var number = target.getAttribute('data-number');
        var action = target.getAttribute('data-action');
        var operator = target.getAttribute('data-operator');

        if (number !== null) {
            appendNumber(number);
            return;
        }

        if (action === 'decimal') {
            appendDecimal();
            return;
        }

        if (action === 'operator' && operator) {
            handleOperator(operator);
            return;
        }

        if (action === 'calculate') {
            executeCalculation();
            return;
        }

        if (action === 'all-clear') {
            allClear();
            return;
        }

        if (action === 'clear-entry') {
            clearEntry();
            return;
        }

        if (action === 'backspace') {
            backspace();
        }
    });

    btnClearHistory.addEventListener('click', function () {
        clearAllHistory();
    });

    window.addEventListener('keydown', function (event) {
        var key = event.key;

        if (key === 'Escape' && isHistoryModalOpen()) {
            closeHistoryModal();
            return;
        }

        if (key >= '0' && key <= '9') {
            appendNumber(key);
        } else if (key === '.' || key === ',') {
            appendDecimal();
        } else if (key === '+' || key === '-') {
            handleOperator(key);
        } else if (key === '*') {
            handleOperator('*');
        } else if (key === '/') {
            event.preventDefault();
            handleOperator('/');
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            executeCalculation();
        } else if (key === 'Backspace') {
            backspace();
        } else if (key === 'Escape') {
            allClear();
        }
    });

    loadHistoryFromStorage();
    updateDisplay();
})();
