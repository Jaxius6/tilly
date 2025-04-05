// Supabase Initialization
const SUPABASE_URL = 'https://avzgtvgeouacwgczjwut.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2emd0dmdlb3VhY3dnY3pqd3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQ0NzEsImV4cCI6MjA1OTM5MDQ3MX0.j-zSlmGjTQdfBW-ZNjrzjinVlOE0Ym8ZfjoSz8DPgOU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Use window.supabase

// DOM Elements - Auth
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const userEmailDisplay = document.getElementById('user-email-display');

// DOM Elements - Chat
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// App State
let currentUser = null;
// Webhook URL (Keep existing)
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
    console.log(`Sending to webhook: ${WEBHOOK_URL} with message: ${message}`); // Log before fetch

    
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

        // Log raw and parsed response for debugging
        console.log('Raw response text:', responseText);
        console.log('Parsed response data:', responseDataText);

        // Return the processed text. Loading is hidden in handleUserInput
        return responseDataText || "I received your message but didn't get a proper response.";
    } catch (error) {
        // Loading is hidden in handleUserInput
        console.error('Error sending/receiving webhook data:', error);
        console.error('Error sending/receiving webhook data:', error);
        return `Sorry, I encountered an error: ${error.message}`;
    }
}

// Handle user input
async function handleUserInput() {
    console.log("handleUserInput called. Current user:", currentUser); // Log user state
    if (!currentUser) {
        console.log("User not logged in, aborting message send.");
        // Optionally add an alert here if needed
        // alert("Please log in to send messages.");
        return; // Exit if not logged in
    }

    const message = userInput.value.trim();
    if (!message) {
        console.log("Empty message, aborting.");
        return; // Exit if message is empty
    }
    console.log("User message:", message); // Log the message being sent

    addMessage(message, true);
    userInput.value = '';

    const botResponse = await sendToWebhook(message);
    hideLoading(); // Hide loading AFTER getting the response
    addMessage(botResponse, false); // Add the actual response message
}

// --- Authentication Logic ---

async function handleLogin() {
    console.log("Attempting login...");
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || !password) {
        alert("Please enter both email and password.");
        console.log("Login aborted: Missing email or password.");
        return;
    }
    console.log(`Login details: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert(`Login Error: ${error.message}`);
        console.error('Login Error:', error);
    } else if (data.user) {
        console.log('Logged in:', data.user);
        // updateUserAuthState will handle UI changes via onAuthStateChange
    } else {
        alert('Login failed. Please check your credentials.'); // Fallback
    }
}

async function handleSignup() {
    console.log("Attempting signup...");
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
     if (!email || !password) {
        alert("Please enter both email and password.");
        console.log("Signup aborted: Missing email or password.");
        return;
    }
    console.log(`Signup details: ${email}`);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        alert(`Signup Error: ${error.message}`);
        console.error('Signup Error:', error);
    } else {
         // Check if email confirmation is required (depends on Supabase settings)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
             alert('Signup successful! Please check your email to confirm your account.');
        } else if (data.user) {
            alert('Signup successful! You are now logged in.');
        } else {
             alert('Signup successful! Please check your email to confirm your account.'); // Default message if user object is unexpected
        }
        // updateUserAuthState will handle UI changes via onAuthStateChange
    }
}

async function handleLogout() {
    console.log("Attempting logout...");
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert(`Logout Error: ${error.message}`);
        console.error('Logout Error:', error);
    } else {
        console.log('Logged out');
        // updateUserAuthState will handle UI changes via onAuthStateChange
    }
}

// Updates UI based on user's authentication status
function updateUserAuthState(user) {
    console.log("Updating auth state. User:", user);
    currentUser = user; // Store current user globally
    if (user) {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        userEmailDisplay.textContent = `Logged in as: ${user.email}`;
        // TODO: Load user's chat history
        chatMessages.innerHTML = ''; // Clear messages on login/logout for now
        addMessage(`Welcome back!`, false); // Add welcome message
    } else {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        userEmailDisplay.textContent = '';
        // TODO: Clear chat history UI
         chatMessages.innerHTML = ''; // Clear messages on login/logout for now
         addMessage("Please log in or sign up to start chatting.", false); // Add login prompt
    }
    // Enable/disable chat input based on auth state
    userInput.disabled = !user;
    sendButton.disabled = !user;
    userInput.placeholder = user ? "Ask Tilly anything..." : "Login required";
}

// --- Event Listeners ---

// Auth Buttons
loginButton.addEventListener('click', handleLogin);
signupButton.addEventListener('click', handleSignup);
logoutButton.addEventListener('click', handleLogout);

// Chat Input (Keep existing listeners)
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !userInput.disabled) { // Check if disabled
        handleUserInput();
    }
});


// --- Initialization ---

// Initial auth state check and listener setup
document.addEventListener('DOMContentLoaded', async () => {
    // Check initial auth state when the page loads
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting session:", error);
        updateUserAuthState(null); // Assume logged out on error
    } else {
         updateUserAuthState(session?.user ?? null);
    }

     // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, session);
        updateUserAuthState(session?.user ?? null);
    });

    // Note: Initial greeting is now handled within updateUserAuthState based on login status
});