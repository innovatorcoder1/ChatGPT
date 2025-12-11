// --- CONFIGURATION ---
const N8N_WEBHOOK_URL = 'https://codewarcollege.app.n8n.cloud/webhook-test/registrationform';
// ---------------------

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const initialPrompt = document.querySelector('.initial-prompt');

// 1. Helper function to create a message element
function createMessageElement(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const icon = document.createElement('div');
    icon.classList.add('message-icon');
    icon.textContent = sender === 'user' ? 'U' : 'AI';

    const content = document.createElement('div');
    content.classList.add('message-content');
    content.textContent = text;

    messageDiv.appendChild(icon);
    messageDiv.appendChild(content);

    return messageDiv;
}

// 2. Typing Indicator
let typingIndicator = null;

function showTypingIndicator() {
    if (typingIndicator) return;

    typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'ai', 'typing-indicator');

    const icon = document.createElement('div');
    icon.classList.add('message-icon');
    icon.textContent = 'AI';
    typingIndicator.appendChild(icon);

    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('message-content');
    dotsContainer.innerHTML = `
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    `;
    typingIndicator.appendChild(dotsContainer);

    chatWindow.appendChild(typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// 3. Main send function
async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) return;

    // Clear input
    userInput.value = '';
    sendBtn.disabled = true;

    if (initialPrompt) initialPrompt.style.display = 'none';

    // Display user message
    chatWindow.appendChild(createMessageElement(query, 'user'));
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Show typing indicator
    showTypingIndicator();

    let aiResponse = "";

    try {
        // Send POST request to n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // Parse JSON
        let answer;
        try {
            answer = await response.json();
        } catch (jsonErr) {
            const raw = await response.text();
            aiResponse = `❌ Invalid JSON returned by backend: ${raw}`;
        }

        // Extract response safely
        if (answer) {
            aiResponse =
                answer.answer ||      // Expected structure
                answer.data?.answer ||     // Fallback if not_found
                "❌ Missing 'answer' field in n8n response.";
        }

    } catch (error) {
        aiResponse = `🛑 NETWORK ERROR: ${error.message}`;
        console.error("Fetch error:", error);
    }

    // Hide typing animation
    hideTypingIndicator();

    // Display AI response
    chatWindow.appendChild(createMessageElement(aiResponse, 'ai'));
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Re-enable send button
    sendBtn.disabled = false;
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
});

