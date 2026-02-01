// Main ATM Application
class ATM {
    static currentScreen = 'welcome';
    static enteredPin = '';
    static userBalance = 50000;
    static currentPin = '1234';
    static transactionHistory = [];
    static isVoiceEnabled = true;
    static isMuted = false;
    static volume = 0.8;
    static voiceSpeed = 1.0;
    static voiceGender = 'female';
    static currentAmount = 0;
    static speechSynthesis = window.speechSynthesis;
    static currentUtterance = null;
    
    static init() {
        this.loadFromLocalStorage();
        this.initAudio();
        this.setupEventListeners();
        this.updateTime();
        this.updateBalanceDisplay();
        this.loadTransactionHistory();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
        
        // Create initial transaction history if empty
        if (this.transactionHistory.length === 0) {
            this.createSampleHistory();
        }
        
        console.log('ATM initialized');
    }
    
    static initAudio() {
        // Set audio volume
        document.getElementById('beepSound').volume = this.volume;
        document.getElementById('confirmSound').volume = this.volume;
        document.getElementById('errorSound').volume = this.volume;
        document.getElementById('cashSound').volume = this.volume;
        document.getElementById('cardSound').volume = this.volume;
    }
    
    static setupEventListeners() {
        // Voice control buttons
        document.getElementById('toggleVoice').addEventListener('click', () => this.toggleVoice());
        document.getElementById('repeatBtn').addEventListener('click', () => this.repeatInstruction());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeHelp').addEventListener('click', () => this.hideHelp());
        
        // Settings modal
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // Volume control
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.initAudio();
        });
        
        // Card eject
        document.getElementById('cardEject').addEventListener('click', () => this.exitATM());
        
        // Menu options click handlers
        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const command = e.currentTarget.dataset.command;
                this.handleMenuCommand(command);
            });
        });
        
        // Quick amount buttons
        document.querySelectorAll('.amount-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const amount = parseInt(e.currentTarget.dataset.amount);
                this.setAmount(amount);
                this.speak(`Amount set to ${this.formatCurrency(amount)}. Say "confirm" to proceed.`);
            });
        });
        
        // Voice actions
        document.querySelectorAll('.voice-action').forEach(action => {
            action.addEventListener('click', (e) => {
                const command = e.currentTarget.dataset.command;
                this.handleVoiceAction(command);
            });
        });
    }
    
    static showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Update current screen
        this.currentScreen = screenName;
        
        // Show the requested screen
        const screenElement = document.getElementById(`${screenName}Screen`);
        if (screenElement) {
            screenElement.classList.add('active');
            
            // Update screen-specific content
            switch(screenName) {
                case 'menu':
                    this.updateBalanceDisplay();
                    this.speak('Main menu. You can say "withdraw", "deposit", "balance", "change pin", "history", or "exit".');
                    break;
                case 'withdraw':
                    this.currentAmount = 0;
                    this.updateAmountDisplay();
                    this.speak('Withdrawal screen. Say an amount like "five thousand" or choose from quick amounts. Then say "confirm" to proceed.');
                    break;
                case 'deposit':
                    this.currentAmount = 0;
                    this.updateAmountDisplay('deposit');
                    this.speak('Deposit screen. Say the amount you want to deposit. Minimum is one hundred Naira, maximum is five hundred thousand Naira.');
                    break;
                case 'balance':
                    this.updateBalanceDisplay();
                    this.speak(`Your current balance is ${this.formatCurrency(this.userBalance)}.`);
                    break;
                case 'history':
                    this.displayTransactionHistory();
                    this.speak('Transaction history. Showing your last 10 transactions.');
                    break;
            }
        }
    }
    
    static beginTransaction() {
        this.playSound('cardSound');
        this.speak('Card inserted. Please say your 4-digit PIN, one digit at a time.');
        this.showScreen('pin');
    }
    
    static enterPinDigit(digit) {
        if (this.enteredPin.length < 4) {
            this.enteredPin += digit;
            this.updatePinDisplay();
            this.playSound('beepSound');
            
            // Speak the digit for confirmation
            if (this.enteredPin.length === 4) {
                this.speak('PIN entered. Say "confirm" to continue or "clear" to start over.');
            } else {
                this.speak(digit);
            }
        }
    }
    
    static clearPin() {
        this.enteredPin = '';
        this.updatePinDisplay();
        this.playSound('beepSound');
        this.speak('PIN cleared. Please say your 4-digit PIN again.');
    }
    
    static backspacePin() {
        if (this.enteredPin.length > 0) {
            this.enteredPin = this.enteredPin.slice(0, -1);
            this.updatePinDisplay();
            this.playSound('beepSound');
            this.speak('Last digit removed.');
        }
    }
    
    static confirmPin() {
        if (this.enteredPin.length !== 4) {
            this.speak('Please enter a complete 4-digit PIN.');
            return;
        }
        
        if (this.enteredPin === this.currentPin) {
            this.playSound('confirmSound');
            this.speak('PIN accepted. Welcome to your account.');
            
            // Add a small delay for better UX
            setTimeout(() => {
                this.showScreen('menu');
            }, 1500);
        } else {
            this.playSound('errorSound');
            this.speak('Incorrect PIN. Please try again.');
            this.enteredPin = '';
            this.updatePinDisplay();
        }
    }
    
    static updatePinDisplay() {
        const pinDots = document.querySelectorAll('.pin-dot');
        const pinDigits = document.getElementById('pinDigits');
        
        pinDots.forEach((dot, index) => {
            if (index < this.enteredPin.length) {
                dot.classList.add('active');
                dot.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
            } else {
                dot.classList.remove('active');
                dot.style.boxShadow = 'none';
            }
        });
        
        if (pinDigits) {
            const digitSpans = pinDigits.querySelectorAll('span');
            digitSpans.forEach((span, index) => {
                if (index < this.enteredPin.length) {
                    span.textContent = this.enteredPin[index];
                    span.style.color = '#10b981';
                } else {
                    span.textContent = '●';
                    span.style.color = '';
                }
            });
        }
    }
    
    static handleMenuCommand(command) {
        switch(command) {
            case 'withdraw':
                this.showScreen('withdraw');
                break;
            case 'deposit':
                this.showScreen('deposit');
                break;
            case 'balance':
                this.showScreen('balance');
                break;
            case 'change pin':
                this.showScreen('pin'); // For simplicity, reuse PIN screen
                this.speak('Change PIN feature. Please say your new 4-digit PIN.');
                break;
            case 'history':
                this.showScreen('history');
                break;
            case 'exit':
                this.exitATM();
                break;
        }
    }
    
    static setAmount(amount) {
        this.currentAmount = amount;
        
        if (this.currentScreen === 'withdraw') {
            document.getElementById('withdrawAmount').value = this.formatCurrency(amount);
        } else if (this.currentScreen === 'deposit') {
            document.getElementById('depositAmount').value = this.formatCurrency(amount);
        }
    }
    
    static updateAmountDisplay(type = 'withdraw') {
        const inputId = type === 'withdraw' ? 'withdrawAmount' : 'depositAmount';
        const input = document.getElementById(inputId);
        if (input) {
            input.value = this.formatCurrency(this.currentAmount);
        }
    }
    
    static confirmAction() {
        switch(this.currentScreen) {
            case 'withdraw':
                this.processWithdrawal();
                break;
            case 'deposit':
                this.processDeposit();
                break;
            case 'pin':
                if (this.currentScreen === 'pin' && this.enteredPin.length === 4) {
                    this.confirmPin();
                }
                break;
        }
    }
    
    static cancelAction() {
        switch(this.currentScreen) {
            case 'withdraw':
            case 'deposit':
            case 'pin':
                this.showScreen('menu');
                break;
        }
    }
    
    static processWithdrawal() {
        if (this.currentAmount <= 0) {
            this.speak('Please enter a valid amount to withdraw.');
            this.playSound('errorSound');
            return;
        }
        
        if (this.currentAmount > this.userBalance) {
            this.speak(`Insufficient funds. Your balance is ${this.formatCurrency(this.userBalance)}. Please enter a smaller amount.`);
            this.playSound('errorSound');
            return;
        }
        
        if (this.currentAmount > 100000) {
            this.speak('Maximum withdrawal amount is 100,000 Naira. Please enter a smaller amount.');
            this.playSound('errorSound');
            return;
        }
        
        // Process withdrawal
        this.userBalance -= this.currentAmount;
        this.playSound('cashSound');
        
        // Add to transaction history
        this.addTransaction('Withdrawal', -this.currentAmount);
        
        // Show success screen
        this.showResultScreen(
            'Withdrawal Successful',
            `You have withdrawn ${this.formatCurrency(this.currentAmount)}.`,
            `Your new balance is ${this.formatCurrency(this.userBalance)}.`,
            'success'
        );
        
        // Update localStorage
        this.saveToLocalStorage();
    }
    
    static processDeposit() {
        if (this.currentAmount <= 0) {
            this.speak('Please enter a valid amount to deposit.');
            this.playSound('errorSound');
            return;
        }
        
        if (this.currentAmount > 500000) {
            this.speak('Maximum deposit amount is 500,000 Naira. Please enter a smaller amount.');
            this.playSound('errorSound');
            return;
        }
        
        // Process deposit
        this.userBalance += this.currentAmount;
        this.playSound('confirmSound');
        
        // Add to transaction history
        this.addTransaction('Deposit', this.currentAmount);
        
        // Show success screen
        this.showResultScreen(
            'Deposit Successful',
            `You have deposited ${this.formatCurrency(this.currentAmount)}.`,
            `Your new balance is ${this.formatCurrency(this.userBalance)}.`,
            'success'
        );
        
        // Update localStorage
        this.saveToLocalStorage();
    }
    
    static showResultScreen(title, message, details, type = 'success') {
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;
        
        const resultIcon = document.getElementById('resultIcon');
        const resultDetails = document.getElementById('resultDetails');
        
        // Update icon based on type
        if (type === 'success') {
            resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            resultIcon.style.color = '#10b981';
        } else if (type === 'error') {
            resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            resultIcon.style.color = '#ef4444';
        }
        
        // Update details
        resultDetails.innerHTML = `
            <div class="detail">
                <span>New Balance:</span>
                <strong>${this.formatCurrency(this.userBalance)}</strong>
            </div>
            <div class="detail">
                <span>Transaction ID:</span>
                <strong>TX-${Date.now().toString().slice(-6)}</strong>
            </div>
            <div class="detail">
                <span>Time:</span>
                <strong>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
            </div>
        `;
        
        // Speak result
        this.speak(`${title}. ${message} ${details}`);
        
        this.showScreen('result');
    }
    
    static exitATM() {
        this.playSound('cardSound');
        this.speak('Thank you for using VoiceBank ATM. Please remember to take your card. Goodbye.');
        
        // Reset PIN
        this.enteredPin = '';
        this.updatePinDisplay();
        
        // Return to welcome screen after delay
        setTimeout(() => {
            this.showScreen('welcome');
            this.speak('Welcome to VoiceBank ATM. Say "start" or "begin" to insert your card and begin banking.');
        }, 2000);
    }
    
    static goBack() {
        if (this.currentScreen === 'menu') {
            this.exitATM();
        } else {
            this.showScreen('menu');
        }
    }
    
    static proceedTransaction() {
        // Implementation depends on current state
        this.speak('Please specify what you would like to do.');
    }
    
    static finishTransaction() {
        this.showScreen('menu');
        this.speak('Transaction completed. What would you like to do next?');
    }
    
    static addTransaction(type, amount) {
        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            date: new Date().toLocaleString(),
            balance: this.userBalance
        };
        
        this.transactionHistory.unshift(transaction);
        
        // Keep only last 10 transactions
        if (this.transactionHistory.length > 10) {
            this.transactionHistory = this.transactionHistory.slice(0, 10);
        }
        
        this.saveToLocalStorage();
    }
    
    static createSampleHistory() {
        const sampleTransactions = [
            { type: 'Deposit', amount: 50000, date: '2024-01-15 10:30 AM', balance: 50000 },
            { type: 'Withdrawal', amount: -5000, date: '2024-01-16 02:15 PM', balance: 45000 },
            { type: 'Withdrawal', amount: -10000, date: '2024-01-18 11:45 AM', balance: 35000 },
            { type: 'Deposit', amount: 20000, date: '2024-01-20 09:20 AM', balance: 55000 },
            { type: 'Withdrawal', amount: -15000, date: '2024-01-22 03:30 PM', balance: 40000 }
        ];
        
        sampleTransactions.forEach(tx => {
            this.transactionHistory.push({
                id: Date.now() - Math.floor(Math.random() * 1000000),
                ...tx
            });
        });
        
        this.saveToLocalStorage();
    }
    
    static displayTransactionHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.transactionHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-item">
                    <div class="transaction-info">
                        <h4>No transactions yet</h4>
                        <p class="date">Start banking to see your history</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.transactionHistory.forEach(transaction => {
            const amountClass = transaction.amount > 0 ? 'positive' : 'negative';
            const amountSign = transaction.amount > 0 ? '+' : '';
            
            html += `
                <div class="history-item">
                    <div class="transaction-info">
                        <h4>${transaction.type}</h4>
                        <p class="date">${transaction.date}</p>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}${this.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
    }
    
    static loadTransactionHistory() {
        // Already loaded from localStorage in init
        this.displayTransactionHistory();
    }
    
    static updateBalanceDisplay() {
        const balanceElements = [
            document.getElementById('menuBalance'),
            document.getElementById('balanceAmount')
        ];
        
        balanceElements.forEach(element => {
            if (element) {
                element.textContent = this.formatCurrency(this.userBalance);
            }
        });
        
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = 'Just now';
        }
    }
    
    static updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }
    
    static formatCurrency(amount) {
        return Math.abs(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
    
    static speak(text) {
        if (!this.isVoiceEnabled || this.isMuted) return;
        
        // Cancel any ongoing speech
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSpeed;
        utterance.volume = this.volume;
        utterance.pitch = 1.0;
        
        // Set voice gender
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let preferredVoice;
            if (this.voiceGender === 'female') {
                preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.includes('Female') || voice.name.includes('woman') || voice.name.includes('Woman'))
                );
            } else {
                preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.includes('Male') || voice.name.includes('man') || voice.name.includes('Man'))
                );
            }
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        this.currentUtterance = utterance;
        this.speechSynthesis.speak(utterance);
        
        // Update voice status indicator
        this.updateSpeechIndicator(true);
        
        utterance.onend = () => {
            this.updateSpeechIndicator(false);
        };
    }
    
    static updateSpeechIndicator(isSpeaking) {
        const indicator = document.querySelector('.voice-active .dot');
        if (indicator) {
            if (isSpeaking) {
                indicator.style.animation = 'pulse 0.5s infinite';
            } else {
                indicator.style.animation = 'none';
            }
        }
    }
    
    static repeatInstruction() {
        if (this.currentUtterance && this.isVoiceEnabled) {
            this.speak(this.currentUtterance.text);
        }
    }
    
    static toggleVoice() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        const toggleBtn = document.getElementById('toggleVoice');
        
        if (this.isVoiceEnabled) {
            toggleBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Voice On</span>';
            this.speak('Voice guidance enabled.');
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Voice Off</span>';
            if (this.speechSynthesis.speaking) {
                this.speechSynthesis.cancel();
            }
        }
        
        this.saveToLocalStorage();
    }
    
    static toggleMute() {
        this.isMuted = !this.isMuted;
        this.speak(this.isMuted ? 'Audio muted' : 'Audio unmuted');
    }
    
    static increaseVolume() {
        this.volume = Math.min(1, this.volume + 0.1);
        document.getElementById('volumeSlider').value = this.volume * 100;
        this.initAudio();
        this.speak(`Volume increased to ${Math.round(this.volume * 100)} percent`);
    }
    
    static decreaseVolume() {
        this.volume = Math.max(0, this.volume - 0.1);
        document.getElementById('volumeSlider').value = this.volume * 100;
        this.initAudio();
        this.speak(`Volume decreased to ${Math.round(this.volume * 100)} percent`);
    }
    
    static showHelp() {
        const voiceHelp = document.getElementById('voiceHelp');
        if (voiceHelp) {
            voiceHelp.style.display = 'block';
            this.speak('Showing voice commands. You can say things like "withdraw", "deposit", "balance", or specific amounts.');
        }
    }
    
    static hideHelp() {
        const voiceHelp = document.getElementById('voiceHelp');
        if (voiceHelp) {
            voiceHelp.style.display = 'none';
        }
    }
    
    static showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
            this.loadSettingsToUI();
        }
    }
    
    static hideSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }
    
    static loadSettingsToUI() {
        document.getElementById('voiceSpeed').value = this.voiceSpeed;
        document.getElementById('speedValue').textContent = 
            this.voiceSpeed === 1 ? 'Normal' : 
            this.voiceSpeed < 1 ? 'Slow' : 'Fast';
        
        document.getElementById('highContrast').checked = localStorage.getItem('highContrast') === 'true';
        document.getElementById('largeText').checked = localStorage.getItem('largeText') === 'true';
        document.getElementById('audioConfirm').checked = !this.isMuted;
        document.getElementById('voiceGender').value = this.voiceGender;
    }
    
    static saveSettings() {
        this.voiceSpeed = parseFloat(document.getElementById('voiceSpeed').value);
        this.isMuted = !document.getElementById('audioConfirm').checked;
        this.voiceGender = document.getElementById('voiceGender').value;
        
        // Apply high contrast
        if (document.getElementById('highContrast').checked) {
            document.body.classList.add('high-contrast');
            localStorage.setItem('highContrast', 'true');
        } else {
            document.body.classList.remove('high-contrast');
            localStorage.setItem('highContrast', 'false');
        }
        
        // Apply large text
        if (document.getElementById('largeText').checked) {
            document.body.classList.add('large-text');
            localStorage.setItem('largeText', 'true');
        } else {
            document.body.classList.remove('large-text');
            localStorage.setItem('largeText', 'false');
        }
        
        this.saveToLocalStorage();
        this.hideSettings();
        this.speak('Settings saved successfully.');
    }
    
    static resetSettings() {
        // Reset to defaults
        this.voiceSpeed = 1.0;
        this.isMuted = false;
        this.voiceGender = 'female';
        
        // Remove CSS classes
        document.body.classList.remove('high-contrast', 'large-text');
        
        // Clear localStorage settings
        localStorage.removeItem('highContrast');
        localStorage.removeItem('largeText');
        
        // Update UI
        this.loadSettingsToUI();
        this.speak('Settings reset to default values.');
    }
    
    static playSound(soundId) {
        if (this.isMuted) return;
        
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    static handleVoiceAction(command) {
        switch(command) {
            case 'confirm':
                this.confirmAction();
                break;
            case 'cancel':
                this.cancelAction();
                break;
            case 'menu':
                this.showScreen('menu');
                break;
            case 'repeat':
                this.repeatInstruction();
                break;
            case 'clear history':
                this.clearHistory();
                break;
            case 'exit':
                this.exitATM();
                break;
        }
    }
    
    static clearHistory() {
        if (confirm('Are you sure you want to clear your transaction history?')) {
            this.transactionHistory = [];
            this.displayTransactionHistory();
            this.saveToLocalStorage();
            this.speak('Transaction history cleared.');
            this.playSound('confirmSound');
        }
    }
    
    static saveToLocalStorage() {
        const data = {
            userBalance: this.userBalance,
            currentPin: this.currentPin,
            transactionHistory: this.transactionHistory,
            isVoiceEnabled: this.isVoiceEnabled,
            voiceSpeed: this.voiceSpeed,
            voiceGender: this.voiceGender,
            volume: this.volume
        };
        
        localStorage.setItem('atmData', JSON.stringify(data));
    }
    
    static loadFromLocalStorage() {
        const savedData = localStorage.getItem('atmData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                this.userBalance = data.userBalance || this.userBalance;
                this.currentPin = data.currentPin || this.currentPin;
                this.transactionHistory = data.transactionHistory || this.transactionHistory;
                this.isVoiceEnabled = data.isVoiceEnabled !== undefined ? data.isVoiceEnabled : this.isVoiceEnabled;
                this.voiceSpeed = data.voiceSpeed || this.voiceSpeed;
                this.voiceGender = data.voiceGender || this.voiceGender;
                this.volume = data.volume || this.volume;
                
                // Apply stored volume
                document.getElementById('volumeSlider').value = this.volume * 100;
                
                // Apply accessibility settings
                if (localStorage.getItem('highContrast') === 'true') {
                    document.body.classList.add('high-contrast');
                }
                
                if (localStorage.getItem('largeText') === 'true') {
                    document.body.classList.add('large-text');
                }
                
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }
}

// Initialize ATM when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ATM.init();
    
    // Initialize speech synthesis voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded:', speechSynthesis.getVoices().length);
        };
    }
});

// Make ATM globally accessible
window.ATM = ATM;

// Add keyboard shortcuts for accessibility
document.addEventListener('keydown', (e) => {
    // Ctrl+H for help
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        ATM.showHelp();
    }
    
    // Ctrl+M for menu
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        ATM.showScreen('menu');
    }
    
    // Ctrl+Q to quit/exit
    if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        ATM.exitATM();
    }
    
    // Space to repeat instruction
    if (e.key === ' ') {
        e.preventDefault();
        ATM.repeatInstruction();
    }
    
    // Escape to cancel/go back
    if (e.key === 'Escape') {
        e.preventDefault();
        ATM.cancelAction();
    }
});