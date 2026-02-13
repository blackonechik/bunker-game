import { CardType } from '@/shared/types';

const CARD_TYPE_LABELS: Record<CardType, string> = {
  [CardType.PROFESSION]: 'Профессия',
  [CardType.HEALTH]: 'Здоровье',
  [CardType.PHOBIA]: 'Фобия',
  [CardType.INVENTORY]: 'Инвентарь',
  [CardType.TRAIT]: 'Характер',
  [CardType.HOBBY]: 'Хобби',
  [CardType.AGE]: 'Возраст',
  [CardType.SPECIAL]: 'Особая карта',
};

export function getCardTypeLabel(type: CardType): string {
  return CARD_TYPE_LABELS[type] || type;
}
