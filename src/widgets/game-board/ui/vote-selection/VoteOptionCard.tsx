import { Button } from '@/src/shared/ui';
import { VoteOptionItem } from '../../types';
import { VOTE_OPTION_FALLBACK_IMAGE } from './constants';

interface VoteOptionCardProps {
  option: VoteOptionItem;
  isActive?: boolean;
  hoverBorderClass: string;
  titleClassName: string;
  cornerClassName: string;
  descriptionMinHeightClass: string;
  onSelect: (id: number) => void;
}

export function VoteOptionCard({
  option,
  isActive = true,
  hoverBorderClass,
  titleClassName,
  cornerClassName,
  descriptionMinHeightClass,
  onSelect,
}: VoteOptionCardProps) {
  return (
    <article
      className={`w-full shrink-0 group relative bg-zinc-900 border-2 border-zinc-800 p-2 transition-all duration-300 ${isActive ? hoverBorderClass : ''}`}
    >
      <div className="overflow-hidden h-64 border border-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={option.image || VOTE_OPTION_FALLBACK_IMAGE}
          alt={option.name}
          className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-60 scale-100'}`}
        />
      </div>

      <div className="p-4 bg-zinc-900 flex flex-col">
        <h3 className={`text-xl font-bold text-zinc-100 uppercase mb-2 transition-colors ${titleClassName}`}>
          {option.name}
        </h3>
        <p className={`text-sm text-zinc-400 mb-6 ${descriptionMinHeightClass}`}>{option.description}</p>
        <Button className="w-full mt-auto" size="small" onClick={() => onSelect(option.id)}>
          Голосовать
        </Button>
      </div>

      <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${cornerClassName}`} />
    </article>
  );
}
