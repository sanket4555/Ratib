document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    
    // Generate new captcha on page load
    generateCaptcha();

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate password match
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Validate captcha
        const captchaInput = document.getElementById('captcha').value;
        const captchaText = document.querySelector('.captcha-text').textContent;
        
        if (captchaInput.toUpperCase() !== captchaText) {
            alert('Invalid captcha');
            generateCaptcha();
            return;
        }

        // Get selected interests
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
            .map(checkbox => checkbox.value);

        const formData = {
            email: document.getElementById('email').value,
            username: document.getElementById('username').value,
            password: password,
            confirmPassword: confirmPassword,
            captcha: captchaInput,
            address: document.getElementById('address').value,
            mobileNumber: document.getElementById('mobile-number').value,
            agencyCode: document.getElementById('agency-code').value,
            interests: interests,
            familySize: document.getElementById('family-size').value,
            familyMembers: document.getElementById('family-members').value
        };

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = '/login';
            } else {
                alert(data.message || 'Registration failed');
                generateCaptcha();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration');
            generateCaptcha();
        }
    });
});

// Function to generate captcha
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.querySelector('.captcha-text').textContent = captcha;
} 