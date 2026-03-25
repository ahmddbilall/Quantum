"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { sanitizeReturnPath } from "@/lib/auth-redirect";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: Record<string, string | number | boolean>,
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const loadGoogleIdentityScript = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.google?.accounts?.id) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity script."));
    document.head.appendChild(script);
  });
};

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
    agreeToTerms: false,
  });

  const {
    login,
    register,
    loginWithGoogle,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const redirectAfterAuth = sanitizeReturnPath(searchParams.get("next"));

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(redirectAfterAuth);
    }
  }, [isAuthLoading, isAuthenticated, redirectAfterAuth, router]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let isCancelled = false;

    const setupGoogleButton = async () => {
      try {
        await loadGoogleIdentityScript();

        if (
          isCancelled ||
          !googleButtonRef.current ||
          !window.google?.accounts?.id
        ) {
          return;
        }

        const googleAccountsId = window.google.accounts.id;
        googleButtonRef.current.innerHTML = "";

        googleAccountsId.initialize({
          client_id: googleClientId,
          callback: async (response: GoogleCredentialResponse) => {
            if (!response.credential) {
              toast({
                title: "Google sign-in failed",
                description: "Google did not return a valid credential token.",
                variant: "destructive",
              });
              return;
            }

            setIsLoading(true);
            const result = await loginWithGoogle(response.credential, {
              rememberMe: formData.rememberMe,
            });

            if (result.success) {
              toast({
                title: "Welcome",
                description: "Signed in with Google successfully.",
              });
              router.push(redirectAfterAuth);
            } else {
              toast({
                title: "Google sign-in failed",
                description: result.error || "Unable to sign in with Google.",
                variant: "destructive",
              });
            }
            setIsLoading(false);
          },
        });

        googleAccountsId.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: isLogin ? "signin_with" : "signup_with",
          width: 360,
          logo_alignment: "left",
        });
      } catch {
        toast({
          title: "Google unavailable",
          description: "Could not load Google sign-in. Please try again.",
          variant: "destructive",
        });
      }
    };

    void setupGoogleButton();

    return () => {
      isCancelled = true;
    };
  }, [
    googleClientId,
    formData.rememberMe,
    isLogin,
    loginWithGoogle,
    router,
    toast,
  ]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedName = formData.name.trim();

    if (isLogin) {
      // Handle login
      const result = await login(normalizedEmail, formData.password, {
        rememberMe: formData.rememberMe,
      });

      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push(redirectAfterAuth);
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password",
          variant: "destructive",
        });
      }
    } else {
      if (!normalizedEmail) {
        toast({
          title: "Email required",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        toast({
          title: "Weak password",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password mismatch",
          description: "Password and confirm password must match.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!formData.agreeToTerms) {
        toast({
          title: "Terms required",
          description: "Please agree to the terms to create an account.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle signup
      const result = await register({
        email: normalizedEmail,
        password: formData.password,
        full_name: normalizedName || undefined,
      });

      if (result.success) {
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. Loading...",
        });
        router.push(redirectAfterAuth);
      } else {
        toast({
          title: "Registration Failed",
          description:
            result.error || "Could not create account. Email might be in use.",
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
      agreeToTerms: false,
    });
  };

  const benefits = [
    {
      icon: MessageCircle,
      title: "AI Chatbot Access",
      description:
        "Get personalized news insights with our intelligent AI assistant",
    },
    {
      icon: TrendingUp,
      title: "Personalized Feed",
      description: "Customize your news experience based on your interests",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Stay ahead with instant notifications on breaking news",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Benefits & Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                {isLogin ? (
                  "Welcome Back"
                ) : (
                  <>
                    Join <span className="font-oxanium">Quantum</span>
                  </>
                )}
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                {isLogin
                  ? "Sign in to your account to access personalized news, AI insights, and your watchlist."
                  : "Create your account to unlock the full power of AI-driven news aggregation and personalized content."}
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-xl bg-zinc-900 border border-gray-700"
                >
                  {/* <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div> */}
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Proof */}
            {/* <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-gray-400">News Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Real-time Updates</div>
              </div>
            </div> */}
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-zinc-900 border border-gray-700">
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  {/* <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                    {isLogin ? (
                      <LogIn className="h-8 w-8 text-white" />
                    ) : (
                      <UserPlus className="h-8 w-8 text-white" />
                    )}
                  </div> */}
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  {isLogin ? "Sign In" : "Create Account"}
                </CardTitle>
                <p className="text-gray-400">
                  {isLogin
                    ? "Enter your credentials to access your account"
                    : "Fill in your information to get started"}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="name" className="text-gray-300">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            className="pl-10 bg-transparent border-gray-500 text-white placeholder-gray-500 focus:border-blue-500"
                            required={!isLogin}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="pl-10 bg-transparent border-gray-500 text-white placeholder-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="pl-10 pr-10 bg-transparent border-gray-500 text-white placeholder-gray-500 focus:border-blue-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-300 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <Label
                          htmlFor="confirmPassword"
                          className="text-gray-300"
                        >
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              handleInputChange(
                                "confirmPassword",
                                e.target.value,
                              )
                            }
                            className="pl-10 pr-10 bg-transparent border-gray-500 text-white placeholder-gray-500 focus:border-blue-500"
                            required={!isLogin}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-300 cursor-pointer"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Remember Me / Terms */}
                  <div className="space-y-3">
                    {isLogin ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rememberMe"
                          checked={formData.rememberMe}
                          onCheckedChange={(checked) =>
                            handleInputChange("rememberMe", checked)
                          }
                          className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label
                          htmlFor="rememberMe"
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          Remember me for 30 days
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) =>
                            handleInputChange("agreeToTerms", checked)
                          }
                          className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          required
                        />
                        <Label
                          htmlFor="agreeToTerms"
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          I agree to the{" "}
                          <a
                            href="/terms-of-service"
                            className="text-white hover:underline"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy-policy"
                            className="text-white hover:underline"
                          >
                            Privacy Policy
                          </a>
                        </Label>
                      </div>
                    )}

                    {isLogin && (
                      <div className="text-right">
                        <a
                          href="#"
                          className="text-sm text-white hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 border-1 border-white text-black hover:bg-white hover:text-black bg-white font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {isLogin ? "Sign In" : "Create Account"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                  {googleClientId ? (
                    <div className="flex justify-center">
                      <div
                        ref={googleButtonRef}
                        className="w-full flex justify-center"
                      />
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-500">
                      Google sign-in is unavailable. Add
                      NEXT_PUBLIC_GOOGLE_CLIENT_ID.
                    </p>
                  )}
                </div>

                {/* Toggle Mode */}
                <div className="text-center pt-4">
                  <p className="text-gray-400">
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}{" "}
                    <button
                      onClick={toggleMode}
                      className="text-white hover:underline font-medium cursor-pointer"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthPageContent />
    </Suspense>
  );
}
// import Navbar from "@/components/Navbar";
// import StarryBackground from "@/components/ui/starry-background";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Separator } from "@/components/ui/separator";
// import {
//   Eye,
//   EyeOff,
//   Mail,
//   Lock,
//   User,
//   Github,
//   Chrome,
//   ArrowRight,
//   LogIn,
//   UserPlus,
//   Shield,
//   Zap,
//   TrendingUp,
//   MessageCircle,
// } from "lucide-react";

