const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Webhook URL from the task
const WEBHOOK_URL = 'https://intent-seagull-tightly.ngrok-free.app/webhook/a02d4c2b-42d8-46fe-b286-6776ab37b114';

// Add a message to the chat
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading indicator
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message');
    loadingDiv.id = 'loading';
    const loadingSpan = document.createElement('span');
    loadingSpan.classList.add('loading');
    loadingDiv.appendChild(loadingSpan);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide loading indicator
function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Send message to webhook
async function sendToWebhook(message) {
    showLoading();
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let responseDataText;
        const responseText = await response.text();

        // First try to parse as JSON
        try {
            const jsonData = JSON.parse(responseText);
            // Specifically look for the 'output' key
            if (jsonData && typeof jsonData === 'object' && jsonData.output) {
                responseDataText = jsonData.output;
            } else if (jsonData && typeof jsonData === 'object') {
                 // Fallback for other common keys or stringify
                if (jsonData.responseText) responseDataText = jsonData.responseText;
                else if (jsonData.response) responseDataText = jsonData.response;
                else if (jsonData.text) responseDataText = jsonData.text;
                else if (jsonData.message) responseDataText = jsonData.message;
                else responseDataText = JSON.stringify(jsonData); // Stringify if 'output' or other known keys aren't present
            } else {
                 // Handle cases where parsing results in non-object (e.g., just a string/number)
                 responseDataText = responseText;
            }
        } catch (e) {
            // If not valid JSON, use the raw text
            responseDataText = responseText;
        }

        // Return the processed text. Loading is hidden in handleUserInput
        return responseDataText || "I received your message but didn't get a proper response.";
    } catch (error) {
        // Loading is hidden in handleUserInput
        console.error('Error sending/receiving webhook data:', error);
        return `Sorry, I encountered an error: ${error.message}`;
    }
}

// Handle user input
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    const botResponse = await sendToWebhook(message);
    hideLoading(); // Hide loading AFTER getting the response
    addMessage(botResponse, false); // Add the actual response message
}

// Event listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Initial bot greeting
addMessage("Hello! How can I help you today?", false);