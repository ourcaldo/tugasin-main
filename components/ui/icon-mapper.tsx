import { BookOpen, Target, Lightbulb, TrendingUp, User } from 'lucide-react';

interface IconMapperProps {
  iconName: string;
  className?: string;
}

export function IconMapper({ iconName, className = "h-4 w-4" }: IconMapperProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen: BookOpen,
    Target: Target,
    Lightbulb: Lightbulb,
    TrendingUp: TrendingUp,
    User: User,
  };

  const IconComponent = iconMap[iconName] || BookOpen;
  return <IconComponent className={className} />;
}