// export default function AuthPage() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     rememberMe: false,
//     agreeToTerms: false,
//   });

//   const handleInputChange = (field: string, value: string | boolean) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     // Simulate API call
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     console.log(isLogin ? "Login submitted:" : "Signup submitted:", formData);
//     setIsLoading(false);
//   };

//   const toggleMode = () => {
//     setIsLogin(!isLogin);
//     setFormData({
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//       rememberMe: false,
//       agreeToTerms: false,
//     });
//   };

//   const socialProviders = [
//     { name: "Google", icon: Chrome, color: "bg-red-600 hover:bg-red-700" },
//     { name: "GitHub", icon: Github, color: "bg-gray-800 hover:bg-gray-900" },
//   ];

//   const benefits = [
//     {
//       icon: MessageCircle,
//       title: "AI Chatbot Access",
//       description: "Get personalized news insights with our intelligent AI assistant"
//     },
//     {
//       icon: TrendingUp,
//       title: "Personalized Feed",
//       description: "Customize your news experience based on your interests"
//     },
//     {
//       icon: Shield,
//       title: "Secure & Private",
//       description: "Your data is protected with enterprise-grade security"
//     },
//     {
//       icon: Zap,
//       title: "Real-time Updates",
//       description: "Stay ahead with instant notifications on breaking news"
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-black text-white relative overflow-hidden">
//       <StarryBackground starCount={150} opacity={0.4} />
//       <Navbar />

