import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from 'next/image';

interface PaddleDetailsProps {
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
  onBack: () => void;
}

export function PaddleDetails({ paddle, onBack }: PaddleDetailsProps) {
  return (
    <Card>
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl">{paddle.metadata.brand} {paddle.metadata.model}</CardTitle>
            <div className="text-primary-foreground/80">
              <p>ID: {paddle.id}</p>
            </div>
          </div>
          {paddle.price && (
            <Badge variant="secondary" className="text-2xl font-bold">
              ${paddle.price}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Paddle Image */}
        {paddle.image_url && (
          <div className="mb-8">
            <div className="relative h-64 w-full max-w-md mx-auto">
              <Image
                src={paddle.image_url}
                alt={`${paddle.metadata.brand} ${paddle.metadata.model}`}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Specifications */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Specifications</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Shape</TableCell>
                  <TableCell>{paddle.specs.shape}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Surface</TableCell>
                  <TableCell>{paddle.specs.surface}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Weight</TableCell>
                  <TableCell>{paddle.specs.average_weight}ounces</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Core</TableCell>
                  <TableCell>{paddle.specs.core}mm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Length</TableCell>
                  <TableCell>{paddle.specs.paddle_length}&quot;</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Width</TableCell>
                  <TableCell>{paddle.specs.paddle_width}&quot;</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Grip Length</TableCell>
                  <TableCell>{paddle.specs.grip_length}&quot;</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Grip Type</TableCell>
                  <TableCell>{paddle.specs.grip_type}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Grip Circumference</TableCell>
                  <TableCell>{paddle.specs.grip_circumference}&quot;</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Performance */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Power</TableCell>
                  <TableCell>{paddle.performance.power}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Pop</TableCell>
                  <TableCell>{paddle.performance.pop}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Spin</TableCell>
                  <TableCell>{paddle.performance.spin} RPM</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Twist Weight</TableCell>
                  <TableCell>{paddle.performance.twist_weight}g</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Swing Weight</TableCell>
                  <TableCell>{paddle.performance.swing_weight}g</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Balance Point</TableCell>
                  <TableCell>{paddle.performance.balance_point}cm</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t p-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <div className="flex gap-2">
          {paddle.buy_url && (
            <Button 
              onClick={() => window.open(paddle.buy_url, '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
          )}
          <Button variant="secondary">Compare</Button>
        </div>
      </CardFooter>
    </Card>
  );
} 