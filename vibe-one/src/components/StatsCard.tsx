import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'primary' | 'warning' | 'success';
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = 'default'
}: StatsCardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300",
            "hover:border-primary/30 hover:shadow-glow",
            variant === 'primary' && "border-primary/20 bg-primary/5",
            variant === 'warning' && "border-yellow-500/20 bg-yellow-500/5",
            variant === 'success' && "border-emerald-500/20 bg-emerald-500/5",
        )}>
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-20",
                variant === 'primary' && "bg-primary",
                variant === 'warning' && "bg-yellow-500",
                variant === 'success' && "bg-emerald-500",
                variant === 'default' && "bg-accent",
            )} />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="font-mono text-3xl font-bold text-foreground">
                        {value}
                    </p>
                    {trend && (
                        <p className={cn(
                            "text-xs font-medium mt-1",
                            trend.isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>

                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    variant === 'primary' && "bg-primary/10 text-primary",
                    variant === 'warning' && "bg-yellow-500/10 text-yellow-400",
                    variant === 'success' && "bg-emerald-500/10 text-emerald-400",
                    variant === 'default' && "bg-accent/10 text-accent",
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
