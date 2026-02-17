import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparkLineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function SparkLine({
  data,
  color = '#16a34a',
  width = 100,
  height = 30,
}: SparkLineProps) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="bg-slate-100 rounded animate-pulse" />
  }

  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
