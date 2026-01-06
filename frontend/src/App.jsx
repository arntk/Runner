import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart2,
  Calendar,
  ChevronRight,
  Clock,
  Heart,
  Lock,
  MapPin,
  Menu,
  TrendingUp,
  User,
  Watch,
  Zap,
  CheckCircle,
  Play
} from 'lucide-react';

// --- Mock Data & Constants ---

const MOCK_USER = {
  name: "Alex Runner",
  vo2max: 54,
  restingHR: 48,
  maxHR: 192,
  thresholdHR: 172, // LTHR
  thresholdPace: "4:15", // min/km
};

const ZONES_DATA = {
  hr: [
    { zone: "Z1 Recovery", range: "< 135 bpm", desc: "Very light, recovery", color: "bg-gray-500", percent: 15 },
    { zone: "Z2 Aerobic", range: "135 - 153 bpm", desc: "Base building, all day pace", color: "bg-primary", percent: 45 },
    { zone: "Z3 Tempo", range: "154 - 168 bpm", desc: "Marathon pace, rhythmic", color: "bg-green-500", percent: 25 },
    { zone: "Z4 Threshold", range: "169 - 175 bpm", desc: "Comfortably hard, 1h effort", color: "bg-accent", percent: 10 },
    { zone: "Z5 VO2 Max", range: "> 175 bpm", desc: "Maximum effort, short intervals", color: "bg-red-500", percent: 5 },
  ],
  pace: [
    { zone: "Recovery", range: "> 5:45 min/km", color: "text-gray-400" },
    { zone: "Easy", range: "5:00 - 5:45 min/km", color: "text-blue-400" },
    { zone: "LT1 (Marathon)", range: "4:30 - 5:00 min/km", color: "text-green-400" },
    { zone: "LT2 (Threshold)", range: "4:05 - 4:25 min/km", color: "text-orange-400" },
    { zone: "VO2 Max", range: "< 3:55 min/km", color: "text-red-400" },
  ]
};

const PREDICTIONS = [
  { distance: "5k", time: "19:45", pace: "3:57 min/km" },
  { distance: "10k", time: "41:10", pace: "4:07 min/km" },
  { distance: "Half Marathon", time: "1:32:15", pace: "4:22 min/km" },
  { distance: "Marathon", time: "3:15:00", pace: "4:37 min/km" },
];

const TRAINING_PLAN = [
  { day: "Mon", type: "Rest", details: "Active recovery or full rest", icon: <User size={16} /> },
  { day: "Tue", type: "Intervals", details: "15 min WU, 6x800m @ VO2, 15 min CD", icon: <Zap size={16} /> },
  { day: "Wed", type: "Easy Run", details: "60 mins @ Easy Zone", icon: <Heart size={16} /> },
  { day: "Thu", type: "Tempo", details: "20 min WU, 30 min @ LT2, 10 min CD", icon: <Activity size={16} /> },
  { day: "Fri", type: "Recovery", details: "40 mins very easy", icon: <User size={16} /> },
  { day: "Sat", type: "Long Run", details: "120 mins with last 30 @ LT1", icon: <MapPin size={16} /> },
  { day: "Sun", type: "Cross Train", details: "Cycling or Swimming 45 mins", icon: <Watch size={16} /> },
];

// --- Components ---

