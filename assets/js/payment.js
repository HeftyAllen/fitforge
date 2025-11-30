// payment.js - Enhanced Payment Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (replace with your publishable key)
    const stripe = Stripe('pk_test_your_publishable_key_here');
    
    // Plan selection
    const planOptions = document.querySelectorAll('.plan-option');
    const planNameSelected = document.querySelector('.plan-name-selected');
    const planPriceSelected = document.querySelector('.plan-price-selected');
    
    // Payment method tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Currency selector
    const currencySelect = document.getElementById('currency-select');
    
    // Mobile money providers
    const mobileProviders = document.querySelectorAll('input[name="mobile-provider"]');
    const mobilePaymentBtn = document.querySelector('[data-method="mobile"]');
    
    // Cryptocurrency options
    const cryptoOptions = document.querySelectorAll('input[name="crypto"]');
    const cryptoPaymentInfo = document.getElementById('crypto-payment-info');
    
    // Copy buttons
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    // Initialize
    updateOrderSummary('starter');
    generateBankReference();
    setupEventListeners();
    
    function setupEventListeners() {
        // Plan selection
        planOptions.forEach(option => {
            option.addEventListener('change', function() {
                const plan = this.dataset.plan;
                updateOrderSummary(plan);
            });
        });
        
        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchTab(tabId);
            });
        });
        
        // Currency change
        currencySelect.addEventListener('change', function() {
            updatePricesForCurrency(this.value);
        });
        
        // Mobile provider selection
        mobileProviders.forEach(provider => {
            provider.addEventListener('change', function() {
                mobilePaymentBtn.disabled = !this.checked;
            });
        });
        
        // Cryptocurrency selection
        cryptoOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.checked) {
                    showCryptoPaymentInfo(this.value);
                }
            });
        });
        
        // Copy buttons
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const target = this.dataset.clipboardTarget;
                const text = document.querySelector(target).textContent;
                copyToClipboard(text);
                showCopySuccess(this);
            });
        });
        
        // Form submission
        const paymentButtons = document.querySelectorAll('.payment-submit');
        paymentButtons.forEach(button => {
            button.addEventListener('click', function() {
                const method = this.dataset.method;
                processPayment(method);
            });
        });
        
        // Format card number
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ');
                e.target.value = formattedValue || value;
            });
        }
        
        // Format expiry date
        const expiryInput = document.getElementById('expiry-date');
        if (expiryInput) {
            expiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // Format CVC
        const cvcInput = document.getElementById('cvc');
        if (cvcInput) {
            cvcInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
        // Mobile number input
        const mobileNumberInput = document.getElementById('mobile-number');
        if (mobileNumberInput) {
            mobileNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('27')) {
                    value = '+27 ' + value.substring(2);
                }
                e.target.value = value;
            });
        }
    }
    
    function switchTab(tabId) {
        // Update tab buttons
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        
        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }
    
    function updateOrderSummary(plan) {
        const plans = {
            starter: { name: 'Starter Plan', price: 99, features: [
                'Basic workout plans',
                'Nutrition tracking', 
                'Progress analytics',
                'Community access'
            ]},
            pro: { name: 'Pro Plan', price: 199, features: [
                'AI-generated workout plans',
                'Advanced nutrition planning',
                'AI Coaching',
                'Full community access',
                'Run tracking'
            ]},
            elite: { name: 'Elite Plan', price: 399, features: [
                '1-on-1 coaching sessions',
                'Custom meal plans',
                'Priority AI support',
                'Advanced analytics',
                'Custom workout programs'
            ]}
        };
        
        const selectedPlan = plans[plan];
        const vat = selectedPlan.price * 0.15;
        const total = selectedPlan.price + vat;
        
        // Update plan details
        planNameSelected.textContent = selectedPlan.name;
        planPriceSelected.textContent = `R${selectedPlan.price}/month`;
        
        // Update features list
        const featuresList = document.querySelector('.features-list');
        featuresList.innerHTML = selectedPlan.features
            .map(feature => `<li>✓ ${feature}</li>`)
            .join('');
        
        // Update totals
        document.querySelector('.total-line .amount').textContent = `R${selectedPlan.price}.00`;
        document.querySelector('.total-line:nth-child(2) .amount').textContent = `R${vat.toFixed(2)}`;
        document.querySelector('.total-line.total .amount').textContent = `R${total.toFixed(2)}`;
    }
    
    function updatePricesForCurrency(currency) {
        const exchangeRates = {
            ZAR: 1,
            USD: 0.054,
            EUR: 0.049,
            GBP: 0.042,
            AUD: 0.081
        };
        
        const rate = exchangeRates[currency] || 1;
        const symbols = {
            ZAR: 'R',
            USD: '$',
            EUR: '€',
            GBP: '£',
            AUD: 'A$'
        };
        
        const symbol = symbols[currency] || 'R';
        
        // Update plan prices
        const plans = [
            { element: document.querySelector('[data-plan="starter"] .plan-price'), basePrice: 99 },
            { element: document.querySelector('[data-plan="pro"] .plan-price'), basePrice: 199 },
            { element: document.querySelector('[data-plan="elite"] .plan-price'), basePrice: 399 }
        ];
        
        plans.forEach(plan => {
            const convertedPrice = Math.round(plan.basePrice * rate);
            plan.element.innerHTML = `${symbol}${convertedPrice}<span class="period">/month</span>`;
        });
        
        // Update order summary
        const selectedPlan = document.querySelector('input[name="plan"]:checked').value;
        updateOrderSummary(selectedPlan);
    }
    
    function generateBankReference() {
        const reference = 'FF' + Math.random().toString(36).substr(2, 8).toUpperCase();
        const referenceElement = document.getElementById('bank-reference');
        if (referenceElement) {
            referenceElement.textContent = reference;
        }
    }
    
    function showCryptoPaymentInfo(crypto) {
        const cryptoData = {
            btc: { 
                address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                amount: '0.0021 BTC'
            },
            eth: {
                address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                amount: '0.045 ETH'
            },
            ltc: {
                address: 'LSN5z5Fk9ShZ1kUza9fQ2WI6nrZYKT3UcF',
                amount: '0.85 LTC'
            },
            usdc: {
                address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                amount: '113.85 USDC'
            }
        };
        
        const data = cryptoData[crypto];
        if (data && cryptoPaymentInfo) {
            document.getElementById('crypto-address').textContent = data.address;
            document.getElementById('crypto-amount').textContent = data.amount;
            cryptoPaymentInfo.style.display = 'block';
        }
    }
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }
    
    function showCopySuccess(button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
        button.style.color = 'var(--success-500)';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 2000);
    }
    
    function validateForm(method) {
        const termsAgreement = document.getElementById('terms-agreement');
        if (!termsAgreement.checked) {
            alert('You must agree to the terms and conditions');
            return false;
        }
        
        switch (method) {
            case 'card':
                return validateCardForm();
            case 'mobile':
                return validateMobileForm();
            default:
                return true;
        }
    }
    
    function validateCardForm() {
        const requiredFields = [
            'card-number',
            'expiry-date', 
            'cvc',
            'cardholder-name',
            'country',
            'postal-code'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        });
        
        // Validate card number
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            const cardNumber = cardNumberInput.value.replace(/\s/g, '');
            if (cardNumber && !isValidCardNumber(cardNumber)) {
                showFieldError(cardNumberInput, 'Please enter a valid card number');
                isValid = false;
            }
        }
        
        // Validate expiry date
        const expiryInput = document.getElementById('expiry-date');
        if (expiryInput) {
            const expiryDate = expiryInput.value;
            if (expiryDate && !isValidExpiryDate(expiryDate)) {
                showFieldError(expiryInput, 'Please enter a valid expiry date');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function validateMobileForm() {
        const mobileNumber = document.getElementById('mobile-number');
        if (!mobileNumber || !mobileNumber.value.trim()) {
            showFieldError(mobileNumber, 'Mobile number is required');
            return false;
        }
        clearFieldError(mobileNumber);
        return true;
    }
    
    function isValidCardNumber(number) {
        // Simple Luhn algorithm check
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }
    
    function isValidExpiryDate(expiry) {
        const [month, year] = expiry.split('/');
        if (!month || !year) return false;
        
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        
        const expiryMonth = parseInt(month, 10);
        const expiryYear = parseInt(year, 10);
        
        if (expiryMonth < 1 || expiryMonth > 12) return false;
        if (expiryYear < currentYear) return false;
        if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
        
        return true;
    }
    
    function showFieldError(field, message) {
        if (!field) return;
        
        clearFieldError(field);
        field.style.borderColor = 'var(--error-500)';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        errorElement.style.marginTop = 'var(--space-1)';
        
        field.parentNode.appendChild(errorElement);
    }
    
    function clearFieldError(field) {
        if (!field) return;
        
        field.style.borderColor = '';
        const existingError = field.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    async function processPayment(method) {
        if (!validateForm(method)) {
            return;
        }
        
        const submitButton = document.querySelector(`[data-method="${method}"]`);
        if (submitButton) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;
        }
        
        try {
            switch (method) {
                case 'card':
                    await processCardPayment();
                    break;
                case 'paypal':
                    await processPayPalPayment();
                    break;
                case 'bank':
                    showBankTransferSuccess();
                    break;
                case 'mobile':
                    await processMobilePayment();
                    break;
                case 'crypto':
                    showCryptoPaymentSuccess();
                    break;
                default:
                    throw new Error('Unknown payment method');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showErrorMessage(error.message || 'Payment failed. Please try again.');
        } finally {
            if (submitButton) {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        }
    }
    
    async function processCardPayment() {
        // Simulate API call to process card payment
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate for demo
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('Card payment failed. Please check your card details and try again.'));
                }
            }, 2000);
        });
    }
    
    async function processPayPalPayment() {
        // In a real implementation, this would redirect to PayPal
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('PayPal payment failed. Please try again or use another method.'));
                }
            }, 2000);
        });
    }
    
    async function processMobilePayment() {
        const provider = document.querySelector('input[name="mobile-provider"]:checked').value;
        const mobileNumber = document.getElementById('mobile-number').value;
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error(`Mobile payment via ${provider} failed. Please check your number and try again.`));
                }
            }, 2000);
        });
    }
    
    function showBankTransferSuccess() {
        const reference = document.getElementById('bank-reference').textContent;
        alert(`Bank transfer instructions copied!\n\nReference: ${reference}\n\nPlease email proof of payment to payments@fitforge.com\n\nYour account will be activated within 1-2 business days after payment confirmation.`);
        
        // Simulate success after bank transfer
        setTimeout(() => {
            showSuccessMessage('bank');
        }, 100);
    }
    
    function showCryptoPaymentSuccess() {
        const crypto = document.querySelector('input[name="crypto"]:checked').value;
        const amount = document.getElementById('crypto-amount').textContent;
        
        alert(`Cryptocurrency payment initiated!\n\nPlease send ${amount} to the address shown.\n\nPayment will be confirmed after 3 network confirmations.`);
        
        // Simulate success after crypto payment
        setTimeout(() => {
            showSuccessMessage('crypto');
        }, 100);
    }
    
    function showSuccessMessage(method) {
        const methodNames = {
            card: 'Card',
            paypal: 'PayPal',
            bank: 'Bank Transfer',
            mobile: 'Mobile Money',
            crypto: 'Cryptocurrency'
        };
        
        const methodName = methodNames[method] || 'Payment';
        
        // Create success modal
        const modal = document.createElement('div');
        modal.className = 'payment-success-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="success-icon">✓</div>
                <h2>Payment Successful!</h2>
                <p>Your ${methodName} payment has been processed successfully.</p>
                <p>Welcome to FitForge Pro! Redirecting to your dashboard...</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="continue-to-dashboard">Continue to Dashboard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for modal
        const style = document.createElement('style');
        style.textContent = `
            .payment-success-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: var(--z-modal);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            .modal-content {
                position: relative;
                background: var(--surface-primary);
                padding: var(--space-8);
                border-radius: var(--radius-2xl);
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: var(--shadow-xl);
                border: 1px solid var(--border-primary);
            }
            .success-icon {
                width: 80px;
                height: 80px;
                background: var(--success-500);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--text-3xl);
                font-weight: bold;
                margin: 0 auto var(--space-4);
            }
            .modal-content h2 {
                font-size: var(--text-2xl);
                font-weight: var(--font-bold);
                color: var(--text-primary);
                margin-bottom: var(--space-3);
            }
            .modal-content p {
                color: var(--text-secondary);
                margin-bottom: var(--space-3);
            }
            .modal-actions {
                margin-top: var(--space-6);
            }
        `;
        document.head.appendChild(style);
        
        // Handle continue button
        document.getElementById('continue-to-dashboard').addEventListener('click', function() {
            // In a real app, redirect to dashboard
            window.location.href = 'home.html';
        });
        
        // Auto-redirect after 5 seconds
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 5000);
    }
    
    function showErrorMessage(message) {
        // Create error modal
        const modal = document.createElement('div');
        modal.className = 'payment-error-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="error-icon">⚠️</div>
                <h2>Payment Failed</h2>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="try-again">Try Again</button>
                    <button class="btn btn-secondary" id="change-method">Change Payment Method</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for error modal
        const style = document.createElement('style');
        style.textContent = `
            .payment-error-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: var(--z-modal);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .error-icon {
                font-size: var(--text-4xl);
                margin-bottom: var(--space-4);
            }
            .modal-actions {
                display: flex;
                gap: var(--space-3);
                margin-top: var(--space-6);
            }
            .modal-actions .btn {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
        
        // Handle modal buttons
        document.getElementById('try-again').addEventListener('click', function() {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
        
        document.getElementById('change-method').addEventListener('click', function() {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            // Switch to card tab as default alternative
            switchTab('card');
        });
    }
    
    // Add responsive behavior for very small screens
    function handleResponsiveBehavior() {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            
            if (screenWidth <= 480) {
                // Adjust tab buttons for very small screens
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.style.fontSize = 'var(--text-xs)';
                    button.style.padding = 'var(--space-2) var(--space-3)';
                });
                
                // Adjust plan options
                document.querySelectorAll('.plan-option label').forEach(label => {
                    label.style.padding = 'var(--space-3)';
                });
                
                // Adjust payment form padding
                document.querySelectorAll('.payment-form, .alternative-payment').forEach(form => {
                    form.style.padding = 'var(--space-3)';
                });
            } else {
                // Reset styles for larger screens
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.style.fontSize = '';
                    button.style.padding = '';
                });
                
                document.querySelectorAll('.plan-option label').forEach(label => {
                    label.style.padding = '';
                });
                
                document.querySelectorAll('.payment-form, .alternative-payment').forEach(form => {
                    form.style.padding = '';
                });
            }
            
            if (screenWidth <= 360) {
                // Extra small screen adjustments
                document.querySelectorAll('.security-badge').forEach(badge => {
                    badge.style.fontSize = 'var(--text-xs)';
                    badge.style.padding = 'var(--space-1) var(--space-2)';
                });
                
                // Simplify tab button text on very small screens
                document.querySelectorAll('.tab-button').forEach(button => {
                    const text = button.textContent;
                    if (screenWidth <= 320) {
                        if (text.includes('Credit/Debit')) button.textContent = '💳 Card';
                        if (text.includes('PayPal')) button.textContent = '🅿️ PayPal';
                        if (text.includes('Bank')) button.textContent = '🏦 Bank';
                        if (text.includes('Mobile')) button.textContent = '📱 Mobile';
                        if (text.includes('Crypto')) button.textContent = '₿ Crypto';
                    }
                });
            }
        };
        
        // Initial call
        handleResize();
        
        // Listen for resize events
        window.addEventListener('resize', handleResize);
    }
    
    // Initialize responsive behavior
    handleResponsiveBehavior();
});