//       <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
//         <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

//           {/* Left Side - Benefits & Info */}
//           <motion.div
//             initial={{ opacity: 0, x: -50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.6 }}
//             className="space-y-8"
//           >
//             <div className="space-y-4">
//               <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                 {isLogin ? "Welcome Back" : "Join Quantum"}
//               </h1>
//               <p className="text-xl text-slate-600 dark:text-slate-300">
//                 {isLogin
//                   ? "Access your personalized news dashboard and AI-powered insights"
//                   : "Create your account to unlock the full power of intelligent news aggregation"
//                 }
//               </p>
//             </div>

//             <div className="grid gap-6">
//               {benefits.map((benefit, index) => (
//                 <motion.div
//                   key={benefit.title}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5, delay: index * 0.1 }}
//                   className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700"
//                 >
//                   <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//                     <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
//                       {benefit.title}
//                     </h3>
//                     <p className="text-sm text-slate-600 dark:text-slate-400">
//                       {benefit.description}
//                     </p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Right Side - Auth Form */}
//           <motion.div
//             initial={{ opacity: 0, x: 50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
//               <CardHeader className="space-y-4 pb-6">
//                 <div className="flex items-center justify-center space-x-2">
//                   <motion.div
//                     animate={{ rotate: isLogin ? 0 : 180 }}
//                     transition={{ duration: 0.3 }}
//                   >
//                     {isLogin ? (
//                       <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
//                     ) : (
//                       <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
//                     )}
//                   </motion.div>
//                   <CardTitle className="text-2xl font-bold text-center">
//                     {isLogin ? "Sign In" : "Create Account"}
//                   </CardTitle>
//                 </div>

//                 <div className="flex items-center justify-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
//                   <span>{isLogin ? "New to Quantum?" : "Already have an account?"}</span>
//                   <Button
//                     variant="link"
//                     onClick={toggleMode}
//                     className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
//                   >
//                     {isLogin ? "Create account" : "Sign in"}
//                   </Button>
//                 </div>
//               </CardHeader>

//               <CardContent className="space-y-6">
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <AnimatePresence mode="wait">
//                     <motion.div
//                       key={isLogin ? "login" : "signup"}
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       transition={{ duration: 0.3 }}
//                       className="space-y-4"
//                     >
//                       {!isLogin && (
//                         <motion.div
//                           initial={{ opacity: 0, x: -20 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           transition={{ delay: 0.1 }}
//                           className="space-y-2"
//                         >
//                           <Label htmlFor="name">Full Name</Label>
//                           <div className="relative">
//                             <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
//                             <Input
//                               id="name"
//                               type="text"
//                               placeholder="Enter your full name"
//                               value={formData.name}
//                               onChange={(e) => handleInputChange("name", e.target.value)}
//                               className="pl-10"
//                               required={!isLogin}
//                             />
//                           </div>
//                         </motion.div>
//                       )}

//                       <div className="space-y-2">
//                         <Label htmlFor="email">Email</Label>
//                         <div className="relative">
//                           <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
//                           <Input
//                             id="email"
//                             type="email"
//                             placeholder="Enter your email"
//                             value={formData.email}
//                             onChange={(e) => handleInputChange("email", e.target.value)}
//                             className="pl-10"
//                             required
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="password">Password</Label>
//                         <div className="relative">
//                           <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
//                           <Input
//                             id="password"
//                             type={showPassword ? "text" : "password"}
//                             placeholder="Enter your password"
//                             value={formData.password}
//                             onChange={(e) => handleInputChange("password", e.target.value)}
//                             className="pl-10 pr-10"
//                             required
//                           />
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
//                             onClick={() => setShowPassword(!showPassword)}
//                           >
//                             {showPassword ? (
//                               <EyeOff className="h-4 w-4 text-slate-500" />
//                             ) : (
//                               <Eye className="h-4 w-4 text-slate-500" />
//                             )}
//                           </Button>
//                         </div>
//                       </div>

