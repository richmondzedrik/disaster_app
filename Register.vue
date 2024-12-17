/* Add these styles to the existing <style scoped> section */
.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(220, 53, 69, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
  animation: fadeIn 0.3s ease;
}

.error-message::before {
  content: '\f071';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.input {
  width: 100%;
  padding: 1rem;
  padding-right: 2.5rem;
  border: 2px solid rgba(0, 173, 173, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  color: #005C5C;
}

input.success {
  border-color: #198754;
  background-color: rgba(25, 135, 84, 0.05);
}

input.success:focus {
  border-color: #198754;
  box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.1);
}

input.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

input.error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
}

.success-message {
  color: #198754;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(25, 135, 84, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
  animation: fadeIn 0.3s ease;
}

.success-message::before {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.input-wrapper {
  position: relative;
}

.input-status {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
}

.input-status.success {
  color: #198754;
}

.input-status.error {
  color: #dc3545;
}

.password-hint {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.password-hint::before {
  content: '\f05a';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.strength-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  background-color: rgba(108, 117, 125, 0.1);
  transition: all 0.3s ease;
}

.strength-item.valid {
  background-color: rgba(25, 135, 84, 0.1);
}

.strength-item i {
  width: 1rem;
  text-align: center;
}

.strength-item.valid i {
  color: #198754;
}

.strength-item:not(.valid) i {
  color: #dc3545;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}