// --- CONFIGURATION ---
// !! REPLACE THIS WITH YOUR ACTUAL N8N WEBHOOK URL !!
const N8N_WEBHOOK_URL = 'https://codewarcollege.app.n8n.cloud/webhook/404757f2-ee41-43bd-8692-d7051889f1f8'; 
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
    // Check if the indicator is already visible
    if (typingIndicator) return;
    
    typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'ai', 'typing-indicator');

    const icon = document.createElement('div');
    icon.classList.add('message-icon');
    icon.textContent = 'AI';
    typingIndicator.appendChild(icon);

    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('message-content');
    dotsContainer.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

    typingIndicator.appendChild(dotsContainer);
    chatWindow.appendChild(typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// 3. Main function to send the query
async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) return; // Do nothing if input is empty

    // 3.1. Clear input and hide initial prompt
    userInput.value = '';
    sendBtn.disabled = true; // Disable button immediately
    if (initialPrompt) initialPrompt.style.display = 'none';

    // 3.2. Display user message
    chatWindow.appendChild(createMessageElement(query, 'user'));
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom

    // 3.3. Show typing indicator
    showTypingIndicator();

    try {
        // 3.4. Send request to n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query }),
        });

        if (!response.ok) {
            // Handle HTTP error statuses (4xx, 5xx)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // --- NEW/MODIFIED SECTION FOR ERROR HANDLING ---
        let data;
        let aiResponse;
        
        try {
            data = await response.json();
            
            // Check for the expected key 'answer'
            aiResponse = data.answer || "❌ n8n Error: Data found but key 'answer' is missing or empty. Check your n8n 'Set' node.";

        } catch (jsonError) {
            // Handle 'Unexpected end of JSON input' error
            const rawText = await response.text();
            aiResponse = `⚠️ JSON Parse Error: n8n returned non-JSON data. Raw response starts with: "${rawText.substring(0, 100)}..."`;
            console.error('JSON Parsing Failed:', jsonError, 'Raw Text:', rawText);
        }
        // --- END OF NEW/MODIFIED SECTION ---

        // 3.5. Hide indicator and display AI response
        hideTypingIndicator();
        chatWindow.appendChild(createMessageElement(aiResponse, 'ai'));

    } catch (error) {
        // 3.6. Handle general fetch errors (Failed to fetch) or HTTP errors
        console.error('Error sending message:', error);
        hideTypingIndicator();
        chatWindow.appendChild(createMessageElement(`🛑 FETCH/HTTP ERROR: Failed to communicate with n8n. Details: ${error.message}. Check the webhook URL and n8n status.`, 'ai'));
    }

    // 3.7. Scroll to bottom after response
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 4. Event Listeners

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Enter key press in the input field
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        e.preventDefault(); // Prevent new line in some browsers
        sendMessage();
    }
});

// Enable/Disable send button based on input value
userInput.addEventListener('input', () => {
    // Enable button only if the input has non-whitespace characters
    sendBtn.disabled = userInput.value.trim() === '';
});