//                       {!isLogin && (
//                         <motion.div
//                           initial={{ opacity: 0, x: -20 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           transition={{ delay: 0.2 }}
//                           className="space-y-2"
//                         >
//                           <Label htmlFor="confirmPassword">Confirm Password</Label>
//                           <div className="relative">
//                             <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
//                             <Input
//                               id="confirmPassword"
//                               type={showConfirmPassword ? "text" : "password"}
//                               placeholder="Confirm your password"
//                               value={formData.confirmPassword}
//                               onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
//                               className="pl-10 pr-10"
//                               required={!isLogin}
//                             />
//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="sm"
//                               className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
//                               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                             >
//                               {showConfirmPassword ? (
//                                 <EyeOff className="h-4 w-4 text-slate-500" />
//                               ) : (
//                                 <Eye className="h-4 w-4 text-slate-500" />
//                               )}
//                             </Button>
//                           </div>
//                         </motion.div>
//                       )}
//                     </motion.div>
//                   </AnimatePresence>

//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="remember"
//                         checked={formData.rememberMe}
//                         onCheckedChange={(checked) =>
//                           handleInputChange("rememberMe", !!checked)
//                         }
//                       />
//                       <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400">
//                         {isLogin ? "Remember me" : "I agree to the terms"}
//                       </Label>
//                     </div>
//                     {isLogin && (
//                       <Button variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700">
//                         Forgot password?
//                       </Button>
//                     )}
//                   </div>

//                   <Button
//                     type="submit"
//                     className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? (
//                       <motion.div
//                         animate={{ rotate: 360 }}
//                         transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                         className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
//                       />
//                     ) : (
//                       <>
//                         {isLogin ? "Sign In" : "Create Account"}
//                         <ArrowRight className="ml-2 h-4 w-4" />
//                       </>
//                     )}
//                   </Button>
//                 </form>

