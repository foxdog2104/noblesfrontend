import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import MainLayout from "../layouts/MainLayout";
import loginPhoto from "../assets/images/loginphoto.svg";
import googleIcon from "../assets/images/google.png";
import { ROUTES } from "../constants";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

// Renders the login form and stores the entered email/password in state.
const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveLoggedInUser = (email) => {
    const user = {
      email: email.trim().toLowerCase(),
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem("noblesTestUser", JSON.stringify(user));
    window.dispatchEvent(new Event("nobles-auth-change"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      saveLoggedInUser(userCredential.user.email || formData.email);
      navigate(ROUTES.HOME);
    } catch (firebaseError) {
      if (firebaseError.code === "auth/wrong-password" || firebaseError.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (firebaseError.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(firebaseError.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");

    if (!formData.email) {
      setError("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetMessage("Password reset email sent. Please check your inbox.");
    } catch (firebaseError) {
      if (firebaseError.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Invalid email format. Please enter a valid email.");
      } else {
        setError(firebaseError.message.replace("Firebase: ", ""));
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetMessage("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      saveLoggedInUser(userCredential.user.email || "");
      navigate(ROUTES.HOME);
    } catch (firebaseError) {
      setError(firebaseError.message.replace("Firebase: ", ""));
    }
  };

  return (
    <MainLayout scrollTarget=".login-page">
      <div className="login-page">
        <div className="login-panel">

          {/* Left — image */}
          <div className="login-left">
            <img src={loginPhoto} alt="Model" className="login-image" />
          </div>

          {/* Right — form */}
          <div className="login-right">
            <div className="login-form-inner">
              <div className="login-form-header">
                <h1 className="login-title">Login</h1>
                <p className="login-subtitle">Welcome back</p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && <p className="auth-message auth-message-error">{error}</p>}
                {resetMessage && <p className="auth-message auth-message-success">{resetMessage}</p>}

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email" id="email" name="email" required
                    value={formData.email} onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password" id="password" name="password" required
                    value={formData.password} onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="signin-button" disabled={loading}>
                  {loading ? "Signing In..." : "Login"}
                </button>

                <div className="divider-container">
                  <div className="divider-line" />
                  <span className="divider-text">or continue with</span>
                  <div className="divider-line" />
                </div>

                <div className="social-login">
                  <button type="button" className="social-button" onClick={handleGoogleLogin}>
                    <img src={googleIcon} alt="Google" className="social-icon" />
                  </button>
                </div>

                <div className="login-footer">
                  <button type="button" className="footer-link footer-button" onClick={handleForgotPassword}>Forgot password?</button>
                  <Link to={ROUTES.SIGNUP} className="footer-link">Create an account</Link>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
