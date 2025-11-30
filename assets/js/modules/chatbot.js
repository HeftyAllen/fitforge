// assets/js/modules/chatbot.js
import GymAppConfig from '../../config/api.js';

class FitForgeChatbot {
  constructor() {
    this.currentChatId = null;
    this.chats = [];
    this.isLoading = false;
    this.firestore = null;
    this.auth = null;
    this.storage = null;
    this.user = null;
    this.recognition = null;
    this.isListening = false;

    // DOM references (filled on init)
    this.refs = {};

    // Start
    this.setupDomRefs();
    this.initializeFirebase();
    this.initializeEventListeners();
    this.initializeFileInput();
    this.initializeVoiceRecognition();
  }

  setupDomRefs() {
    // get DOM refs safely
    this.refs.messageInput = document.getElementById('message-input');
    this.refs.sendBtn = document.getElementById('send-btn');
    this.refs.newChatBtn = document.getElementById('new-chat-btn');
    this.refs.clearHistoryBtn = document.getElementById('clear-history-btn');
    this.refs.voiceBtn = document.getElementById('voice-input-btn');
    this.refs.attachBtn = document.getElementById('attach-btn');
    this.refs.chatMessages = document.getElementById('chat-messages');
    this.refs.chatHistoryList = document.getElementById('chat-history-list');
    this.refs.quickActions = document.getElementById('quick-actions');
  }

