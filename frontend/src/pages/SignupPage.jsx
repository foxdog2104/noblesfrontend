import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import loginPhoto from '../assets/images/loginphoto.svg';
import googleIcon from '../assets/images/google.png';
import { ROUTES } from '../constants';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './SignupPage.css';

// Renders the signup form and controls password visibility toggles.
const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const isValid =
      password.length >= 8
      && password.length <= 20
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return isValid ? null : 'Invalid password. Please meet all requirements listed.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber,
        createdAt: new Date(),
      });

      localStorage.setItem('noblesTestUser', JSON.stringify({
        email: formData.email.trim().toLowerCase(),
        loggedInAt: new Date().toISOString(),
      }));
      window.dispatchEvent(new Event('nobles-auth-change'));
      navigate(ROUTES.HOME);
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please use a different email.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email format. Please enter a valid email.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Weak password. Please choose a stronger password.');
      } else {
        setError(firebaseError.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout scrollTarget=".signup-page">
      <div className="signup-page">
        <div className="signup-panel">

          {/* Left — image */}
          <div className="signup-left">
            <img src={loginPhoto} alt="Model" className="signup-image" />
          </div>

          {/* Right — form */}
          <div className="signup-right">
            <div className="signup-form-inner">
              <div className="signup-form-header">
                <h1 className="signup-title">Sign Up</h1>
                <p className="signup-subtitle">Create your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && <p className="auth-message auth-message-error">{error}</p>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <input type="text" id="firstName" name="firstName" required
                      value={formData.firstName} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input type="text" id="lastName" name="lastName" required
                      value={formData.lastName} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" id="email" name="email" required
                      value={formData.email} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" required
                      value={formData.phoneNumber} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password" name="password" required
                        value={formData.password} onChange={handleInputChange} className="form-input"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                        👁
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword" name="confirmPassword" required
                        value={formData.confirmPassword} onChange={handleInputChange} className="form-input"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((v) => !v)}>
                        👁
                      </button>
                    </div>
                  </div>
                </div>

                <div className="password-requirements">
                  <p className="requirements-title">Password requirements</p>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>At least 1 uppercase letter</li>
                    <li>At least 1 lowercase letter</li>
                    <li>At least 1 number</li>
                    <li>At least 1 special character (!@#$% etc.)</li>
                  </ul>
                </div>

                <button type="submit" className="signup-button" disabled={loading}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </button>

                <div className="divider-container">
                  <div className="divider-line" />
                  <span className="divider-text">or continue with</span>
                  <div className="divider-line" />
                </div>

                <div className="social-login">
                  <button type="button" className="social-button">
                    <img src={googleIcon} alt="Google" className="social-icon" />
                  </button>
                </div>

                <div className="signup-footer">
                  <Link to={ROUTES.LOGIN} className="footer-link">Already have an account? Sign in</Link>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default SignupPage;
