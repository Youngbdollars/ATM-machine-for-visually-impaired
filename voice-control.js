// Voice Control Module for ATM
class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.lastCommand = '';
        this.commandHistory = [];
        this.maxHistory = 10;
        
        // Voice command mappings
        this.commands = {
            // Navigation commands
            'start': 'beginTransaction',
            'begin': 'beginTransaction',
            'insert card': 'beginTransaction',
            'menu': 'showMenu',
            'back': 'goBack',
            'exit': 'exitATM',
            'cancel': 'cancelAction',
            
            // PIN entry
            'zero': 'enterDigit:0',
            'one': 'enterDigit:1',
            'two': 'enterDigit:2',
            'three': 'enterDigit:3',
            'four': 'enterDigit:4',
            'five': 'enterDigit:5',
            'six': 'enterDigit:6',
            'seven': 'enterDigit:7',
            'eight': 'enterDigit:8',
            'nine': 'enterDigit:9',
            'clear': 'clearPin',
            'delete': 'backspace',
            'confirm': 'confirmPin',
            
            // Menu options
            'withdraw': 'selectWithdraw',
            'withdrawal': 'selectWithdraw',
            'cash': 'selectWithdraw',
            'deposit': 'selectDeposit',
            'balance': 'selectBalance',
            'check balance': 'selectBalance',
            'change pin': 'selectChangePin',
            'history': 'selectHistory',
            'transaction history': 'selectHistory',
            
            // Amounts
            'thousand': 'enterAmount:1000',
            'two thousand': 'enterAmount:2000',
            'three thousand': 'enterAmount:3000',
            'four thousand': 'enterAmount:4000',
            'five thousand': 'enterAmount:5000',
            'ten thousand': 'enterAmount:10000',
            'twenty thousand': 'enterAmount:20000',
            'fifty thousand': 'enterAmount:50000',
            'hundred thousand': 'enterAmount:100000',
            
            // Confirmation
            'yes': 'confirmAction',
            'yeah': 'confirmAction',
            'okay': 'confirmAction',
            'ok': 'confirmAction',
            'no': 'cancelAction',
            'nope': 'cancelAction',
            
            // Help
            'help': 'showHelp',
            'commands': 'showHelp',
            'repeat': 'repeatInstruction',
            'what can i say': 'showHelp',
            
            // Settings
            'voice off': 'toggleVoice',
            'voice on': 'toggleVoice',
            'mute': 'toggleMute',
            'unmute': 'toggleMute',
            'volume up': 'increaseVolume',
            'volume down': 'decreaseVolume',
            
            // Transaction actions
            'proceed': 'proceedTransaction',
            'finish': 'finishTransaction',
            'done': 'finishTransaction',
            
            // Numbers for amounts
            'hundred': 'enterAmount:100',
            'two hundred': 'enterAmount:200',
            'three hundred': 'enterAmount:300',
            'four hundred': 'enterAmount:400',
            'five hundred': 'enterAmount:500',
            'six hundred': 'enterAmount:600',
            'seven hundred': 'enterAmount:700',
            'eight hundred': 'enterAmount:800',
            'nine hundred': 'enterAmount:900'
        };
        
        this.numberWords = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90
        };
        
        this.init();
    }
    
    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('Voice recognition started');
                this.isListening = true;
                this.updateVoiceStatus(true);
                this.showVoiceFeedback('Listening...', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
                console.log('Heard:', transcript);
                
                this.lastCommand = transcript;
                this.commandHistory.unshift(transcript);
                if (this.commandHistory.length > this.maxHistory) {
                    this.commandHistory.pop();
                }
                
                this.processCommand(transcript);
                this.showVoiceFeedback(`Heard: "${transcript}"`, 'success');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showVoiceFeedback('Sorry, I didn\'t catch that. Please try again.', 'error');
                
                if (event.error === 'no-speech') {
                    // Restart listening if no speech detected
                    setTimeout(() => {
                        if (this.isListening) {
                            this.startListening();
                        }
                    }, 1000);
                }
            };
            
            this.recognition.onend = () => {
                console.log('Voice recognition ended');
                this.isListening = false;
                this.updateVoiceStatus(false);
                
                // Restart listening if still supposed to be listening
                setTimeout(() => {
                    if (this.shouldBeListening) {
                        this.startListening();
                    }
                }, 100);
            };
            
            console.log('Voice recognition initialized');
        } else {
            console.error('Speech recognition not supported');
            this.showVoiceFeedback('Voice recognition not supported in your browser', 'error');
        }
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.shouldBeListening = true;
                this.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                setTimeout(() => this.startListening(), 100);
            }
        }
    }
    
    stopListening() {
        this.shouldBeListening = false;
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    updateVoiceStatus(isActive) {
        const voiceStatus = document.getElementById('voiceStatus');
        const statusText = voiceStatus.querySelector('.status-text');
        
        if (isActive) {
            voiceStatus.style.display = 'flex';
            statusText.textContent = 'Listening...';
            voiceStatus.classList.add('active');
        } else {
            voiceStatus.style.display = 'none';
            voiceStatus.classList.remove('active');
        }
    }
    
    showVoiceFeedback(message, type = 'info') {
        const feedbackElement = document.getElementById('recognitionResult');
        if (!feedbackElement) return;
        
        const resultText = feedbackElement.querySelector('.result-text');
        if (resultText) {
            resultText.textContent = message;
            resultText.className = 'result-text';
            
            switch(type) {
                case 'success':
                    resultText.style.color = '#10b981';
                    break;
                case 'error':
                    resultText.style.color = '#ef4444';
                    break;
                case 'info':
                    resultText.style.color = '#60a5fa';
                    break;
            }
        }
        
        // Create visual feedback
        this.createVoiceWave();
    }
    
    createVoiceWave() {
        const particles = document.getElementById('particles');
        if (!particles) return;
        
        const wave = document.createElement('div');
        wave.className = 'voice-wave';
        wave.style.cssText = `
            position: absolute;
            width: 100px;
            height: 100px;
            border: 2px solid #2563eb;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: voiceWave 1s ease-out forwards;
            pointer-events: none;
        `;
        
        particles.appendChild(wave);
        
        setTimeout(() => {
            if (wave.parentNode === particles) {
                particles.removeChild(wave);
            }
        }, 1000);
    }
    
    processCommand(command) {
        // Clean and normalize command
        command = command.toLowerCase().trim();
        
        // Check for exact matches first
        if (this.commands[command]) {
            this.executeCommand(this.commands[command]);
            return;
        }
        
        // Check for partial matches
        for (const [key, action] of Object.entries(this.commands)) {
            if (command.includes(key)) {
                this.executeCommand(action);
                return;
            }
        }
        
        // Try to parse amounts
        if (this.parseAmount(command)) {
            return;
        }
        
        // Check for number sequences (for PIN)
        if (this.parseNumberSequence(command)) {
            return;
        }
        
        // If no match found
        this.showVoiceFeedback(`I heard "${command}". Try saying "help" for available commands.`, 'error');
        ATM.speak(`I heard "${command}". Please try again or say "help" for available commands.`);
    }
    
    parseAmount(command) {
        // Try to parse spoken amounts like "five thousand five hundred"
        const words = command.split(' ');
        let amount = 0;
        let currentNumber = 0;
        
        for (const word of words) {
            if (word === 'and') continue;
            
            if (this.numberWords[word] !== undefined) {
                currentNumber += this.numberWords[word];
            } else if (word === 'hundred' && currentNumber !== 0) {
                currentNumber *= 100;
            } else if (word === 'thousand' && currentNumber !== 0) {
                currentNumber *= 1000;
                amount += currentNumber;
                currentNumber = 0;
            } else if (word === 'million' && currentNumber !== 0) {
                currentNumber *= 1000000;
                amount += currentNumber;
                currentNumber = 0;
            }
        }
        
        amount += currentNumber;
        
        if (amount > 0) {
            this.enterAmount(amount);
            return true;
        }
        
        return false;
    }
    
    parseNumberSequence(command) {
        // Extract digits from command for PIN entry
        const digitPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g;
        const matches = [...command.matchAll(digitPattern)];
        
        if (matches.length > 0) {
            const digits = matches.map(match => this.numberWords[match[0]]);
            digits.forEach(digit => {
                ATM.enterPinDigit(digit.toString());
            });
            return true;
        }
        
        // Also check for direct numbers
        const numberPattern = /\b(\d)\b/g;
        const numberMatches = [...command.matchAll(numberPattern)];
        
        if (numberMatches.length > 0) {
            numberMatches.forEach(match => {
                ATM.enterPinDigit(match[0]);
            });
            return true;
        }
        
        return false;
    }
    
    executeCommand(action) {
        const [method, param] = action.split(':');
        
        switch(method) {
            case 'beginTransaction':
                ATM.beginTransaction();
                break;
            case 'showMenu':
                ATM.showScreen('menu');
                break;
            case 'goBack':
                ATM.goBack();
                break;
            case 'exitATM':
                ATM.exitATM();
                break;
            case 'cancelAction':
                ATM.cancelAction();
                break;
            case 'enterDigit':
                ATM.enterPinDigit(param);
                break;
            case 'clearPin':
                ATM.clearPin();
                break;
            case 'backspace':
                ATM.backspacePin();
                break;
            case 'confirmPin':
                ATM.confirmPin();
                break;
            case 'selectWithdraw':
                ATM.showScreen('withdraw');
                break;
            case 'selectDeposit':
                ATM.showScreen('deposit');
                break;
            case 'selectBalance':
                ATM.showScreen('balance');
                break;
            case 'selectChangePin':
                ATM.showScreen('changePin');
                break;
            case 'selectHistory':
                ATM.showScreen('history');
                break;
            case 'enterAmount':
                this.enterAmount(parseInt(param));
                break;
            case 'confirmAction':
                ATM.confirmAction();
                break;
            case 'showHelp':
                this.showHelp();
                break;
            case 'repeatInstruction':
                ATM.repeatInstruction();
                break;
            case 'toggleVoice':
                ATM.toggleVoice();
                break;
            case 'toggleMute':
                ATM.toggleMute();
                break;
            case 'increaseVolume':
                ATM.increaseVolume();
                break;
            case 'decreaseVolume':
                ATM.decreaseVolume();
                break;
            case 'proceedTransaction':
                ATM.proceedTransaction();
                break;
            case 'finishTransaction':
                ATM.finishTransaction();
                break;
        }
    }
    
    enterAmount(amount) {
        const currentScreen = ATM.currentScreen;
        
        if (currentScreen === 'withdraw' || currentScreen === 'deposit') {
            ATM.setAmount(amount);
            ATM.speak(`Amount set to ${ATM.formatCurrency(amount)}. Say "confirm" to proceed or say another amount.`);
        }
    }
    
    showHelp() {
        const voiceHelp = document.getElementById('voiceHelp');
        if (voiceHelp) {
            voiceHelp.style.display = 'block';
            ATM.speak('Showing voice commands. You can say things like "withdraw", "deposit", "balance", or specific amounts.');
        }
    }
}

// Add CSS for voice wave animation
const style = document.createElement('style');
style.textContent = `
    @keyframes voiceWave {
        0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
    
    .voice-wave {
        z-index: 1;
    }
`;
document.head.appendChild(style);

// Initialize voice controller
let voiceController;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    voiceController = new VoiceController();
    
    // Start listening after a short delay
    setTimeout(() => {
        voiceController.startListening();
        ATM.speak('Welcome to VoiceBank ATM. Say "start" or "begin" to insert your card and begin banking.');
    }, 1000);
});

// Make voice controller globally accessible
window.VoiceController = voiceController;