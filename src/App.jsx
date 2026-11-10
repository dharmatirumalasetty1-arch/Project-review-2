import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, CalendarDays, ChartNoAxesColumn, CircleUserRound, Footprints,
  Gauge, HeartPulse, House, LogOut, Pause, Play, ShieldCheck, Target,
  Watch, Wifi, WifiOff, X
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@fittrack.com';
const ADMIN_PASS = 'admin123';
const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: House },
  { id: 'activity', label: 'Activity & Workout', icon: ChartNoAxesColumn },
  { id: 'watch', label: 'Smartwatch', icon: Watch },
  { id: 'history', label: 'History', icon: CalendarDays },
  { id: 'goals', label: 'Goals', icon: Target }
];

const readStore = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function seedAdmin() {
  const users = readStore('ft_users', []);
  if (!users.some(user => user.email === ADMIN_EMAIL)) {
    users.push({ name: 'FitTrack Admin', email: ADMIN_EMAIL, password: ADMIN_PASS, role: 'ADMIN', created: new Date().toLocaleDateString() });
    writeStore('ft_users', users);
  }
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  function submit(e) {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    const users = readStore('ft_users', []);
    if (mode === 'login') {
      const user = users.find(u => u.email.toLowerCase() === email && u.password === form.password);
      if (!user) return setError('Incorrect email or password.');
      onLogin(user);
      return;
    }
    if (!form.name.trim() || !email || form.password.length < 6) {
      return setError('Enter your name, a valid email and a password with at least 6 characters.');
    }
    if (users.some(u => u.email.toLowerCase() === email)) return setError('An account with this email already exists.');
    const user = { name: form.name.trim(), email, password: form.password, role: 'USER', created: new Date().toLocaleDateString() };
    writeStore('ft_users', [...users, user]);
    onLogin(user);
  }

  return <section className="auth">
    <div className="hero">
      <div className="brand"><Footprints size={30} /> FitTrack Pro</div>
      <h1>Your health.<br />Your progress.<br />Your data.</h1>
      <p>Track workouts, goals and compatible Bluetooth heart-rate devices in one fitness application.</p>
      <div className="pills"><span>📊 Smart tracking</span><span>⌚ Watch ready</span><span>🔵 Bluetooth BLE</span></div>
      <p><b>10K</b> Step Goal　·　<b>8h</b> Sleep Goal　·　<b>30m</b> Workout Goal</p>
    </div>
    <div className="authside"><div className="authbox">
      <div className="brand authbrand"><Footprints size={28} /> FitTrack</div>
      <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
      <p className="sub">{mode === 'login' ? 'Sign in to continue.' : 'Start tracking your fitness progress.'}</p>
      <form onSubmit={submit}>
        {mode === 'signup' && <label className="field"><span>Full name</span><input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" /></label>}
        <label className="field"><span>Username / Email</span><input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" autoComplete="username" /></label>
        <label className="field"><span>Password {mode === 'signup' && '(minimum 6 characters)'}</span><input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder={mode === 'login' ? 'Enter password' : 'Create a password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        <button className="primary wide" type="submit">{mode === 'login' ? 'Login to Dashboard →' : 'Create account'}</button>
      </form>
      <div className="error">{error}</div>
      <div className="switch">{mode === 'login' ? 'New to FitTrack? ' : 'Already registered? '}<button className="textbutton" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
      {mode === 'login' && <div className="demo"><b>Admin demo</b><br />Email: admin@fittrack.com<br />Password: admin123<br /><small>Local prototype credentials only.</small></div>}
    </div></div>
  </section>;
}

function Metric({ label, value, hint, icon: Icon }) {
  return <div className="card metric-card"><div className="metricline"><span>{label}</span>{Icon && <Icon size={20} />}</div><div className="value">{value}</div><div className="muted">{hint}</div></div>;
}

function Progress({ label, value, goal, unit = '' }) {
  const percent = Math.min(100, Math.max(0, (Number(value) / Math.max(Number(goal), 1)) * 100));
  return <div className="progressrow">
    <div className="progresshead"><span>{label}</span><b>{value}{unit} / {goal}{unit}</b></div>
    <div className="track"><div className="fill" style={{ width: `${percent}%` }} /></div>
  </div>;
}

export default function App() {
  const [current, setCurrent] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [goals, setGoals] = useState({ steps: 10000, water: 8, workout: 30, sleep: 8 });
  const [daily, setDaily] = useState({ steps: 0, water: 0, workout: 0, sleep: 0, calories: 0, distance: 0 });
  const [workouts, setWorkouts] = useState([]);
  const [workoutType, setWorkoutType] = useState('Walking');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [watchMessage, setWatchMessage] = useState('Not connected. Choose Connect device and select your watch.');
  const [btConnected, setBtConnected] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [goalDraft, setGoalDraft] = useState({ steps: 10000, water: 8, workout: 30, sleep: 8 });
  const [toast, setToast] = useState('');
  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { seedAdmin(); }, []);
  useEffect(() => {
    if (!current) return;
    setGoals(readStore(`ft_goals_${current.email}`, { steps: 10000, water: 8, workout: 30, sleep: 8 }));
    setGoalDraft(readStore(`ft_goals_${current.email}`, { steps: 10000, water: 8, workout: 30, sleep: 8 }));
    setWorkouts(readStore(`ft_workouts_${current.email}`, []));
    setDaily(readStore(`ft_daily_${current.email}`, { steps: 0, water: 0, workout: 0, sleep: 0, calories: 0, distance: 0 }));
    setPage('dashboard');
  }, [current]);
  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);
  useEffect(() => () => {
    clearInterval(timerRef.current);
    try { if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect(); } catch {}
  }, []);

  const title = ({ dashboard: 'Fitness Dashboard', activity: 'Activity & Workout', watch: 'Smartwatch', history: 'Workout History', goals: 'Daily Goals', admin: 'Admin Dashboard' })[page] || 'Dashboard';
  const durationText = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const rate = workoutType === 'Running' ? 10 : workoutType === 'Cycling' ? 8 : workoutType === 'Strength training' ? 5 : 4;
  const distanceRate = workoutType === 'Running' ? 0.15 : workoutType === 'Walking' ? 0.08 : workoutType === 'Cycling' ? 0.25 : 0;
  const workoutCalories = Math.round((elapsed / 60) * rate);
  const workoutDistance = (elapsed / 60) * distanceRate;

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  }
  function saveDaily(next) {
    setDaily(next);
    if (current) writeStore(`ft_daily_${current.email}`, next);
  }
  function login(user) { setCurrent(user); }
  function logout() {
    setRunning(false); setWorkoutActive(false); setElapsed(0);
    disconnectWatch();
    setCurrent(null);
  }
  function navigate(next) {
    if (next === 'admin' && current?.role !== 'ADMIN') return;
    setPage(next);
  }
  function startWorkout() {
    if (workoutActive && !running) { setWorkoutActive(true); setRunning(true); return; }
    if (workoutActive) return;
    setWorkoutActive(true); setRunning(true);
  }
  function pauseWorkout() { setRunning(false); }
  function finishWorkout() {
    if (!workoutActive || elapsed === 0) { notify('Start a workout first.'); return; }
    setRunning(false);
    const record = {
      date: new Date().toLocaleString(), type: workoutType, duration: Math.round(elapsed / 60),
      calories: workoutCalories, distance: workoutDistance.toFixed(2)
    };
    const nextWorkouts = [record, ...workouts];
    setWorkouts(nextWorkouts);
    writeStore(`ft_workouts_${current.email}`, nextWorkouts);
    const nextDaily = {
      ...daily, workout: daily.workout + Math.round(elapsed / 60),
      calories: daily.calories + workoutCalories, distance: daily.distance + workoutDistance,
      steps: daily.steps + Math.round(workoutDistance * 1300)
    };
    saveDaily(nextDaily);
    setElapsed(0); setWorkoutActive(false);
    notify('Workout saved successfully.');
  }
  function saveGoals() {
    const next = Object.fromEntries(Object.entries(goalDraft).map(([k, v]) => [k, Math.max(1, Number(v) || 1)]));
    setGoals(next); writeStore(`ft_goals_${current.email}`, next); setGoalMessage('Goals saved.'); notify('Goals updated.');
  }
  async function connectWatch() {
    if (!navigator.bluetooth) {
      setWatchMessage('Web Bluetooth is unavailable. Try Chrome or Edge on localhost/HTTPS.');
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setBtConnected(false); setWatchMessage('Device disconnected.'); setHeartRate(null);
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      characteristicRef.current = characteristic;
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', event => {
        const data = event.target.value;
        const flags = data.getUint8(0);
        setHeartRate((flags & 1) ? data.getUint16(1, true) : data.getUint8(1));
      });
      setBtConnected(true);
      setWatchMessage(`Connected to ${device.name || 'your device'}. Heart rate updates live.`);
    } catch (error) {
      setWatchMessage(`Connection cancelled or failed: ${error.message}`);
    }
  }
  function disconnectWatch() {
    try { if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect(); } catch {}
    deviceRef.current = null; characteristicRef.current = null;
    setBtConnected(false); setHeartRate(null);
    setWatchMessage('Not connected.');
  }

  if (!current) return <Auth onLogin={login} />;

  const navItems = current.role === 'ADMIN' ? [...pages, { id: 'admin', label: 'Admin', icon: ShieldCheck }] : pages;
  const allUsers = readStore('ft_users', []);
  const totalWorkouts = allUsers.reduce((sum, user) => sum + readStore(`ft_workouts_${user.email}`, []).length, 0);

  return <div className="app">
    <aside className="sidebar">
      <div className="sidebrand"><Footprints size={30} /> FitTrack</div>
      <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`navbtn ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} />{label}</button>)}</nav>
      <div className="userbox"><div>Logged in as</div><b>{current.name}</b><small>{current.role}</small><button className="ghost wide" onClick={logout}><LogOut size={17} /> Logout</button></div>
    </aside>
    <main className="main">
      <header className="top">
        <div><h1>{title}</h1><div className="muted">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</div></div>
        <div className="status"><span className={`statusdot ${btConnected ? 'connected' : ''}`} />{btConnected ? 'Bluetooth connected' : 'Bluetooth not connected'}</div>
      </header>

      {page === 'dashboard' && <>
        <div className="cards">
          <Metric label="Steps" value={daily.steps.toLocaleString()} hint={`Goal: ${goals.steps.toLocaleString()}`} icon={Footprints} />
          <Metric label="Heart Rate" value={heartRate ?? '--'} hint="BPM · live when connected" icon={HeartPulse} />
          <Metric label="Calories" value={Math.round(daily.calories)} hint="Estimated today" icon={Activity} />
          <Metric label="Distance" value={`${daily.distance.toFixed(2)} km`} hint="Estimated" icon={Gauge} />
        </div>
        <div className="layout">
          <div className="card"><h2>Today's Progress</h2>
            <Progress label="Steps" value={daily.steps.toLocaleString()} goal={goals.steps.toLocaleString()} />
            <Progress label="Water" value={daily.water} goal={goals.water} unit=" glasses" />
            <Progress label="Workout" value={daily.workout} goal={goals.workout} unit=" min" />
            <Progress label="Sleep" value={daily.sleep} goal={goals.sleep} unit=" h" />
          </div>
          <div className="card"><h2>Tips</h2><div className="notice">Stay hydrated and keep your activity consistent.</div><p className="muted">Connect a compatible heart-rate monitor from the Smartwatch page. Step counts from watches vary by manufacturer and are not universally exposed through browser Bluetooth.</p></div>
        </div>
        <div className="card spaced"><h2>7-Day Steps</h2><p className="muted">{workouts.length ? `You have saved ${workouts.length} workout session(s).` : 'No activity history yet.'}</p></div>
      </>}

      {page === 'activity' && <div className="card">
        <h2>Workout tracker</h2><p className="muted">Start a session; the timer, estimated calories and distance update while it runs. Use your watch's live heart rate when connected.</p>
        <label className="field"><span>Workout type</span><select value={workoutType} onChange={e => setWorkoutType(e.target.value)} disabled={workoutActive}><option>Walking</option><option>Running</option><option>Cycling</option><option>Strength training</option><option>Other</option></select></label>
        <div className="workoutstats">
          <Metric label="Duration" value={durationText} />
          <Metric label="Calories" value={workoutCalories} />
          <Metric label="Distance" value={workoutDistance.toFixed(2)} hint="km" />
        </div>
        <div className="actions">
          <button className="primary" onClick={startWorkout} disabled={running}><Play size={17} /> {workoutActive ? 'Resume workout' : 'Start workout'}</button>
          <button className="ghost" onClick={pauseWorkout} disabled={!running}><Pause size={17} /> Pause</button>
          <button className="danger" onClick={finishWorkout}><X size={17} /> Finish & save</button>
        </div>
        <p className="small">Estimates are approximate and depend on workout type and elapsed time.</p>
      </div>}

      {page === 'watch' && <div className="card watchcard">
        <h2>Bluetooth smartwatch</h2>
        <p>Connect a compatible BLE heart-rate device. Your browser must support Web Bluetooth (typically Chrome or Edge on desktop/Android) and the page must run on localhost or HTTPS.</p>
        <div className="actions"><button className="primary" onClick={connectWatch}><Wifi size={17} /> Connect device</button><button className="ghost" onClick={disconnectWatch}><WifiOff size={17} /> Disconnect</button></div>
        <div className="notice">{watchMessage}</div>
        <p><b>Heart rate:</b> {heartRate ?? '--'} BPM</p>
        <p className="small">This demo reads the standard Heart Rate Service (0x180D). It cannot guarantee step counts or calorie data from every brand.</p>
      </div>}

      {page === 'history' && <div className="card"><h2>Workout history</h2><div className="tablewrap"><table><thead><tr><th>Date</th><th>Workout</th><th>Duration</th><th>Calories</th><th>Distance</th></tr></thead><tbody>
        {workouts.length ? workouts.map((w, i) => <tr key={`${w.date}-${i}`}><td>{w.date}</td><td>{w.type}</td><td>{w.duration} min</td><td>{w.calories}</td><td>{w.distance} km</td></tr>) : <tr><td colSpan="5">No saved workouts yet.</td></tr>}
      </tbody></table></div></div>}

      {page === 'goals' && <div className="card"><h2>Daily goals</h2><div className="formrow">
        {Object.entries({ steps: 'Steps', water: 'Water (glasses)', workout: 'Workout (minutes)', sleep: 'Sleep (hours)' }).map(([key, label]) => <label key={key}>{label}<input type="number" min="1" value={goalDraft[key]} onChange={e => setGoalDraft(prev => ({ ...prev, [key]: e.target.value }))} /></label>)}
      </div><button className="primary spaced" onClick={saveGoals}>Save goals</button><p className="muted">{goalMessage}</p></div>}

      {page === 'admin' && current.role === 'ADMIN' && <>
        <div className="cards">
          <Metric label="Registered accounts" value={allUsers.length} hint="Local prototype" />
          <Metric label="Saved workouts" value={totalWorkouts} hint="Across accounts" />
          <Metric label="Admin role" value="Active" hint="Administrator" />
          <Metric label="Storage" value="Browser" hint="Local storage" />
        </div>
        <div className="card"><h2>Admin — registered accounts</h2><p className="muted">Prototype admin view. Accounts are stored in this browser only; this is not a secure production authentication system.</p><div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>
          {allUsers.map((user, i) => <tr key={`${user.email}-${i}`}><td>{safe(user.name)}</td><td>{safe(user.email)}</td><td>{user.role}</td><td>{user.created || '—'}</td></tr>)}
        </tbody></table></div></div>
      </>}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
