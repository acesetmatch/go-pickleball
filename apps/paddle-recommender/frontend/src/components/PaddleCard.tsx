import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Image from 'next/image';

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
    image_url?: string;
    buy_url?: string;
    price?: number;
  };
}

export function PaddleCard({ paddle }: PaddleCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/paddles/${paddle.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Paddle Image */}
      {paddle.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={paddle.image_url}
            alt={`${paddle.metadata.brand} ${paddle.metadata.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{paddle.metadata.brand} {paddle.metadata.model}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {paddle.specs.shape} • {paddle.specs.surface}
            </p>
          </div>
          {paddle.price && (
            <Badge variant="secondary" className="text-lg font-bold">
              ${paddle.price}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 space-y-1">
          <p className="text-sm"><span className="font-medium">Weight:</span> {paddle.specs.average_weight}oz</p>
          <p className="text-sm"><span className="font-medium">Core:</span> {paddle.specs.core}mm</p>
          <p className="text-sm"><span className="font-medium">Dimensions:</span> {paddle.specs.paddle_length}&quot; × {paddle.specs.paddle_width}&quot;</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleViewDetails} variant="outline" className="flex-1">
            View Details
          </Button>
          {paddle.buy_url && (
            <Button 
              onClick={() => window.open(paddle.buy_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 