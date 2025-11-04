import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useCheckout } from '@/hooks/useCheckout';
import { Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cursos() {
  const { courses, loading } = useCourses();
  const { createCheckout, loading: checkoutLoading } = useCheckout();
  const navigate = useNavigate();

  const handlePurchaseCourse = async (course: any) => {
    console.log('🛒 Purchasing course:', course.title);
    
    const result = await createCheckout([{
      type: 'course',
      id: course.id,
      title: course.title,
      price: course.price,
      quantity: 1,
      course_id: course.id
    }]);

    if (result?.success && result.checkout_url) {
      console.log('✅ Redirecting to checkout:', result.checkout_url);
      window.location.href = result.checkout_url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cursos Disponíveis</h1>
            <p className="text-muted-foreground">Escolha um curso para começar sua jornada</p>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground">
              Não há cursos publicados no momento. Volte mais tarde!
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary/40" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-2xl font-bold text-primary">
                        {course.price ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handlePurchaseCourse(course)}
                      disabled={checkoutLoading}
                      size="lg"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Comprar'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
