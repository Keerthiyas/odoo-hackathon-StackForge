import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { isValidEmail, validatePassword } from '../../utils/validators';
import { authService } from '../../api/services';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors: typeof errors = {};

    if (!fullName.trim()) {
      validationErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      validationErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      validationErrors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      validationErrors.email = 'Please provide a valid email address';
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      validationErrors.password = passwordValidation.message;
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      validationErrors.terms = 'You must agree to the Terms of Service';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Customer registration automatically assigns 'customer' role per Mongoose Users schema
      await authService.register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        role: 'customer',
        companyName: companyName.trim() || undefined,
      });

      setIsSubmitting(false);
      navigate('/login?registered=true');
    } catch (err: any) {
      setIsSubmitting(false);
      setApiError(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-2xl shadow-md shadow-blue-500/20 mb-3">
          B
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Brightloop Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Customer Portal Registration & Subscription Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {apiError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  className={`block w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors focus:outline-none ${
                    errors.fullName
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                  placeholder="Jane Doe"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`block w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                  placeholder="jane@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            {/* Company Name (optional) */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="companyName" className="block text-xs font-medium text-slate-700">
                  Company Name
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors focus:outline-none"
                  placeholder="Acme Corporation"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`block w-full pl-9 pr-10 py-2 text-xs rounded-lg border transition-colors focus:outline-none ${
                    errors.password
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-700">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  className={`block w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors focus:outline-none ${
                    errors.confirmPassword
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                  placeholder="Confirm matching password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div>
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 block text-xs text-slate-600 cursor-pointer leading-tight">
                  I agree to the Brightloop <span className="text-blue-600 underline">Terms of Service</span> and{' '}
                  <span className="text-blue-600 underline">Privacy Policy</span>.
                </label>
              </div>
              {errors.terms && <p className="mt-1 text-xs text-rose-600">{errors.terms}</p>}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Registering Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          {/* Link back to login */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
