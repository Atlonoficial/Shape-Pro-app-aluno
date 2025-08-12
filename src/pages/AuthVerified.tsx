import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export const AuthVerified = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Email confirmado | Shape Pro";
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Email confirmado!</CardTitle>
          <CardDescription>
            Sua conta foi verificada com sucesso. Você já pode começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate("/")}>Ir para Home</Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerified;
