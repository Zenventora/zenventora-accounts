import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Fingerprint, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, XCircle } from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type View = "signin" | "signup" | "forgot" | "verify" | "reset" | "dashboard";
type Notice = { type: "success" | "error" | "info"; text: string } | null;

export default function App() {
  const [view, setView] = useState<View>("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session) setView("dashboard");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setView("reset");
      else if (nextSession && event !== "TOKEN_REFRESHED") setView("dashboard");
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const run = async (action: () => Promise<void>) => {
    setLoading(true); setNotice(null);
    try { await action(); }
    catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally { setLoading(false); }
  };

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    });
  };

  const signUp = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      if (data.session) setView("dashboard");
      else { setView("verify"); setNotice({ type: "success", text: "We sent a confirmation email. Open it to verify your address, or enter the 6-digit code if your email contains one." }); }
    });
  };

  const verifyEmail = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "signup" });
      if (error) throw error;
      setNotice({ type: "success", text: "Email verified successfully." });
      setView("dashboard");
    });
  };

  const resendVerification = () => void run(async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: window.location.origin + "/auth/callback" } });
    if (error) throw error;
    setNotice({ type: "success", text: "A new confirmation email has been sent." });
  });

  const sendReset = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setNotice({ type: "success", text: "If an account exists for this email, a password reset link has been sent." });
    });
  };

  const updatePassword = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNotice({ type: "success", text: "Password updated. Your account is ready." });
      setView("dashboard");
    });
  };

  const googleSignIn = () => void run(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) throw error;
  });

  const signOut = () => void run(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setPassword(""); setSession(null); setView("signin");
    setNotice({ type: "success", text: "You have been signed out." });
  });

  const switchView = (next: View) => { setNotice(null); setPassword(""); setView(next); };

  if (!supabaseConfigured) return <Shell><div className="config-card"><div className="brand-mark"><Fingerprint size={25} /></div><p className="eyebrow">SETUP REQUIRED</p><h1>Connect your account service</h1><p className="muted">Add the Supabase project URL and publishable key to the Render environment, then redeploy this site.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code></div></Shell>;

  if ((session && view !== "reset") || view === "dashboard") return <Shell><div className="dashboard-card"><div className="brand-mark"><ShieldCheck size={26} /></div><p className="eyebrow">ZENVENTORA ACCOUNT</p><h1>You're signed in.</h1><p className="muted">Your central account is ready. You can use this identity across connected ZenVentora products as they are integrated.</p><div className="identity"><span className="avatar"><UserRound size={19} /></span><div><strong>{session?.user.user_metadata.full_name || session?.user.user_metadata.name || "ZenVentora user"}</strong><span>{session?.user.email}</span></div><CheckCircle2 className="verified" size={20} /></div><button className="primary full" onClick={signOut} disabled={loading}>{loading ? <LoaderCircle className="spin" size={18}/> : "Sign out"}</button></div></Shell>;

  return <Shell><section className="auth-card">
    <div className="brand-row"><div className="brand-mark"><Fingerprint size={25}/></div><span>ZENVENTORA</span><span className="brand-divider">/</span><span className="brand-sub">ACCOUNTS</span></div>
    <div className="intro"><div className="eyebrow"><Sparkles size={13}/> ONE ACCOUNT. CONNECTED WORK.</div>
      <h1>{view === "signup" ? "Create your account." : view === "forgot" ? "Reset your password." : view === "verify" ? "Check your inbox." : view === "reset" ? "Choose a new password." : "Welcome back."}</h1>
      <p className="muted">{view === "signup" ? "Create your ZenVentora identity to get started." : view === "forgot" ? "We'll send you a secure link to reset your password." : view === "verify" ? "Verify your email address to secure your account." : view === "reset" ? "Use a strong password you haven't used before." : "Sign in to continue to your ZenVentora workspace."}</p>
    </div>

    {notice && <div className={`notice ${notice.type}`}>{notice.type === "error" ? <XCircle size={17}/> : <CheckCircle2 size={17}/>}<span>{notice.text}</span></div>}

    {view === "signin" && <><button className="google-button" onClick={googleSignIn} disabled={loading}><GoogleMark/>Continue with Google</button><div className="separator"><span>or continue with email</span></div><form onSubmit={signIn}>
      <Field label="Email address" icon={<Mail size={17}/>}><input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required/></Field>
      <Field label="Password" icon={<LockKeyhole size={17}/>}><div className="password-wrap"><input type={showPassword?"text":"password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="eye" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></Field>
      <div className="form-meta"><button type="button" className="text-button" onClick={()=>switchView("forgot")}>Forgot password?</button></div>
      <button className="primary full" disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<>Sign in <ArrowRight size={17}/></>}</button>
    </form><p className="switch-copy">New to ZenVentora? <button className="text-button" onClick={()=>switchView("signup")}>Create an account</button></p></>}

    {view === "signup" && <><form onSubmit={signUp}>
      <Field label="Full name" icon={<UserRound size={17}/>}><input autoComplete="name" placeholder="Your name" value={fullName} onChange={e=>setFullName(e.target.value)} required/></Field>
      <Field label="Email address" icon={<Mail size={17}/>}><input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required/></Field>
      <Field label="Create password" icon={<LockKeyhole size={17}/>}><div className="password-wrap"><input type={showPassword?"text":"password"} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="eye" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></Field>
      <p className="helper">Use at least 8 characters. Email verification is required.</p>
      <button className="primary full" disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<>Create account <ArrowRight size={17}/></>}</button>
    </form><p className="switch-copy">Already have an account? <button className="text-button" onClick={()=>switchView("signin")}>Sign in</button></p></>}

    {view === "verify" && <form onSubmit={verifyEmail}><Field label="Email address" icon={<Mail size={17}/>}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></Field><Field label="6-digit verification code" icon={<KeyRound size={17}/>}><input inputMode="numeric" maxLength={6} placeholder="000000" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} required/></Field><button className="primary full" disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<>Verify email <ArrowRight size={17}/></>}</button><button type="button" className="secondary full" onClick={resendVerification} disabled={loading}>Resend confirmation email</button><button type="button" className="back-button" onClick={()=>switchView("signin")}><ArrowLeft size={15}/> Back to sign in</button></form>}

    {view === "forgot" && <form onSubmit={sendReset}><Field label="Email address" icon={<Mail size={17}/>}><input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required/></Field><button className="primary full" disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<>Send reset link <ArrowRight size={17}/></>}</button><button type="button" className="back-button" onClick={()=>switchView("signin")}><ArrowLeft size={15}/> Back to sign in</button></form>}

    {view === "reset" && <form onSubmit={updatePassword}><Field label="New password" icon={<LockKeyhole size={17}/>}><input type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required/></Field><button className="primary full" disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<>Update password <ArrowRight size={17}/></>}</button></form>}
    <div className="security-note"><ShieldCheck size={15}/> Secure authentication powered by Supabase</div>
  </section><footer>© {new Date().getFullYear()} ZenVentora <span>·</span> Built for connected business</footer></Shell>;
}

function Shell({children}:{children:React.ReactNode}) { return <main className="page"><div className="ambient ambient-one"/><div className="ambient ambient-two"/><div className="page-content">{children}</div></main>; }
function Field({label,icon,children}:{label:string;icon:React.ReactNode;children:React.ReactNode}) { return <label className="field"><span className="field-label">{label}</span><span className="input-shell"><span className="input-icon">{icon}</span>{children}</span></label>; }
function GoogleMark(){return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.94c4.47-4.13 7.12-10.2 7.12-17.59z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.65-5.94c-2.13 1.43-4.86 2.27-8.25 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
