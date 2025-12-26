import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ArrowRight, HelpCircle, Flower2 } from 'lucide-react';

const LoginPage = () => {
    const [accessCode, setAccessCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Test credentials: admin / 1234
        if (accessCode === '1234') {
            navigate('/dashboard');
        } else {
            setError('Invalid access code. Try: 1234');
        }
    };

    return (
        <main className="main-content">
            {/* Glassmorphism Login Card */}
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    width: '100%',
                    maxWidth: '340px',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.25rem',
                }}
            >
                {/* Logo */}
                <div className="logo-container" style={{ transform: 'scale(0.85)' }}>
                    <div className="logo-glow" />
                    <div className="logo-icon">
                        <Flower2 strokeWidth={1.5} />
                    </div>
                </div>

                {/* Header Text */}
                <div className="card-header" style={{ gap: '0.25rem' }}>
                    <h1 style={{ fontSize: '1.25rem' }}>Welcome Back</h1>
                    <p style={{ fontSize: '0.8rem' }}>Enter your access code to unlock Nami.</p>
                </div>

                {/* Login Form */}
                <form className="card-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
                    {/* Access Code Field */}
                    <div className="input-group">
                        <label htmlFor="accessCode" className="sr-only">Access Code</label>
                        <div className="input-wrapper">
                            <KeyRound size={18} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="accessCode"
                                className="form-input"
                                placeholder="Access Code"
                                value={accessCode}
                                onChange={(e) => {
                                    setAccessCode(e.target.value);
                                    setError('');
                                }}
                                autoComplete="current-password"
                                style={{ height: '2.5rem', fontSize: '0.875rem', paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                            />
                            <button
                                type="button"
                                className="input-action"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {error && (
                            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', marginLeft: '0.25rem' }}>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary" style={{ height: '2.5rem', fontSize: '0.875rem' }}>
                        <span>Enter</span>
                        <ArrowRight size={16} />
                    </button>

                    {/* Footer Links */}
                    <div className="card-footer">
                        <Link to="#" className="text-link">
                            Forgot Passkey?
                        </Link>
                        <Link to="#" className="text-link">
                            <HelpCircle size={12} />
                            Help
                        </Link>
                    </div>
                </form>

                {/* Create Account Link */}
                <div style={{ width: '100%' }}>
                    <Link to="/create-account" className="btn btn-ghost" style={{ textDecoration: 'none', height: '2.25rem', fontSize: '0.8rem' }}>
                        Don't have an account? Create one
                    </Link>
                </div>
            </div>

            {/* Version Footer */}
            <footer className="app-footer">
                <p>Nami v0.1.0</p>
            </footer>
        </main>
    );
};

export default LoginPage;