  async initializeFirebase() {
    try {
      // Defensive read of firebase config
      const firebaseConfig = {
        apiKey: GymAppConfig.firebase?.apiKey || GymAppConfig.FIREBASE_API_KEY || '',
        authDomain: GymAppConfig.firebase?.authDomain || GymAppConfig.FIREBASE_AUTH_DOMAIN || '',
        projectId: GymAppConfig.firebase?.projectId || GymAppConfig.FIREBASE_PROJECT_ID || '',
        storageBucket: GymAppConfig.firebase?.storageBucket || GymAppConfig.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: GymAppConfig.firebase?.messagingSenderId || GymAppConfig.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: GymAppConfig.firebase?.appId || GymAppConfig.FIREBASE_APP_ID || ''
      };

      if (!firebase || !firebase.initializeApp) {
        console.error('Firebase SDK not loaded. Make sure firebase-app-compat is included in the page.');
        this.showError('Firebase not available on this page.');
        return;
      }

      // initialize only once
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
      } else {
        // already initialized
      }

      // compat SDK usage
      this.firestore = firebase.firestore();
      this.auth = firebase.auth();
      this.storage = firebase.storage();

      // Sign in anonymously if no user (makes testing easier)
      this.auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.user = user;
          await this.loadChatHistory();
          if (this.chats.length > 0) {
            await this.loadChat(this.chats[0].id);
          } else {
            await this.startNewChat();
          }
        } else {
          // auto sign-in anonymously
          try {
            const { user: anonUser } = await this.auth.signInAnonymously();
            this.user = anonUser;
            await this.loadChatHistory();
            if (this.chats.length > 0) {
              await this.loadChat(this.chats[0].id);
            } else {
              await this.startNewChat();
            }
          } catch (anonErr) {
            console.warn('Anonymous sign-in failed:', anonErr);
          }
        }
      });

    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.showError('Failed to initialize chat service');
    }
  }

  initializeEventListeners() {
    // make sure refs exist
    const mi = this.refs.messageInput;
    const sendBtn = this.refs.sendBtn;

    if (mi) {
      mi.addEventListener('input', this.autoResizeTextarea.bind(this));
      mi.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Quick actions
    if (this.refs.quickActions) {
      this.refs.quickActions.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const prompt = btn.getAttribute('data-prompt') || btn.dataset.prompt;
          if (mi && typeof prompt === 'string') {
            mi.value = prompt;
            this.autoResizeTextarea();
            this.sendMessage();
          }
        });
      });
    }

    if (this.refs.newChatBtn) {
      this.refs.newChatBtn.addEventListener('click', () => this.startNewChat());
    }

    if (this.refs.clearHistoryBtn) {
      this.refs.clearHistoryBtn.addEventListener('click', () => this.clearChatHistory());
    }

    if (this.refs.voiceBtn) {
      this.refs.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    if (this.refs.attachBtn) {
      this.refs.attachBtn.addEventListener('click', () => this.triggerFileInput());
    }

    // ensure send button is enabled initially
    if (sendBtn) sendBtn.disabled = false;
  }

  initializeFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', (e) => this.handleFileUploadSelection(e));
    document.body.appendChild(this.fileInput);
  }

  // When a file is selected, show preview modal and confirm before uploading
  handleFileUploadSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // create simple modal preview
    const modal = this.createFilePreviewModal(file, async (shouldUpload) => {
      try {
        if (shouldUpload) {
          await this.uploadFileAndSendMessage(file);
        }
      } finally {
        modal.remove();
        this.fileInput.value = ''; // reset
      }
    });

    document.body.appendChild(modal);
  }

  createFilePreviewModal(file, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'ff-modal-overlay';
    overlay.style = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.45);z-index:9999;padding:16px;
    `;

    const box = document.createElement('div');
    box.className = 'ff-modal-box';
    box.style = `
      width:100%;max-width:720px;background:#fff;border-radius:8px;padding:16px;
      box-shadow:0 8px 30px rgba(0,0,0,0.25);color:#111;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Confirm attachment';
    title.style.marginTop = '0';
    box.appendChild(title);

    const info = document.createElement('p');
    info.textContent = `${file.name} — ${Math.round(file.size/1024)} KB`;
    box.appendChild(info);

    // preview for images
    if (/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
      const img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.borderRadius = '6px';
      img.src = URL.createObjectURL(file);
      box.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.textContent = 'Preview not available for this file type';
      icon.style.margin = '8px 0';
      box.appendChild(icon);
    }

    const controls = document.createElement('div');
    controls.style = 'display:flex;gap:8px;justify-content:flex-end;margin-top:12px';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => onClose(false));

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn btn-primary';
    uploadBtn.textContent = 'Upload & Send';
    uploadBtn.addEventListener('click', () => onClose(true));

    controls.appendChild(cancelBtn);
    controls.appendChild(uploadBtn);
    box.appendChild(controls);

    overlay.appendChild(box);
    return overlay;
  }

  async uploadFileAndSendMessage(file) {
    if (!this.user) {
      this.showError('You must be signed in to upload files.');
      return;
    }
    try {
      this.showLoading('Uploading file...');
      const filePath = `chat-attachments/${this.user.uid}/${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref().child(filePath);
      const snapshot = await fileRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();

      // Save message with attachment
      await this.saveMessage('user', `[File: ${file.name}]`, downloadURL);
      this.addFileMessageToUI(file.name, downloadURL);

      // Ask AI to analyze file
      await this.getAIResponse(`I've uploaded a file named ${file.name}. Please analyze it in the context of fitness or nutrition.`);
    } catch (err) {
      console.error('File upload error:', err);
      this.showError('Failed to upload file.');
    } finally {
      this.hideLoading();
    }
  }

  initializeVoiceRecognition() {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (this.refs.messageInput) {
            this.refs.messageInput.value = transcript;
            this.autoResizeTextarea();
          }
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.showError('Voice input failed. Please try again.');
          this.isListening = false;
          this.updateVoiceButton();
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.updateVoiceButton();
        };
      } else {
        console.info('SpeechRecognition not supported by this browser.');
      }
    } catch (e) {
      console.error('Voice init error', e);
    }
  }

  autoResizeTextarea() {
    const textarea = this.refs.messageInput;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  triggerFileInput() {
    this.fileInput.click();
  }

  async handleFileUpload(event) {
    // kept unused in favor of selection flow
  }

  toggleVoiceInput() {
    if (!this.recognition) {
      this.showError('Voice recognition not supported in your browser');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (err) {
        console.warn('Voice start error:', err);
        this.showError('Unable to start voice recognition');
      }
    }
    this.updateVoiceButton();
  }

  updateVoiceButton() {
    const voiceBtn = this.refs.voiceBtn;
    if (!voiceBtn) return;
    if (this.isListening) {
      voiceBtn.style.color = 'var(--error-500)';
      voiceBtn.innerHTML = '🎙️'; // simple indicator
    } else {
      voiceBtn.style.color = '';
      voiceBtn.innerHTML = '🎤';
    }
  }

  async sendMessage() {
    const messageInput = this.refs.messageInput;
    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (!message || this.isLoading) return;

    // Clear input and UI
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Ensure chat exists
    if (!this.currentChatId) {
      await this.startNewChat();
    }

    // Add locally to UI
    this.addMessageToUI('user', message);

    // show indicator
    this.showTypingIndicator();

    // Save to Firestore
    await this.saveMessage('user', message);

    // Ask AI
    await this.getAIResponse(message);
  }

  async getAIResponse(userMessage) {
    try {
      this.isLoading = true;
      this.updateSendButton(true);

      const conversationContext = await this.getConversationContext();

      const aiResponse = await this.callGeminiAI(userMessage, conversationContext);

      this.hideTypingIndicator();
      this.addMessageToUI('ai', aiResponse);
      await this.saveMessage('ai', aiResponse);
    } catch (error) {
      console.error('AI Response error:', error);
      this.hideTypingIndicator();
      this.addMessageToUI('ai', "Sorry — I'm having trouble processing that right now.");
    } finally {
      this.isLoading = false;
      this.updateSendButton(false);
    }
  }

  // Call Gemini — defensive key lookup
  async callGeminiAI(userMessage, context) {
    try {
      const aiKey =
        (GymAppConfig.aiApiKey) ||
        (GymAppConfig.ai && GymAppConfig.ai.apiKey) ||
        (GymAppConfig.AI_API_KEY) ||
        (GymAppConfig.places && GymAppConfig.places.apiKey);

      if (!aiKey) {
        console.error('No AI API key found in GymAppConfig. Please set GymAppConfig.aiApiKey.');
        throw new Error('AI API key missing.');
      }

      if (GymAppConfig.places && GymAppConfig.places.apiKey && GymAppConfig.places.apiKey === aiKey) {
        console.warn('AI key equals Google Places key — please separate keys (GymAppConfig.aiApiKey).');
      }

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(aiKey)}`;

      const contents = (context || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'system',
        parts: [{ text: msg.text }]
      }));

      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512
        }
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API non-ok response:', response.status, errText);
        throw new Error(`AI service error ${response.status}`);
      }

      const data = await response.json();
      // defensive parse
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else if (data?.outputs?.[0]?.content?.text) {
        // some responses might differ
        return data.outputs[0].content.text;
      } else {
        console.warn('Unexpected Gemini response:', data);
        throw new Error('Invalid AI response');
      }
    } catch (err) {
      console.error('Gemini API Error:', err);
      throw err;
    }
  }

  async getConversationContext() {
    if (!this.currentChatId || !this.firestore) return [];
    try {
      const messagesRef = this.firestore.collection('chats').doc(this.currentChatId).collection('messages');
      const snapshot = await messagesRef.orderBy('timestamp', 'asc').limit(10).get();
      return snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          sender: d.sender,
          text: d.text
        };
      });
    } catch (err) {
      console.error('Error getting conversation context:', err);
      return [];
    }
  }

  async startNewChat() {
    if (!this.firestore || !this.user) return;
    try {
      const chatData = {
        userId: this.user.uid,
        title: 'New Chat',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        messageCount: 0,
        lastMessage: 'Start a new conversation...'
      };
      const docRef = await this.firestore.collection('chats').add(chatData);
      this.currentChatId = docRef.id;
      this.clearChatMessages();
      this.addWelcomeMessage();
      await this.loadChatHistory();
    } catch (err) {
      console.error('Error creating new chat:', err);
      this.showError('Failed to start new chat');
    }
  }

  async saveMessage(sender, text, attachmentUrl = null) {
    if (!this.currentChatId || !this.firestore) return;
    try {
      const messageData = {
        sender,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ...(attachmentUrl && { attachmentUrl })
      };

      await this.firestore.collection('chats').doc(this.currentChatId).collection('messages').add(messageData);

      const updateData = {
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: text?.substring(0, 100) || '',
        messageCount: firebase.firestore.FieldValue.increment(1)
      };

      if (sender === 'user') {
        const chatRef = this.firestore.collection('chats').doc(this.currentChatId);
        const chatDoc = await chatRef.get();
        const chatData = chatDoc.exists ? chatDoc.data() : null;
        if (chatData && chatData.messageCount === 0) {
          updateData.title = this.generateChatTitle(text);
        }
      }

      await this.firestore.collection('chats').doc(this.currentChatId).update(updateData);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }

  generateChatTitle(firstMessage) {
    let title = (firstMessage || '').substring(0, 40);
    if (title.length === 40) title += '...';
    return title || 'Chat';
  }

  async loadChatHistory() {
    if (!this.user || !this.firestore) return;
    try {
      const chatsRef = this.firestore.collection('chats')
        .where('userId', '==', this.user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(50);

      const snapshot = await chatsRef.get();
      this.chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.renderChatHistory();
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }

  renderChatHistory() {
    const historyList = this.refs.chatHistoryList;
    if (!historyList) return;
    historyList.innerHTML = '';
    this.chats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = `chat-history-item ${chat.id === this.currentChatId ? 'active' : ''}`;
      let time = 'Just now';
      if (chat.updatedAt) {
        try {
          const d = (typeof chat.updatedAt.toDate === 'function') ? chat.updatedAt.toDate() : new Date(chat.updatedAt);
          time = this.formatTimestamp(d);
        } catch (e) {
          time = 'Just now';
        }
      }
      chatItem.innerHTML = `
        <div class="chat-preview">
          <span class="chat-title">${chat.title || 'New Chat'}</span>
          <span class="chat-time">${time}</span>
        </div>
        <p class="chat-snippet">${chat.lastMessage || 'Start a conversation...'}</p>
      `;
      chatItem.addEventListener('click', () => this.loadChat(chat.id));
      historyList.appendChild(chatItem);
    });
  }

  async loadChat(chatId) {
    if (!this.firestore) return;
    try {
      this.currentChatId = chatId;
      this.clearChatMessages();
      const messagesRef = this.firestore.collection('chats').doc(chatId).collection('messages').orderBy('timestamp', 'asc');
      const snapshot = await messagesRef.get();
      if (snapshot.empty) {
        this.addWelcomeMessage();
      } else {
        snapshot.forEach(doc => {
          const m = doc.data();
          if (m.attachmentUrl) {
            const name = (m.text || '').replace('[File: ', '').replace(']', '');
            this.addFileMessageToUI(name, m.attachmentUrl, m.sender);
          } else {
            this.addMessageToUI(m.sender, m.text, false);
          }
        });
      }
      this.renderChatHistory();
      this.scrollToBottom();
    } catch (err) {
      console.error('Error loading chat:', err);
      this.showError('Failed to load chat');
    }
  }

  addMessageToUI(sender, text, scroll = true) {
    const container = this.refs.chatMessages;
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (sender === 'user') {
      div.innerHTML = `
        <div class="message-avatar"><img src="assets/images/avatar-placeholder.jpg" alt="User avatar"></div>
        <div class="message-content">
          <div class="message-sender">You</div>
          <div class="message-text"><p>${this.formatMessageText(text)}</p></div>
          <div class="message-time">${timestamp}</div>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="message-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
          </svg>
        </div>
        <div class="message-content">
          <div class="message-sender">FitForge AI</div>
          <div class="message-text">${this.formatAIResponse(text)}</div>
          <div class="message-time">${timestamp}</div>
        </div>`;
    }
    container.appendChild(div);
    if (scroll) this.scrollToBottom();
  }

  addFileMessageToUI(fileName, fileUrl, sender = 'user') {
    const container = this.refs.chatMessages;
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const fileContent = isImage ? `<img src="${fileUrl}" alt="${fileName}" style="max-width:240px;border-radius:6px;margin-top:8px">` : '';
    div.innerHTML = `
      <div class="message-avatar">${sender === 'user' ? '<img src="assets/images/avatar-placeholder.jpg" alt="User avatar">' : '<svg width="24" height="24" viewBox="0 0 24 24"></svg>'}</div>
      <div class="message-content">
        <div class="message-sender">${sender === 'user' ? 'You' : 'FitForge AI'}</div>
        <div class="message-text">
          <p><strong>File:</strong> ${fileName}</p>
          ${fileContent}
          <a href="${fileUrl}" target="_blank" style="display:inline-block;margin-top:8px;color:var(--primary-500)">Download</a>
        </div>
        <div class="message-time">${timestamp}</div>
      </div>`;
    container.appendChild(div);
    this.scrollToBottom();
  }

  addWelcomeMessage() {
    const container = this.refs.chatMessages;
    if (!container) return;
    container.innerHTML = `
      <div class="message ai-message">
        <div class="message-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24"></svg>
        </div>
        <div class="message-content">
          <div class="message-sender">FitForge AI</div>
          <div class="message-text">
            <p>Hello! I'm your FitForge AI assistant. I can help with workout plans, nutrition, exercise form and progress analysis.</p>
            <p>Ask me anything.</p>
          </div>
          <div class="message-time">Just now</div>
        </div>
      </div>`;
  }

  formatMessageText(text) {
    if (!text) return '';
    return String(text).replace(/\n/g, '<br>');
  }

  formatAIResponse(text) {
    if (!text) return '';
    let formatted = String(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    if (/workout|exercise/i.test(text)) {
      formatted = formatted.replace(/(<strong>.*?Plan.*?<\/strong>)/, '<div class="workout-plan"><h4>$1</h4>') + '</div>';
    }
    return formatted;
  }

  async clearChatHistory() {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) return;
    if (!this.firestore || !this.user) return;
    try {
      this.showLoading('Clearing chat history...');
      const chatsRef = this.firestore.collection('chats').where('userId', '==', this.user.uid);
      const snapshot = await chatsRef.get();
      const deletePromises = [];
      snapshot.forEach(doc => {
        const messagesPromise = this.firestore.collection('chats').doc(doc.id).collection('messages').get().then(msgSnap => {
          const msgDeletes = msgSnap.docs.map(m => m.ref.delete());
          return Promise.all(msgDeletes);
        });
        deletePromises.push(messagesPromise.then(() => doc.ref.delete()));
      });
      await Promise.all(deletePromises);
      this.chats = [];
      this.currentChatId = null;
      this.renderChatHistory();
      this.clearChatMessages();
      this.addWelcomeMessage();
      this.showSuccess('Chat history cleared successfully');
    } catch (err) {
      console.error('Error clearing chat history:', err);
      this.showError('Failed to clear chat history');
    } finally {
      this.hideLoading();
    }
  }

  showTypingIndicator() {
    const container = this.refs.chatMessages;
    if (!container) return;
    if (document.getElementById('typing-indicator')) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><span>FitForge AI is typing...</span>`;
    container.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  updateSendButton(loading) {
    const sendBtn = this.refs.sendBtn;
    if (!sendBtn) return;
    if (loading) {
      sendBtn.disabled = true;
      sendBtn.classList.add('loading');
    } else {
      sendBtn.disabled = false;
      sendBtn.classList.remove('loading');
    }
  }

  scrollToBottom() {
    const container = this.refs.chatMessages;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    let messageTime;
    if (typeof timestamp.toDate === 'function') {
      messageTime = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      messageTime = new Date(timestamp);
    } else {
      messageTime = new Date(timestamp);
    }
    const now = new Date();
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return messageTime.toLocaleDateString([], { weekday: 'short' });
    return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  showError(message) {
    console.error('Chatbot Error:', message);
    // small non-blocking UI feedback
    alert(`Error: ${message}`);
  }

  showSuccess(message) {
    console.log('Chatbot Success:', message);
  }

  showLoading(message) {
    console.log('Loading:', message);
  }

  hideLoading() {
    // no-op for now
  }
}

// init once DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // the page loads Firebase compat scripts; make sure they exist
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not found. Include firebase-app-compat and firebase-firestore-compat in the page.');
  }
  new FitForgeChatbot();
});

export default FitForgeChatbot;