//                 <div className="relative">
//                   <Separator />
//                   <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-4 text-sm text-slate-500 dark:text-slate-400">
//                     Or continue with
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   {socialProviders.map((provider) => (
//                     <Button
//                       key={provider.name}
//                       variant="outline"
//                       className="border-2 hover:border-blue-300 dark:hover:border-blue-600"
//                     >
//                       <provider.icon className="mr-2 h-4 w-4" />
//                       {provider.name}
//                     </Button>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </motion.div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }
//     {
//       name: "Facebook",
//       icon: Facebook,
//       color: "bg-blue-600 hover:bg-blue-700",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-[#121212] text-white">
//       <Navbar />

//       <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <Card className="bg-gray-800 border-gray-700">
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl font-bold text-white">
//               {isLogin ? "Welcome Back" : "Create Account"}
//             </CardTitle>
//             <p className="text-gray-400">
//               {isLogin
//                 ? "Sign in to your Quantum account"
//                 : "Join Quantum to get personalized news"}
//             </p>
//           </CardHeader>

//           <CardContent className="space-y-6">
//             {/* Social Login */}
//             <div className="space-y-3">
//               {socialProviders.map((provider) => (
//                 <Button
//                   key={provider.name}
//                   variant="outline"
//                   className={`w-full ${provider.color} border-0 text-white`}
//                 >
//                   <provider.icon className="h-4 w-4 mr-2" />
//                   Continue with {provider.name}
//                 </Button>
//               ))}
//             </div>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <Separator className="w-full bg-gray-600" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-gray-800 px-2 text-gray-400">
//                   Or continue with email
//                 </span>
//               </div>
//             </div>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {!isLogin && (
//                 <div className="space-y-2">
//                   <Label htmlFor="name" className="text-white">
//                     Full Name
//                   </Label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       id="name"
//                       type="text"
//                       placeholder="Enter your full name"
//                       value={formData.name}
//                       onChange={(e) =>
//                         handleInputChange("name", e.target.value)
//                       }
//                       className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
//                       required={!isLogin}
//                     />
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <Label htmlFor="email" className="text-white">
//                   Email
//                 </Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={(e) => handleInputChange("email", e.target.value)}
//                     className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password" className="text-white">
//                   Password
//                 </Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                   <Input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={formData.password}
//                     onChange={(e) =>
//                       handleInputChange("password", e.target.value)
//                     }
//                     className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-4 w-4" />
//                     ) : (
//                       <Eye className="h-4 w-4" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {!isLogin && (
//                 <div className="space-y-2">
//                   <Label htmlFor="confirmPassword" className="text-white">
//                     Confirm Password
//                   </Label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       id="confirmPassword"
//                       type="password"
//                       placeholder="Confirm your password"
//                       value={formData.confirmPassword}
//                       onChange={(e) =>
//                         handleInputChange("confirmPassword", e.target.value)
//                       }
//                       className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
//                       required={!isLogin}
//                     />
//                   </div>
//                 </div>
//               )}

//               {/* Checkboxes */}
//               <div className="space-y-3">
//                 {isLogin && (
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="rememberMe"
//                       checked={formData.rememberMe}
//                       onCheckedChange={(checked) =>
//                         handleInputChange("rememberMe", checked as boolean)
//                       }
//                       className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
//                     />
//                     <Label
//                       htmlFor="rememberMe"
//                       className="text-sm text-gray-400"
//                     >
//                       Remember me
//                     </Label>
//                   </div>
//                 )}

//                 {!isLogin && (
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="agreeToTerms"
//                       checked={formData.agreeToTerms}
//                       onCheckedChange={(checked) =>
//                         handleInputChange("agreeToTerms", checked as boolean)
//                       }
//                       className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
//                       required={!isLogin}
//                     />
//                     <Label
//                       htmlFor="agreeToTerms"
//                       className="text-sm text-gray-400"
//                     >
//                       I agree to the{" "}
//                       <a
//                         href="/terms-of-service"
//                         className="text-blue-400 hover:underline"
//                       >
//                         Terms of Service
//                       </a>{" "}
//                       and{" "}
//                       <a
//                         href="/privacy-policy"
//                         className="text-blue-400 hover:underline"
//                       >
//                         Privacy Policy
//                       </a>
//                     </Label>
//                   </div>
//                 )}
//               </div>

//               <Button
//                 type="submit"
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//               >
//                 {isLogin ? "Sign In" : "Create Account"}
//               </Button>
//             </form>

//             {/* Forgot Password */}
//             {isLogin && (
//               <div className="text-center">
//                 <a href="#" className="text-sm text-blue-400 hover:underline">
//                   Forgot your password?
//                 </a>
//               </div>
//             )}

//             {/* Toggle Login/Register */}
//             <div className="text-center">
//               <p className="text-gray-400">
//                 {isLogin
//                   ? "Don't have an account?"
//                   : "Already have an account?"}{" "}
//                 <button
//                   type="button"
//                   onClick={() => setIsLogin(!isLogin)}
//                   className="text-blue-400 hover:underline"
//                 >
//                   {isLogin ? "Sign up" : "Sign in"}
//                 </button>
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Features */}
//         <div className="mt-8 text-center">
//           <h3 className="text-lg font-semibold text-white mb-4">
//             Why join Quantum?
//           </h3>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
//             <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
//               <h4 className="font-semibold text-white mb-1">
//                 Personalized News
//               </h4>
//               <p className="text-gray-400">
//                 Get news tailored to your interests
//               </p>
//             </div>
//             <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
//               <h4 className="font-semibold text-white mb-1">AI Insights</h4>
//               <p className="text-gray-400">Deep analysis with AI assistance</p>
//             </div>
//             <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
//               <h4 className="font-semibold text-white mb-1">Save Articles</h4>
//               <p className="text-gray-400">Bookmark and organize your reads</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }
