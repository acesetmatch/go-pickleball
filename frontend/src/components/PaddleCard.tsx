import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaddleCardProps {
  paddle: {
    id: string;
    metadata: {
      brand: string;
      model: string;
    };
    specs: {
      shape: string;
      surface: string;
      average_weight: number;
      core: number;
      paddle_length: number;
      paddle_width: number;
      grip_length: number;
      grip_type: string;
      grip_circumference: number;
    };
    performance: {
      power: number;
      pop: number;
      spin: number;
      twist_weight: number;
      swing_weight: number;
      balance_point: number;
    };
  };
}

export function PaddleCard({ paddle }: PaddleCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/paddles/${paddle.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{paddle.metadata.brand} {paddle.metadata.model}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {paddle.specs.shape} • {paddle.specs.surface}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm"><span className="font-medium">Weight:</span> {paddle.specs.average_weight}g</p>
          <p className="text-sm"><span className="font-medium">Core:</span> {paddle.specs.core}mm</p>
          <p className="text-sm"><span className="font-medium">Dimensions:</span> {paddle.specs.paddle_length}&quot; × {paddle.specs.paddle_width}&quot;</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleViewDetails}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 