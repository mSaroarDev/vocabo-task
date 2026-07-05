import { useState, FormEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, User, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { loginUser, registerUser, setCredentials, type User as UserType } from "@/store/slices/authSlice";

interface FormData {
  email: string;
  password: string;
  name?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  submit?: string;
}

const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Invalid email address";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (formData.name && formData.name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  return errors;
};

export interface LoginFormProps {
  onSuccess?: () => void;
  showHeader?: boolean;
}

export default function LoginForm({ onSuccess, showHeader = true }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({ email: "", password: "", name: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await dispatch(
          loginUser({ email: formData.email, password: formData.password })
        ).unwrap();
      } else {
        result = await dispatch(
          registerUser({
            name: formData.name || "",
            email: formData.email,
            password: formData.password,
          })
        ).unwrap();
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      dispatch(setCredentials({ token: result.token, user: result.user as UserType }));

      onSuccess?.();
      navigate("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message;
      if (message) {
        setErrors((prev) => ({ ...prev, submit: message }));
      } else if (error && typeof error === "object" && "message" in error) {
        setErrors((prev) => ({ ...prev, submit: String((error as { message: string }).message) }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/v1/auth/google-login";
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({ email: "", password: "", name: "" });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onSuccess?.()}>
      {showHeader && (
        <DialogHeader>
          <DialogTitle>{isLogin ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Enter your credentials to access your account"
              : "Create your account to get started"}
          </DialogDescription>
        </DialogHeader>
      )}

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange("name")}
                  className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange("email")}
                className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange("password")}
                className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Globe size={18} className="mr-2" />
            Google
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={handleSwitchMode}
              className="ml-1 font-medium text-primary hover:underline cursor-pointer"
              disabled={isLoading}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </Dialog>
  );
}