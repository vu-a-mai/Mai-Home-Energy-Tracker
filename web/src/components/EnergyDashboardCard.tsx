import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/badge'
import { Button } from './ui/Button'

interface EnergyDashboardCardProps {
  title: string
  description: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  ratePeriod?: 'off-peak' | 'mid-peak' | 'on-peak' | 'super-off-peak'
  icon?: string
  onViewDetails?: () => void
}

export function EnergyDashboardCard({
  title,
  description,
  value,
  unit,
  trend,
  ratePeriod,
  icon = '⚡',
  onViewDetails
}: EnergyDashboardCardProps) {
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-red-600'
      case 'down': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getRatePeriodEmoji = (period?: string) => {
    switch (period) {
      case 'off-peak': return '🟢'
      case 'mid-peak': return '🟡'
      case 'on-peak': return '🔴'
      case 'super-off-peak': return '🔵'
      default: return ''
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <span className="mr-2">{icon}</span>
          {title}
        </CardTitle>
        {ratePeriod && (
          <Badge variant={ratePeriod as any}>
            {getRatePeriodEmoji(ratePeriod)} {ratePeriod.replace('-', ' ')}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        <CardDescription className="mt-1">
          {description}
        </CardDescription>
        {trend && (
          <div className={`text-xs mt-2 ${getTrendColor(trend)}`}>
            {trend === 'up' && '↗️ Increased from last period'}
            {trend === 'down' && '↘️ Decreased from last period'}
            {trend === 'neutral' && '➡️ No change from last period'}
          </div>
        )}
        {onViewDetails && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
