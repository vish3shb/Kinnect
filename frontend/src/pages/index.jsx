import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const checkUser = async () => {
        try {
          const res = await fetch("/api/backend/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              avatar_url: session.user.image,
            })
          });
          if (res.ok) {
            const userData = await res.json();
            localStorage.setItem("kinnect_user", JSON.stringify(userData));
            
            if (userData.hall_of_residence) {
              router.push("/dashboard");
            } else {
              router.push("/onboarding");
            }
          } else {
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          router.push("/onboarding");
        }
      };
      
      checkUser();
    }
  }, [status, router, session]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="noise" />
      
      {/* Dynamic Background Orbs */}
      <motion.div 
        animate={{ 
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.2, 0.9, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" 
        style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
      />
      <motion.div 
        animate={{ 
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 0.8, 1.1, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card max-w-md w-full p-6 md:p-10 text-center z-10"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="logo-container">
            <div className="logo-glow" />
            <img 
              src="/logo.png" 
              alt="Kinnect Logo" 
              className="w-full h-full object-cover rounded-2xl relative z-10 shadow-2xl"
            />
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
          >
            Kinnect
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 mb-8 md:mb-10 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] whitespace-nowrap"
          >
            Connect • Discover • Experience
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => signIn("google")}
            className="w-full relative overflow-hidden group bg-white text-black font-bold py-4 px-6 md:py-5 md:px-8 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-500 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 md:w-6 md:h-6 mr-3" />
            <span className="text-base md:text-lg">Continue with Google</span>
            <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 absolute right-8 hidden md:block" />
          </motion.button>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Join 1,000+ students on campus</span>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Floating Decorative Elements */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[20%] w-2 h-2 bg-accent rounded-full blur-[2px] opacity-40"
      />
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 left-[15%] w-3 h-3 bg-sky-500 rounded-full blur-[3px] opacity-30"
      />
    </div>
  );
}
