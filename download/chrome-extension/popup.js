// TruthLayer Chrome Extension - Popup Script

class TruthLayerExtension {
  constructor() {
    this.apiUrl = '';
    this.apiKey = '';
    this.currentMode = 'text';
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.checkConfiguration();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['apiUrl', 'apiKey']);
    this.apiUrl = result.apiUrl || '';
    this.apiKey = result.apiKey || '';
    
    document.getElementById('apiUrl').value = this.apiUrl;
    document.getElementById('apiKey').value = this.apiKey;
  }

  saveSettings() {
    this.apiUrl = document.getElementById('apiUrl').value.trim();
    this.apiKey = document.getElementById('apiKey').value.trim();
    
    chrome.storage.local.set({
      apiUrl: this.apiUrl,
      apiKey: this.apiKey
    }, () => {
      this.showMainPanel();
      this.checkConfiguration();
      this.showToast('Settings saved!');
    });
  }

  checkConfiguration() {
    const notConfigured = document.getElementById('notConfigured');
    const mainContent = document.getElementById('mainPanel');
    
    if (!this.apiUrl || !this.apiKey) {
      notConfigured.classList.remove('hidden');
      document.getElementById('contentInput').disabled = true;
      document.getElementById('verifyBtn').disabled = true;
    } else {
      notConfigured.classList.add('hidden');
      document.getElementById('contentInput').disabled = false;
      document.getElementById('verifyBtn').disabled = false;
    }
  }

  bindEvents() {
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsPanel());
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('closeSettings').addEventListener('click', () => this.showMainPanel());
    document.getElementById('openSettings').addEventListener('click', () => this.showSettingsPanel());

    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });

    // Get selection button
    document.getElementById('getSelection').addEventListener('click', () => this.getSelection());

    // Verify button
    document.getElementById('verifyBtn').addEventListener('click', () => this.verifyContent());

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => this.resetState());

    // Dashboard link
    document.getElementById('dashboardLink').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.apiUrl) {
        chrome.tabs.create({ url: this.apiUrl });
      }
    });
  }

  showSettingsPanel() {
    document.getElementById('settingsPanel').classList.remove('hidden');
    document.getElementById('mainPanel').classList.add('hidden');
  }

  showMainPanel() {
    document.getElementById('settingsPanel').classList.add('hidden');
    document.getElementById('mainPanel').classList.remove('hidden');
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    document.getElementById('textMode').classList.toggle('hidden', mode !== 'text');
    document.getElementById('selectionMode').classList.toggle('hidden', mode !== 'selection');
  }

  async getSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      });
      
      const selection = results[0].result;
      if (selection) {
        document.getElementById('selectedContent').value = selection;
      } else {
        this.showToast('No text selected. Please select text on the page first.', 'error');
      }
    } catch (error) {
      this.showToast('Failed to get selection. Try pasting text manually.', 'error');
    }
  }

  getContent() {
    if (this.currentMode === 'text') {
      return document.getElementById('contentInput').value.trim();
    } else {
      return document.getElementById('selectedContent').value.trim();
    }
  }

  async verifyContent() {
    const content = this.getContent();
    
    if (!content) {
      this.showToast('Please enter content to verify', 'error');
      return;
    }

    if (content.length < 10) {
      this.showToast('Content must be at least 10 characters', 'error');
      return;
    }

    this.showLoading();

    try {
      const response = await fetch(`${this.apiUrl}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.showResults(data.result);
      } else {
        this.showError(data.error || 'Verification failed');
      }
    } catch (error) {
      this.showError('Failed to connect to API. Check your settings.');
    }
  }

  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('verifyBtn').disabled = true;
    document.getElementById('verifyBtnText').textContent = 'Analyzing...';
  }

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('verifyBtn').disabled = false;
    document.getElementById('verifyBtnText').textContent = 'Verify Content';
  }

  showResults(result) {
    this.hideLoading();
    
    // Hide other states
    document.getElementById('error').classList.add('hidden');
    document.getElementById('notConfigured').classList.add('hidden');
    
    // Show results
    const resultsEl = document.getElementById('results');
    resultsEl.classList.remove('hidden');

    // Update score
    const scoreArc = document.getElementById('scoreArc');
    const circumference = 283; // 2 * PI * 45
    const dashArray = (result.trustScore / 100) * circumference;
    scoreArc.setAttribute('stroke-dasharray', `${dashArray} ${circumference}`);
    
    // Update score color
    const colorClass = this.getScoreColorClass(result.trustScore);
    scoreArc.className.baseVal = `score-${colorClass}`;
    
    const scoreNumber = document.getElementById('scoreNumber');
    scoreNumber.textContent = result.trustScore;
    scoreNumber.className = colorClass;

    // Update trust label
    const trustLabel = document.getElementById('trustLabel');
    trustLabel.textContent = result.trustLabel;
    trustLabel.className = `trust-label ${this.getTrustLabelClass(result.trustScore)}`;

    // Update description
    document.getElementById('trustDescription').textContent = result.trustDescription;

    // Update flags
    const flagsEl = document.getElementById('flags');
    const flagsList = document.getElementById('flagsList');
    
    if (result.flags && result.flags.length > 0) {
      flagsEl.classList.remove('hidden');
      flagsList.innerHTML = result.flags.map(flag => 
        `<span class="flag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          ${this.formatFlag(flag)}
        </span>`
      ).join('');
    } else {
      flagsEl.classList.add('hidden');
    }

    // Update analysis
    document.getElementById('analysisText').textContent = result.analysis;

    // Update hash
    document.getElementById('contentHash').textContent = result.contentHash;
  }

  showError(message) {
    this.hideLoading();
    
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('errorText').textContent = message;
  }

  resetState() {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
  }

  getScoreColorClass(score) {
    if (score >= 80) return 'green';
    if (score >= 60) return 'lime';
    if (score >= 40) return 'yellow';
    if (score >= 20) return 'orange';
    return 'red';
  }

  getTrustLabelClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'untrustworthy';
  }

  formatFlag(flag) {
    return flag
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  showToast(message, type = 'success') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: ${type === 'error' ? '#ef4444' : '#10B981'};
      color: white;
      border-radius: 6px;
      font-size: 13px;
      z-index: 100;
      animation: fadeIn 0.2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }
}

// Initialize extension
document.addEventListener('DOMContentLoaded', () => {
  new TruthLayerExtension();
});
