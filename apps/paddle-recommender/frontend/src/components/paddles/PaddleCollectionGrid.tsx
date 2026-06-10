'use client';

import { CellComponentProps, Grid } from 'react-window';
import { CombinedPaddle } from '@/services/fetch';
import { CombinedPaddleCard } from '@/components/paddles/CombinedPaddleCard';
import { useElementSize } from '@/hooks/useElementSize';

interface PaddleCollectionGridProps {
  paddles: CombinedPaddle[];
}

export function PaddleCollectionGrid({ paddles }: PaddleCollectionGridProps) {
  if (paddles.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No paddles found for this brand.
      </p>
    );
  }

  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const gap = 16;
  const cardHeight = 320;

  if (!width || !height) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paddles.map((paddle, index) => (
          <CombinedPaddleCard
            key={`${paddle.company}-${paddle.paddleName}-${index}`}
            paddle={paddle}
          />
        ))}
      </div>
    );
  }

  const columnCount = width < 640 ? 1 : width < 768 ? 2 : width < 1024 ? 3 : 4;
  const columnWidth = Math.max(
    200,
    Math.floor((width - gap * (columnCount - 1)) / columnCount)
  );
  const rowHeight = cardHeight + gap;
  const rowCount = Math.ceil(paddles.length / columnCount);

  type PaddleCellProps = {
    paddles: CombinedPaddle[];
    columnCount: number;
  };

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
    paddles: cellPaddles,
    columnCount: cellColumnCount,
  }: CellComponentProps<PaddleCellProps>) => {
    const itemIndex = rowIndex * cellColumnCount + columnIndex;
    if (itemIndex >= cellPaddles.length) {
      return null;
    }

    const paddle = cellPaddles[itemIndex];
    return (
      <div style={style} className="pr-4 pb-4">
        <CombinedPaddleCard className="h-full" paddle={paddle} />
      </div>
    );
  };

  const cellProps: PaddleCellProps = {
    paddles,
    columnCount,
  };

  return (
    <div ref={ref} className="h-[70vh] min-h-[400px]">
      <Grid
        cellComponent={Cell}
        cellProps={cellProps}
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
      />
    </div>
  );
}
