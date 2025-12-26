import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Lock, ShieldCheck, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CreateAccountPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signUp, signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!agreedToTerms) {
            setError('You must agree to the terms and conditions');
            return;
        }

        if (!username.trim() || !displayName.trim()) {
            setError('Username and display name are required');
            return;
        }

        setLoading(true);

        const { error: signUpError } = await signUp(
            email,
            password,
            username.trim(),
            displayName.trim()
        );

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            // Auto sign in after successful signup
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                // If auto sign-in fails, redirect to login
                navigate('/');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <main className="main-content">
            {/* Glassmorphism Card */}
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    width: '100%',
                    maxWidth: '340px',
                    padding: '1.5rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                {/* Header Section */}
                <div className="card-header" style={{ gap: '0.5rem' }}>
                    <div
                        style={{
                            width: '3rem',
                            height: '3rem',
                            background: 'rgba(244, 113, 181, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                        }}
                    >
                        <UserPlus size={24} strokeWidth={1.5} />
                    </div>
                    <h1 style={{ fontSize: '1.15rem' }}>Create your private space</h1>
                    <p style={{ fontSize: '0.75rem' }}>Sign up to start messaging securely.</p>
                </div>

                {/* Form Section */}
                <form className="card-form" onSubmit={handleSubmit} style={{ gap: '0.875rem' }}>
                    {/* Email Field */}
                    <div className="input-group">
                        <label htmlFor="email" style={{ fontSize: '0.75rem' }}>Email</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                style={{ height: '2.25rem', fontSize: '0.8rem', paddingLeft: '2.25rem' }}
                            />
                        </div>
                    </div>

                    {/* Username Field */}
                    <div className="input-group">
                        <label htmlFor="username" style={{ fontSize: '0.75rem' }}>Username</label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon" />
                            <input
                                type="text"
                                id="username"
                                className="form-input"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                                style={{ height: '2.25rem', fontSize: '0.8rem', paddingLeft: '2.25rem' }}
                            />
                        </div>
                    </div>

                    {/* Display Name Field */}
                    <div className="input-group">
                        <label htmlFor="displayName" style={{ fontSize: '0.75rem' }}>Display Name</label>
                        <div className="input-wrapper">
                            <UserPlus size={16} className="input-icon" />
                            <input
                                type="text"
                                id="displayName"
                                className="form-input"
                                placeholder="Your display name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                style={{ height: '2.25rem', fontSize: '0.8rem', paddingLeft: '2.25rem' }}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="input-group">
                        <label htmlFor="password" style={{ fontSize: '0.75rem' }}>Password</label>
                        <div className="input-wrapper">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className="form-input"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                style={{ height: '2.25rem', fontSize: '0.8rem', paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                className="input-action"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="input-group">
                        <label htmlFor="confirmPassword" style={{ fontSize: '0.75rem' }}>Confirm Password</label>
                        <div className="input-wrapper">
                            <ShieldCheck size={16} className="input-icon" />
                            <input
                                type="password"
                                id="confirmPassword"
                                className="form-input"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                style={{ height: '2.25rem', fontSize: '0.8rem', paddingLeft: '2.25rem' }}
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '-0.5rem', marginLeft: '0.25rem' }}>
                            {error}
                        </p>
                    )}

                    {/* Terms Checkbox */}
                    <div className="checkbox-group" style={{ marginTop: '0.25rem' }}>
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            style={{ width: '0.875rem', height: '0.875rem' }}
                        />
                        <label htmlFor="terms" style={{ fontSize: '0.7rem' }}>
                            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="card-actions" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '2.25rem', fontSize: '0.8rem' }}>
                            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                            <ArrowRight size={14} />
                        </button>
                        <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none', height: '2rem', fontSize: '0.75rem' }}>
                            Already have an account? Log in
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default CreateAccountPage;
