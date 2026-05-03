import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const HALLS = Array.from({length: 15}, (_, i) => `Hall ${i + 1}`).concat(["GH Tower", "Other"]);
const AVAILABLE_INTERESTS = [
  "Running", "Swimming", "Travel", "Reading", "Gaming", 
  "Coding", "Music", "Photography", "Cooking", "Fitness", 
  "Movies", "Art", "Startups", "Sports", "Nature"
];

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hall, setHall] = useState("");
  const [name, setName] = useState("");
  const [interests, setInterests] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session?.user) {
      if (session.user.image && !avatarUrl) setAvatarUrl(session.user.image);
      if (session.user.name && !name) setName(session.user.name);
    }
  }, [status, router, session]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hall) return;
    setLoading(true);

    try {
      const res = await fetch("/api/backend/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: name || session.user.name,
          avatar_url: avatarUrl || session.user.image,
          hall_of_residence: hall,
          interests: interests.join(",")
        })
      });

      if (res.ok) {
        const userData = await res.json();
        // Save user id/hall to local storage for quick access
        localStorage.setItem("kinnect_user", JSON.stringify(userData));
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full p-8 z-10"
      >
        <h2 className="text-2xl font-bold mb-2">Welcome to Kinnect!</h2>
        <p className="text-gray-400 text-sm mb-6">Complete your profile to get started.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input 
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hall of Residence</label>
            <select 
              value={hall}
              onChange={(e) => setHall(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors appearance-none"
              required
            >
              <option value="" disabled className="text-gray-500">Select your Hall</option>
              {HALLS.map(h => (
                <option key={h} value={h} className="bg-[#09090b]">{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
            <div className="flex items-center space-x-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-xs text-gray-500">None</div>
              )}
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Upload a picture or provide a URL below.</p>
            <input 
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Interests (Select up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map(interest => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">{interests.length}/5 selected</p>
          </div>

          <button
            type="submit"
            disabled={!hall || !avatarUrl || interests.length === 0 || !name || loading}
            className="w-full bg-accent text-white font-semibold py-3 px-6 rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue to Dashboard"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