const Button = ({ children, onClick, className = "", variant = "primary", icon: Icon }) => {
  const baseStyle = "flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 shadow-lg";
  const variants = {
    primary: "bg-primary hover:bg-blue-600 text-white shadow-blue-500/25",
    secondary: "bg-surface hover:bg-slate-700 text-white border border-slate-700",
    outline: "bg-transparent border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white",
    garmin: "bg-black hover:bg-slate-900 text-white border border-slate-800 shadow-xl"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="mr-2 w-5 h-5" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = "", delay = 0 }) => (
  <div
    className={`bg-surface border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fadeInUp ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const StatBox = ({ label, value, sub, icon: Icon, colorClass, iconBgClass }) => (
  <div className="flex items-center space-x-4">
    <div className={`p-4 rounded-2xl ${iconBgClass}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);

const ActivityList = ({ activities }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr>
          <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Date</th>
          <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Type</th>
          <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Distance</th>
          <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Time</th>
          <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Avg HR</th>
        </tr>
      </thead>
      <tbody>
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-0">
              <td className="p-3 text-sm text-slate-300 font-mono">{new Date(activity.date).toLocaleDateString()}</td>
              <td className="p-3 text-sm text-white font-medium capitalize">{activity.type}</td>
              <td className="p-3 text-sm text-slate-300 font-mono">{(activity.distance / 1609.34).toFixed(2)} mi</td>
              <td className="p-3 text-sm text-slate-300 font-mono">{new Date(activity.duration * 1000).toISOString().substr(11, 8)}</td>
              <td className="p-3 text-sm text-slate-300 font-mono">
                {activity.avg_hr ? (
                  <span className={`px-2 py-0.5 rounded ${activity.avg_hr > 160 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {Math.round(activity.avg_hr)} bpm
                  </span>
                ) : '-'}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="p-4 text-center text-slate-500 text-sm">
              No recent activities found. Connect Strava to sync data.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// --- Views ---

const LoginView = ({ onLogin }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-midnight relative overflow-hidden">
    {/* Abstract Background Shapes */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
    </div>

    <div className="z-10 w-full max-w-md p-10 bg-midnight/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl text-center">
      <div className="mb-8 flex justify-center">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
          <Activity className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
      <p className="text-slate-400 mb-10">Connect your device to analyze your performance.</p>

      <Button onClick={onLogin} variant="accent" className="w-full mb-4 bg-[#fc4c02] hover:bg-[#e34402] border-none text-white">
        Connect with Strava
      </Button>

      <p className="text-xs text-slate-600 mt-8">
        Secure connection powered by Strava.
      </p>
    </div>
  </div>
);

const LoadingView = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-midnight z-50">
      <div className="w-64">
        <div className="flex justify-between mb-2">
          <span className="text-secondary font-mono text-xs tracking-wider">SYNCING DATA</span>
          <span className="text-white font-mono text-xs">{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showToast, setShowToast] = useState(true);
  const [latestActivity, setLatestActivity] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Fetch latest activity with AI feedback
    fetch(`${import.meta.env.VITE_API_URL}/api/activity/latest`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) {
          setLatestActivity(data);
        }
      })
      .catch(err => console.error("Failed to fetch latest activity", err));

    // Fetch recent activities list
    fetch(`${import.meta.env.VITE_API_URL}/api/activities`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setRecentActivities(data);
        }
      })
      .catch(err => console.error("Failed to fetch recent activities", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card delay={100}>
                <StatBox
                  label="VO2 Max"
                  value={MOCK_USER.vo2max}
                  sub="Top 5% for your age"
                  icon={Activity}
                  colorClass="text-secondary"
                  iconBgClass="bg-secondary/10"
                />
              </Card>
              <Card delay={200}>
                <StatBox
                  label="Threshold Pace"
                  value={MOCK_USER.thresholdPace}
                  sub="/km"
                  icon={TrendingUp}
                  colorClass="text-accent"
                  iconBgClass="bg-accent/10"
                />
              </Card>
              <Card delay={300}>
                <StatBox
                  label="Resting HR"
                  value={MOCK_USER.restingHR}
                  sub="bpm"
                  icon={Heart}
                  colorClass="text-red-500"
                  iconBgClass="bg-red-500/10"
                />
              </Card>
            </div>

            {/* Analysis Chart: Time in Zones */}
            <Card delay={400} className="relative overflow-hidden">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-1 h-6 bg-secondary rounded-full"></div>
                  <h3 className="text-xl font-bold text-white">Training Distribution</h3>
                </div>
                <p className="text-slate-400 text-sm ml-4">Time spent in heart rate zones (Last 4 Weeks)</p>
              </div>

              <div className="space-y-6">
                {ZONES_DATA.hr.map((z, i) => (
                  <div key={i} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-300">{z.zone}</span>
                      <span className="text-sm font-bold text-white">{z.percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${z.color} opacity-90 transition-all duration-1000 ease-out`}
                        style={{ width: `${z.percent}%`, animationDelay: `${i * 100 + 500}ms` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>



              {/* AI Coach Feedback Card */}
              {
                latestActivity && latestActivity.ai_feedback && (
                  <div className="mt-8 pt-6 border-t border-slate-800 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
                    <div className="flex items-start space-x-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20">
                      <div className="bg-primary/20 p-3 rounded-xl">
                        <Zap className="text-primary w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-2">Coach's Insight</h4>
                        <p className="text-slate-300 leading-relaxed italic">
                          "{latestActivity.ai_feedback}"
                        </p>
                        <p className="text-xs text-slate-500 mt-2 font-mono">
                          Analyzed: {new Date(latestActivity.date).toLocaleDateString()} • {latestActivity.type}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

            </Card >

            {/* Recent Activities List */}
            <Card delay={500}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-xl font-bold text-white">Recent Training History</h3>
              </div>
              <ActivityList activities={recentActivities} />
            </Card>
          </div >
        );

      case 'zones':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card delay={100}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-white">Zone Definitions</h3>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700">Based on LTHR</span>
                </div>
                <div className="space-y-3">
                  {ZONES_DATA.hr.map((z, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${z.color}`}></div>
                        <div>
                          <p className="text-white font-medium text-sm">{z.zone}</p>
                          <p className="text-xs text-slate-500">{z.desc}</p>
                        </div>
                      </div>
                      <span className="text-slate-300 font-mono font-bold text-sm bg-midnight px-2 py-1 rounded">{z.range}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card delay={200}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-6 bg-secondary rounded-full"></div>
                    <h3 className="text-xl font-bold text-white">Pace Zones</h3>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700">Based on 5k/10k</span>
                </div>
                <div className="space-y-3">
                  {ZONES_DATA.pace.map((z, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                      <div>
                        <p className={`font-medium text-sm ${z.color}`}>{z.zone}</p>
                      </div>
                      <span className="text-slate-300 font-mono font-bold text-sm bg-midnight px-2 py-1 rounded">{z.range}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'plan':
        return (
          <div className="animate-fadeIn">
            <Card>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white">This Week's Plan</h3>
                  <p className="text-slate-400 mt-1">Phase: <span className="text-secondary">Base Building</span> • Week 4 of 12</p>
                </div>
                <Button variant="outline" className="text-xs py-2 px-4 h-10">Regenerate Plan</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {TRAINING_PLAN.map((day, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${day.type === 'Rest' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-800 border-slate-700'} hover:border-primary/50 transition-all group relative overflow-hidden`}>
                    {day.type !== 'Rest' && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>}
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">{day.day}</span>
                      <div className={`p-2 rounded-lg ${day.type === 'Rest' ? 'bg-slate-800 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                        {day.icon}
                      </div>
                    </div>
                    <h4 className="text-white font-bold mb-2">{day.type}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{day.details}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'predictions':
        return (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <Card>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-white">Race Predictor</h3>
                </div>
                <div className="space-y-2">
                  {PREDICTIONS.map((pred, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 px-3 rounded-lg transition-colors">
                      <span className="text-slate-400 font-medium">{pred.distance}</span>
                      <div className="text-right">
                        <div className="text-white font-bold font-mono text-lg">{pred.time}</div>
                        <div className="text-slate-600 text-xs font-mono">{pred.pace}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="p-8 bg-gradient-to-br from-surface to-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-3xl font-bold text-white mb-4">Your Potential</h2>
                <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                  Based on your recent VO2 Max of <span className="text-secondary font-bold">54</span> and Lactate Threshold data,
                  you are currently trending towards a sub-3:20 marathon.
                </p>
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-start">
                    <div className="bg-primary/20 p-2 rounded-lg mr-4">
                      <Zap className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base mb-1">AI Coach Recommendation</h4>
                      <p className="text-slate-300 text-sm">Increase tempo run duration by 5 mins next week to improve 10k time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-slate-200 font-sans selection:bg-primary/30">

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce-in">
          <div className="bg-green-500/20 p-2 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <span className="font-semibold">Data successfully loaded from Garmin</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-midnight/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/20 p-2.5 rounded-xl">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">TKTrainingAgent</span>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-2">
              {[
                { id: 'analysis', label: 'Analysis' },
                { id: 'zones', label: 'Zones' },
                { id: 'plan', label: 'Training Plan' },
                { id: 'predictions', label: 'Predictions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user.name || MOCK_USER.name}</p>
                <div className="flex items-center justify-end space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-slate-500">Connected</p>
                </div>
              </div>
              <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Menu */}
        <div className="md:hidden border-t border-slate-800 overflow-x-auto scrollbar-hide">
          <div className="flex p-2 space-x-2 min-w-max">
            {[
              { id: 'analysis', label: 'Analysis' },
              { id: 'zones', label: 'Zones' },
              { id: 'plan', label: 'Plan' },
              { id: 'predictions', label: 'Predict' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-slate-500'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {renderContent()}
      </main>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [authState, setAuthState] = useState('login');
  const [userData, setUserData] = useState(MOCK_USER);

  const handleLogin = async () => {
    try {
      setAuthState('loading');
      // Fetch Strava Auth URL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/strava/url`, { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No auth URL returned");
        setAuthState('login');
      }
    } catch (e) {
      console.error("Login failed", e);
      setAuthState('login');
    }
  };

  const handleLoadComplete = () => {
    setAuthState('dashboard');
  };

  useEffect(() => {
    // Check for Strava OAuth Code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setAuthState('loading');
      // Exchange code for token
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/strava/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            // Remove code from URL to clean up
            window.history.replaceState({}, document.title, "/");

            if (data.user) {
              setUserData(prev => ({
                ...prev,
                name: data.user.name
              }));
            }
            setAuthState('dashboard'); // Or 'loading' then dashboard
          } else {
            console.error("Auth callback failed", data);
            setAuthState('login');
          }
        })
        .catch(err => {
          console.error("Auth error", err);
          setAuthState('login');
        });
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-fadeIn {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounceIn {
            0% { transform: translateY(100px) scale(0.9); opacity: 0; }
            60% { transform: translateY(-10px) scale(1.02); opacity: 1; }
            100% { transform: translateY(0) scale(1); }
        }
        .animate-bounce-in {
            animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {authState === 'login' && <LoginView onLogin={handleLogin} />}
      {authState === 'loading' && <LoadingView onComplete={handleLoadComplete} />}
      {authState === 'dashboard' && <Dashboard user={userData} />}
    </>
  );
};

export default App;
