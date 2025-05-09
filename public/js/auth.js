document.addEventListener('DOMContentLoaded', () => {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const registerForm = document.querySelector('form[action="/register"]');
  
    // Toggle visibility for password fields
    passwordFields.forEach((input) => {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.textContent = 'Show';
      toggle.style.marginLeft = '0.5em';
  
      toggle.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
        toggle.textContent = input.type === 'text' ? 'Hide' : 'Show';
      });
  
      input.parentNode.insertBefore(toggle, input.nextSibling);
    });
  
    // Registration validation
    if (registerForm) {
      const passwordInput = registerForm.querySelector('input[name="password"]');
      const usernameInput = registerForm.querySelector('input[name="username"]');
      const feedback = document.createElement('p');
      feedback.style.fontSize = '0.9em';
      feedback.style.marginTop = '0.25em';
      passwordInput.parentNode.appendChild(feedback);
  
      registerForm.addEventListener('submit', (e) => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
  
        if (username.length < 3) {
          e.preventDefault();
          alert('Username must be at least 3 characters long.');
          return;
        }
  
        if (!isStrongPassword(password)) {
          e.preventDefault();
          alert('Password must include at least 8 characters, a number, a lowercase letter, an uppercase letter, and a special character.');
          return;
        }
      });
  
      passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        feedback.textContent = isStrongPassword(value)
          ? 'Strong password ✓'
          : 'Password should be 8+ chars, include numbers, upper/lowercase, and special chars.';
        feedback.style.color = isStrongPassword(value) ? 'green' : 'red';
      });
    }
  
    function isStrongPassword(pwd) {
      return pwd.length >= 8 &&
        /[a-z]/.test(pwd) &&
        /[A-Z]/.test(pwd) &&
        /[0-9]/.test(pwd) &&
        /[^A-Za-z0-9]/.test(pwd);
    }
  });
  